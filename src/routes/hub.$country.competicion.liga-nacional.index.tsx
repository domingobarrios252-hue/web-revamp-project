import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Calendar, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLeagueSeasons, useLeagueRounds, useLeagueStandings } from "@/lib/hub/useLeague";
import { StandingsTable } from "@/components/hub/StandingsTable";
import { RoundsList } from "@/components/hub/RoundsList";
import { formatShortDate } from "@/lib/i18n/format";

export const Route = createFileRoute("/hub/$country/competicion/liga-nacional/")({
  component: LigaHome,
});

type NewsRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string;
  views_count: number;
};

function LigaHome() {
  const { country } = Route.useParams();
  const { current } = useLeagueSeasons(country);
  const { rounds } = useLeagueRounds(current?.id);
  const { standings } = useLeagueStandings(current?.id);

  const [news, setNews] = useState<NewsRow[]>([]);
  useEffect(() => {
    let cancelled = false;
    (supabase as any)
      .from("news")
      .select("id,title,slug,excerpt,image_url,published_at,views_count")
      .eq("published", true)
      .eq("country_code", country)
      .eq("competition_tag", "liga_nacional")
      .order("published_at", { ascending: false })
      .limit(5)
      .then(({ data }: { data: NewsRow[] | null }) => {
        if (!cancelled) setNews(data ?? []);
      });
    return () => { cancelled = true; };
  }, [country]);

  const upcoming = rounds.filter((r) => r.status !== "finished").slice(0, 3);
  const recent = rounds.filter((r) => r.status === "finished").slice(-3).reverse();
  const featured = news[0];

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-8">
        {/* Hero noticia o placeholder */}
        {featured ? (
          <Link
            to="/noticias/$slug"
            params={{ slug: featured.slug }}
            className="group block overflow-hidden rounded-[6px] border border-[#2A2A2A] bg-[#141414] hover:border-[#D4A017]/60 transition-colors"
          >
            {featured.image_url && (
              <div className="aspect-[16/9] overflow-hidden bg-[#0d0d0d]">
                <img loading="lazy" decoding="async" src={featured.image_url} alt={featured.title} className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
              </div>
            )}
            <div className="p-5">
              <span className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">Liga Nacional · Destacado</span>
              <h2 className="mt-1.5 font-display text-2xl md:text-3xl font-black text-[#F5F5F5] group-hover:text-[#D4A017]">
                {featured.title}
              </h2>
              {featured.excerpt && <p className="mt-2 text-sm text-[#B5B5B5] line-clamp-2">{featured.excerpt}</p>}
              <div className="mt-3 flex items-center gap-4 text-[11px] text-[#888]">
                <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatShortDate(featured.published_at, "es")}</span>
                <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{featured.views_count}</span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-[6px] border border-dashed border-[#333] bg-[#141414] p-8 text-center">
            <div className="font-ui text-[10px] uppercase tracking-widest text-[#D4A017]">Liga Nacional</div>
            <h2 className="mt-2 font-display text-2xl font-black text-[#F5F5F5]">
              {current?.name ?? "Temporada en preparación"}
            </h2>
            <p className="mt-2 text-sm text-[#888]">
              Aún no hay noticias publicadas con etiqueta "liga_nacional" para {country.toUpperCase()}. Publica una desde admin marcando esa etiqueta.
            </p>
          </div>
        )}

        {/* Próximas jornadas */}
        <section>
          <SectionHeading title="Próximas jornadas" linkTo={`/hub/${country}/competicion/liga-nacional/calendario`} />
          <div className="mt-3"><RoundsList rounds={upcoming} variant="calendar" /></div>
        </section>

        {/* Últimos resultados */}
        <section>
          <SectionHeading title="Resultados recientes" linkTo={`/hub/${country}/competicion/liga-nacional/resultados`} />
          <div className="mt-3"><RoundsList rounds={recent} variant="results" /></div>
        </section>

        {/* Últimas noticias liga */}
        {news.length > 1 && (
          <section>
            <SectionHeading title="Más noticias de Liga" linkTo={`/hub/${country}/competicion/liga-nacional/noticias`} />
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {news.slice(1).map((n) => (
                <Link key={n.id} to="/noticias/$slug" params={{ slug: n.slug }}
                  className="group flex gap-3 rounded-[6px] border border-[#2A2A2A] bg-[#141414] p-3 hover:border-[#D4A017]/60">
                  {n.image_url && (
                    <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-[4px] bg-[#0d0d0d]">
                      <img src={n.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-bold leading-snug text-[#F5F5F5] group-hover:text-[#D4A017] line-clamp-2">{n.title}</h3>
                    <div className="mt-1 text-[10px] text-[#888]">{formatShortDate(n.published_at, "es")}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* SIDEBAR — clasificación rápida */}
      <aside className="space-y-5">
        <div className="rounded-[6px] border border-[#2A2A2A] bg-[#141414] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] px-4 py-3">
            <h3 className="font-display text-sm font-black uppercase tracking-wide text-[#F5F5F5]">
              Clasificación rápida
            </h3>
            <Link to="/hub/$country/competicion/liga-nacional/clasificaciones" params={{ country }}
              className="text-[10px] uppercase tracking-widest text-[#D4A017] hover:underline inline-flex items-center gap-1">
              Tabla completa <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-3">
            <StandingsTable standings={standings.slice(0, 5)} compact />
          </div>
        </div>

        {current && (
          <div className="rounded-[6px] border border-[#2A2A2A] bg-[#141414] p-4 text-center">
            <div className="font-ui text-[10px] uppercase tracking-widest text-[#888]">Temporada actual</div>
            <div className="mt-1 font-display text-2xl font-black text-[#D4A017]">{current.year_label ?? current.name}</div>
            <div className="mt-2 text-[11px] text-[#B5B5B5]">{rounds.length} jornadas programadas</div>
          </div>
        )}
      </aside>
    </div>
  );
}

function SectionHeading({ title, linkTo }: { title: string; linkTo: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2">
      <h2 className="font-display text-lg font-black uppercase tracking-wide text-[#F5F5F5]">{title}</h2>
      <Link to={linkTo} className="text-[11px] uppercase tracking-widest text-[#D4A017] hover:underline inline-flex items-center gap-1">
        Ver todo <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
