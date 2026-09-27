import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { StatsResult, RealtimeResult, StatsModule, Totals } from "./stats.server";

export type { StatsResult, RealtimeResult, StatsModule, Totals };

const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Input = z.object({
  start: DateStr,
  end: DateStr,
  prevStart: DateStr,
  prevEnd: DateStr,
  grain: z.enum(["day", "week", "month"]),
});
export type StatsInput = z.infer<typeof Input>;

async function assertAdmin(context: { supabase: { rpc: (...a: never[]) => unknown }; userId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (context.supabase as any).rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error) throw new Error("No se ha podido comprobar el rol de administrador.");
  if (!data) throw new Error("Solo los administradores pueden ver las estadísticas.");
}

export const getStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }): Promise<StatsResult> => {
    await assertAdmin(context as never);
    const { computeStats } = await import("./stats.server");
    return computeStats(data);
  });

export const getRealtime = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RealtimeResult> => {
    await assertAdmin(context as never);
    const { computeRealtime } = await import("./stats.server");
    return computeRealtime();
  });
