import { createFileRoute } from "@tanstack/react-router";
import { MiamiMasthead, MiamiNewsCard } from "@/components/miami/MiamiCards";
import { useMiamiNews } from "@/lib/miami/useMiami";

const TITLE = "Noticias Miami | RollerZone";
const DESC = "Todas las noticias del patinaje de velocidad en Miami publicadas por RollerZone.";

export const Route = createFileRoute("/miami/noticias/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rollerzone.es/miami/noticias" }],
  }),
  component: MiamiNewsIndex,
});

function MiamiNewsIndex() {
  const { items, loading } = useMiamiNews(60);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <MiamiMasthead subtitle="Noticias · Edición Miami" />
      {loading ? (
        <p className="mt-8 text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="mt-8 border border-border bg-surface p-8 text-center text-muted-foreground">
          Aún no hay noticias publicadas en Miami.
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((n) => (
            <MiamiNewsCard key={n.id} item={n} />
          ))}
        </div>
      )}
    </div>
  );
}
