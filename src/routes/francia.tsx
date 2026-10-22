import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Link } from "@tanstack/react-router";
import { useUiText } from "@/lib/i18n/uiText";
import { createFileRoute } from "@tanstack/react-router";
import { Newspaper, Mic } from "lucide-react";
import { SectionHeading } from "@/components/home/SectionHeading";
import {
  TerritoryInterviewCard,
  TerritoryLead,
  TerritoryMasthead,
  TerritoryNewsCard,
} from "@/components/territory/TerritoryCards";
import { FRANCE } from "@/lib/territory/territories";
import { useTerritoryInterviews, useTerritoryNews } from "@/lib/territory/useTerritory";

const TITLE = "Rollerzone Francia | Noticias de patinaje de velocidad";
const DESC =
  "Actualidad del patinaje de velocidad en Francia. Competiciones, resultados, entrevistas y protagonistas del patinaje francés en Rollerzone.";

export const Route = createFileRoute("/francia")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://rollerzone.es/francia" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "alternate", hreflang: "es", href: "https://rollerzone.es/francia" }, { rel: "alternate", hreflang: "en", href: "https://rollerzone.es/en/france" }, { rel: "alternate", hreflang: "x-default", href: "https://rollerzone.es/francia" }, { rel: "canonical", href: "https://rollerzone.es/francia" }],
  }),
  component: FranciaHome,
});

export function FranciaHome() {
  const { lang: linkLanguage } = useLanguage();
  const ui = useUiText();
  const { items: news, loading } = useTerritoryNews(FRANCE.code, 13);
  const { items: interviews } = useTerritoryInterviews(FRANCE.code, 6);
  const [lead, ...rest] = news;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <TerritoryMasthead territory={FRANCE} />

      {loading ? (
        <p className="mt-10 text-muted-foreground">{ui('Cargando…')}</p>
      ) : (
        <>
          {lead ? (
            <section className="mt-8">
              <TerritoryLead item={lead} territory={FRANCE} />
            </section>
          ) : (
            <div className="mt-8 border border-border bg-surface p-8 text-center text-muted-foreground">
              Aún no hay contenido publicado en RollerZone Francia. Muy pronto.
            </div>
          )}

          {rest.length > 0 && (
            <section className="mt-14">
              <SectionHeading
                kicker="Francia"
                icon={<Newspaper className="h-3.5 w-3.5" />}
                title={ui("ÚLTIMAS")}
                accent={ui("NOTICIAS")}
                action={{ to: "/francia/noticias", label: ui("Ver todas las noticias") }}
              />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((n) => (
                  <TerritoryNewsCard key={n.id} item={n} territory={FRANCE} />
                ))}
              </div>
            </section>
          )}

          {interviews.length > 0 && (
            <section className="mt-14">
              <SectionHeading
                kicker="Francia"
                icon={<Mic className="h-3.5 w-3.5" />}
                title={ui("ENTRE")}
                accent={ui("VISTAS")}
                action={{ to: "/francia/entrevistas", label: ui("Ver todas las entrevistas") }}
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
              to="/francia/noticias"
              className="font-condensed border border-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold hover:text-background"
            >
              {ui('Noticias Francia')}
            </Link>
            <Link
              to="/francia/entrevistas"
              className="font-condensed border border-border px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
            >
              {ui('Entrevistas Francia')}
            </Link>
            <Link
              to="/eventos"
              className="font-condensed border border-border px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
            >
              {ui('Eventos y competiciones')}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
