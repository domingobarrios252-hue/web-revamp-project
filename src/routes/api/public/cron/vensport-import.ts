import { createFileRoute } from "@tanstack/react-router";

/** Importación controlada Vensport (pruebas concretas). Misma protección que results-sync. */
export const Route = createFileRoute("/api/public/cron/vensport-import")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RESULTS_SYNC_SECRET"];
        const got = request.headers.get("x-sync-secret");
        if (!secret || !got || got.length < 32 || got !== secret) return new Response("Unauthorized", { status: 401 });
        const body = (await request.json().catch(() => null)) as { items?: { divisionId: string; title: string; section: string }[] } | null;
        const items = (body?.items ?? []).filter((x) => /^\d{1,9}$/.test(x?.divisionId ?? "") && typeof x.title === "string" && typeof x.section === "string");
        if (!items.length) return new Response("Bad request", { status: 400 });
        const { runVensportImport } = await import("@/lib/results/vensportSync.server");
        return Response.json(await runVensportImport("asu26_speed", items), { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
