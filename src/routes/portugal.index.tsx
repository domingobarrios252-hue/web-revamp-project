import { createFileRoute, Link } from "@tanstack/react-router";
import { Newspaper, Mic } from "lucide-react";
import { SectionHeading } from "@/components/home/SectionHeading";
import {
  TerritoryInterviewCard,
  TerritoryLead,
  TerritoryMasthead,
  TerritoryNewsCard,
} from "@/components/territory/TerritoryCards";
import { PORTUGAL } from "@/lib/territory/territories";
import { useTerritoryInterviews, useTerritoryNews } from "@/lib/territory/useTerritory";

const TITLE = "RollerZone Portugal | Notícias e entrevistas da patinagem de velocidade";
const DESC =
  "Edición territorial de RollerZone en Portugal: noticias, entrevistas, vídeos y competiciones del patinaje de velocidad portugués.";

export const Route = createFileRoute("/portugal/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rollerzone.es/portugal" }],
  }),
  component: PortugalHome,
});

function PortugalHome() {
  const { items: news, loading } = useTerritoryNews(PORTUGAL.code, 13);
  const { items: interviews } = useTerritoryInterviews(PORTUGAL.code, 6);
  const [lead, ...rest] = news;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <TerritoryMasthead territory={PORTUGAL} />

      {loading ? (
        <p className="mt-10 text-muted-foreground">Cargando…</p>
      ) : (
        <>
          {lead ? (
            <section className="mt-8">
              <TerritoryLead item={lead} territory={PORTUGAL} />
            </section>
          ) : (
            <div className="mt-8 border border-border bg-surface p-8 text-center text-muted-foreground">
              Aún no hay contenido publicado en RollerZone Portugal. Muy pronto.
            </div>
          )}

          {rest.length > 0 && (
            <section className="mt-14">
              <SectionHeading
                kicker="Portugal"
                icon={<Newspaper className="h-3.5 w-3.5" />}
                title="ÚLTIMAS"
                accent="NOTICIAS"
                action={{ to: "/portugal/noticias", label: "Ver todas las noticias" }}
              />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((n) => (
                  <TerritoryNewsCard key={n.id} item={n} territory={PORTUGAL} />
                ))}
              </div>
            </section>
          )}

          {interviews.length > 0 && (
            <section className="mt-14">
              <SectionHeading
                kicker="Portugal"
                icon={<Mic className="h-3.5 w-3.5" />}
                title="ENTRE"
                accent="VISTAS"
                action={{ to: "/portugal/entrevistas", label: "Ver todas las entrevistas" }}
              />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {interviews.map((it) => (
                  <TerritoryInterviewCard key={it.id} item={it} />
                ))}
              </div>
            </section>
          )}

          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              to="/portugal/noticias"
              className="font-condensed border border-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold hover:text-background"
            >
              Noticias Portugal
            </Link>
            <Link
              to="/portugal/entrevistas"
              className="font-condensed border border-border px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
            >
              Entrevistas Portugal
            </Link>
            <Link
              to="/eventos"
              className="font-condensed border border-border px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
            >
              Eventos y competiciones
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
