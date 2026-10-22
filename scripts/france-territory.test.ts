import { describe, expect, mock, test } from "bun:test";
import { FRANCE, MIAMI, PORTUGAL } from "../src/lib/territory/territories";

const calls: unknown[][] = [];
const query = {
  select(...args: unknown[]) { calls.push(["select", ...args]); return this; },
  eq(...args: unknown[]) { calls.push(["eq", ...args]); return this; },
  order(...args: unknown[]) { calls.push(["order", ...args]); return this; },
  limit(...args: unknown[]) { calls.push(["limit", ...args]); return Promise.resolve({ data: [] }); },
};
mock.module("react", () => ({
  useState: (value: unknown) => [value, () => {}],
  useEffect: (effect: () => unknown) => { effect(); },
}));
mock.module("../src/lib/i18n/LanguageProvider", () => ({
  useLanguage: () => ({ lang: "es", t: (key: string) => key }),
}));
mock.module("../src/integrations/supabase/client", () => ({
  supabase: { from: (table: string) => { calls.push(["from", table]); return query; } },
}));
const { useTerritoryNews } = await import("../src/lib/territory/useTerritory");

describe("France uses the existing territorial publishing rules", () => {
  test("news belongs to France and excludes unpublished content", async () => {
    calls.length = 0;
    useTerritoryNews(FRANCE.code, 60);
    await Promise.resolve();
    expect(calls).toContainEqual(["eq", "country_code", "fr"]);
    expect(calls).toContainEqual(["eq", "published", true]);
  });
  test("most recent publication is first", () => {
    calls.length = 0;
    useTerritoryNews(FRANCE.code, 60);
    expect(calls).toContainEqual(["order", "published_at", { ascending: false }]);
  });
  test("existing country assignments remain unchanged", () => {
    expect(PORTUGAL.code).toBe("pt");
    expect(MIAMI.code).toBe("mia");
    expect(PORTUGAL.basePath).toBe("/portugal");
    expect(MIAMI.basePath).toBe("/usa");
  });
});