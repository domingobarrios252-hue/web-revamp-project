import { createFileRoute } from "@tanstack/react-router";
import { TerritoryInterviewCard, TerritoryMasthead } from "@/components/territory/TerritoryCards";
import { FRANCE } from "@/lib/territory/territories";
import { useTerritoryInterviews } from "@/lib/territory/useTerritory";

const TITLE = "Entrevistas Francia | RollerZone";
const DESC = "Entrevistas a patinadores, entrenadores y protagonistas del patinaje en Francia.";

export const Route = createFileRoute("/francia/entrevistas/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://rollerzone.es/francia/entrevistas" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: "https://rollerzone.es/francia/entrevistas" }],
  }),
  component: FranciaInterviewsIndex,
});

function FranciaInterviewsIndex() {
  const { items, loading } = useTerritoryInterviews(FRANCE.code, 60);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <TerritoryMasthead territory={FRANCE} subtitle="Entrevistas · Edición Francia" />
      {loading ? (
        <p className="mt-8 text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="mt-8 border border-border bg-surface p-8 text-center text-muted-foreground">
          Aún no hay entrevistas publicadas en Francia.
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
