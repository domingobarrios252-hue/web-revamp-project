import { describe, expect, mock, test } from "bun:test";

// Exercise the real handler with no session, database writes or AI requests.
mock.module("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      inputValidator: () => builder,
      handler: (fn: unknown) => fn,
    };
    return builder;
  },
}));
mock.module("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));

const calls: { action: string; max: number; window: number }[] = [];
let siteResult: { data: boolean | null; error: unknown };
let newsResult: { data: boolean | null; error: unknown };
mock.module("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    rpc: async (_name: string, args: { _action: string; _max_hits: number; _window_seconds: number }) => {
      calls.push({ action: args._action, max: args._max_hits, window: args._window_seconds });
      return args._action === "ai_translate_site" ? siteResult : newsResult;
    },
  },
}));

const { translateNews } = await import("@/lib/news/translations.functions");
const invoke = translateNews as unknown as (input: unknown) => Promise<unknown>;
const newsId = "00000000-0000-0000-0000-000000000001";
function context(allowed = true) {
  const query = {
    select: () => query,
    eq: () => query,
    single: async () => ({ data: { id: newsId, title: "Original", content_blocks: [] }, error: null }),
    maybeSingle: async () => ({ data: null, error: null }),
  };
  return {
    userId: newsId,
    supabase: {
      from: () => query,
      rpc: async (name: string) => {
        if (name === "check_rate_limit") throw new Error("Quota must not use the user client");
        return { data: name === "account_is_active" || allowed, error: null };
      },
    },
  };
}
function reset() {
  calls.length = 0;
  siteResult = { data: true, error: null };
  newsResult = { data: false, error: null };
}

describe("translation quota permission regression", () => {
  test("authorized handler uses privileged quota RPC with unchanged 30/site and 3/article over 86400 seconds", async () => {
    reset();
    await expect(invoke({ data: { newsId }, context: context() })).rejects.toThrow("3 intentos");
    expect(calls).toEqual([
      { action: "ai_translate_site", max: 30, window: 86400 },
      { action: "ai_translate_news", max: 3, window: 86400 },
    ]);
  });
  test("exhausted site quota stops before article quota or AI", async () => {
    reset(); siteResult.data = false;
    await expect(invoke({ data: { newsId }, context: context() })).rejects.toThrow("30 intentos");
    expect(calls.length).toBe(1);
  });
  test("RPC failure is not reported as exhausted capacity", async () => {
    reset(); siteResult = { data: null, error: { code: "42501" } };
    await expect(invoke({ data: { newsId }, context: context() })).rejects.toThrow("No se pudo comprobar el límite de traducciones");
    expect(calls.length).toBe(1);
  });
  test("article RPC failure is not reported as exhausted capacity", async () => {
    reset(); newsResult = { data: null, error: { code: "42501" } };
    await expect(invoke({ data: { newsId }, context: context() })).rejects.toThrow("No se pudo comprobar el límite de esta noticia");
  });
  test("unauthorized editorial access never reaches privileged quota RPC", async () => {
    reset();
    await expect(invoke({ data: { newsId }, context: context(false) })).rejects.toThrow("No tienes permiso");
    expect(calls.length).toBe(0);
  });
});