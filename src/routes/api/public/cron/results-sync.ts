import { createFileRoute } from "@tanstack/react-router";

/**
 * Aviso programado (cada 5 min). Protegido por RESULTS_SYNC_SECRET.
 * La decisión de consultar o no (jornada, emergencia, parada) se toma en el servidor.
 */
export const Route = createFileRoute("/api/public/cron/results-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RESULTS_SYNC_SECRET"];
        const got = request.headers.get("x-sync-secret");
        if (!got || got.length < 32) return new Response("Unauthorized", { status: 401 });
        let ok = !!secret && got === secret;
        if (!ok) {
          // Token privado generado y guardado solo en la base de datos (lo usa el aviso programado).
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin.from("results_sync_cron_token").select("token").eq("id", 1).maybeSingle();
          ok = !!data?.token && data.token === got;
        }
        if (!ok) return new Response("Unauthorized", { status: 401 });
        const url = new URL(request.url);
        const key = url.searchParams.get("key") || "asu26_speed";
        const mode = url.searchParams.get("mode") === "manual" ? "manual" : "scheduled";
        if (!/^[a-z0-9_]{1,40}$/.test(key)) return new Response("Bad key", { status: 400 });
        const { runResultsSync } = await import("@/lib/results/asu26Sync.server");
        const out = await runResultsSync(key, mode);
        return Response.json(out, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
