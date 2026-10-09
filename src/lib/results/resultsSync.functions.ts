import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** «Sincronizar ahora»: solo administradores. Respeta emergencia y parada de seguridad. */
export const syncResultsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string }) => {
    if (!d || typeof d.key !== "string" || !/^[a-z0-9_]{1,40}$/.test(d.key)) throw new Error("Clave no válida");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Solo administradores");
    const { runResultsSync } = await import("@/lib/results/asu26Sync.server");
    return runResultsSync(data.key, "manual");
  });
