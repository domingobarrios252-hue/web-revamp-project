import { createFileRoute } from "@tanstack/react-router";
import { MiamiInterviewCard, MiamiMasthead } from "@/components/miami/MiamiCards";
import { useMiamiInterviews } from "@/lib/miami/useMiami";

const TITLE = "Entrevistas Miami | RollerZone";
const DESC = "Entrevistas a patinadores, entrenadores y protagonistas del patinaje en Miami.";

export const Route = createFileRoute("/miami/entrevistas/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rollerzone.es/miami/entrevistas" }],
  }),
  component: MiamiInterviewsIndex,
});

function MiamiInterviewsIndex() {
  const { items, loading } = useMiamiInterviews(60);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <MiamiMasthead subtitle="Entrevistas · Edición Miami" />
      {loading ? (
        <p className="mt-8 text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="mt-8 border border-border bg-surface p-8 text-center text-muted-foreground">
          Aún no hay entrevistas publicadas en Miami.
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <MiamiInterviewCard key={it.id} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}
