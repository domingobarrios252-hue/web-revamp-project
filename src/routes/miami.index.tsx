import { createFileRoute, Link } from "@tanstack/react-router";
import { Newspaper, Mic } from "lucide-react";
import { SectionHeading } from "@/components/home/SectionHeading";
import { MiamiInterviewCard, MiamiLead, MiamiMasthead, MiamiNewsCard } from "@/components/miami/MiamiCards";
import { useMiamiInterviews, useMiamiNews } from "@/lib/miami/useMiami";

const TITLE = "RollerZone Miami | Noticias y entrevistas del patinaje en Miami";
const DESC =
  "Edición territorial de RollerZone en Miami: noticias y entrevistas del patinaje de velocidad en el sur de Florida.";

export const Route = createFileRoute("/miami/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rollerzone.es/miami" }],
  }),
  component: MiamiHome,
});

function MiamiHome() {
  const { items: news, loading } = useMiamiNews(13);
  const { items: interviews } = useMiamiInterviews(6);
  const [lead, ...rest] = news;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <MiamiMasthead />

      {loading ? (
        <p className="mt-10 text-muted-foreground">Cargando…</p>
      ) : (
        <>
          {lead ? (
            <section className="mt-8">
              <MiamiLead item={lead} />
            </section>
          ) : (
            <div className="mt-8 border border-border bg-surface p-8 text-center text-muted-foreground">
              Aún no hay contenido publicado en RollerZone Miami. Muy pronto.
            </div>
          )}

          {rest.length > 0 && (
            <section className="mt-14">
              <SectionHeading
                kicker="Miami"
                icon={<Newspaper className="h-3.5 w-3.5" />}
                title="ÚLTIMAS"
                accent="NOTICIAS"
                action={{ to: "/miami/noticias", label: "Ver todas las noticias" }}
              />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((n) => (
                  <MiamiNewsCard key={n.id} item={n} />
                ))}
              </div>
            </section>
          )}

          {interviews.length > 0 && (
            <section className="mt-14">
              <SectionHeading
                kicker="Miami"
                icon={<Mic className="h-3.5 w-3.5" />}
                title="ENTRE"
                accent="VISTAS"
                action={{ to: "/miami/entrevistas", label: "Ver todas las entrevistas" }}
              />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {interviews.map((it) => (
                  <MiamiInterviewCard key={it.id} item={it} />
                ))}
              </div>
            </section>
          )}

          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              to="/miami/noticias"
              className="font-condensed border border-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold hover:text-background"
            >
              Noticias Miami
            </Link>
            <Link
              to="/miami/entrevistas"
              className="font-condensed border border-border px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
            >
              Entrevistas Miami
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
