import { createFileRoute } from "@tanstack/react-router";

/** Aviso programado Vensport (cada 30 s, 1 página por aviso). Misma protección que results-sync. */
export const Route = createFileRoute("/api/public/cron/vensport-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RESULTS_SYNC_SECRET"];
        const got = request.headers.get("x-sync-secret");
        if (!got || got.length < 32) return new Response("Unauthorized", { status: 401 });
        let ok = !!secret && got === secret;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (!ok) {
          const { data } = await supabaseAdmin.from("results_sync_cron_token").select("token").eq("id", 1).maybeSingle();
          ok = !!data?.token && data.token === got;
        }
        if (!ok) return new Response("Unauthorized", { status: 401 });
        const { runVensportTick } = await import("@/lib/results/vensportSync.server");
        return Response.json(await runVensportTick("asu26_speed"), { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
