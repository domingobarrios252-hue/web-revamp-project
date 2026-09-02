import { createFileRoute } from "@tanstack/react-router";
import { TerritoryMasthead, TerritoryNewsCard } from "@/components/territory/TerritoryCards";
import { PORTUGAL } from "@/lib/territory/territories";
import { useTerritoryNews } from "@/lib/territory/useTerritory";

const TITLE = "Noticias Portugal | RollerZone";
const DESC = "Todas las noticias del patinaje de velocidad en Portugal publicadas por RollerZone.";

export const Route = createFileRoute("/portugal/noticias/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rollerzone.es/portugal/noticias" }],
  }),
  component: PortugalNewsIndex,
});

function PortugalNewsIndex() {
  const { items, loading } = useTerritoryNews(PORTUGAL.code, 60);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <TerritoryMasthead territory={PORTUGAL} subtitle="Noticias · Edición Portugal" />
      {loading ? (
        <p className="mt-8 text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="mt-8 border border-border bg-surface p-8 text-center text-muted-foreground">
          Aún no hay noticias publicadas en Portugal.
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((n) => (
            <TerritoryNewsCard key={n.id} item={n} territory={PORTUGAL} />
          ))}
        </div>
      )}
    </div>
  );
}
