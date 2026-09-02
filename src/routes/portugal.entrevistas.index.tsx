import { createFileRoute } from "@tanstack/react-router";
import { TerritoryInterviewCard, TerritoryMasthead } from "@/components/territory/TerritoryCards";
import { PORTUGAL } from "@/lib/territory/territories";
import { useTerritoryInterviews } from "@/lib/territory/useTerritory";

const TITLE = "Entrevistas Portugal | RollerZone";
const DESC = "Entrevistas a patinadores, entrenadores y protagonistas del patinaje en Portugal.";

export const Route = createFileRoute("/portugal/entrevistas/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rollerzone.es/portugal/entrevistas" }],
  }),
  component: PortugalInterviewsIndex,
});

function PortugalInterviewsIndex() {
  const { items, loading } = useTerritoryInterviews(PORTUGAL.code, 60);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <TerritoryMasthead territory={PORTUGAL} subtitle="Entrevistas · Edición Portugal" />
      {loading ? (
        <p className="mt-8 text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="mt-8 border border-border bg-surface p-8 text-center text-muted-foreground">
          Aún no hay entrevistas publicadas en Portugal.
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <TerritoryInterviewCard key={it.id} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}
