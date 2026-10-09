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
        if (!secret || !got || got !== secret) return new Response("Unauthorized", { status: 401 });
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
