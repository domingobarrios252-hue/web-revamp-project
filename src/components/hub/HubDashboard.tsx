import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Calendar, Newspaper, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatShortDate } from "@/lib/i18n/format";
import { EmptyState } from "@/components/site/EmptyState";
import { cropObjectPosition, type ImageCrops } from "@/lib/imageCrops";
import { HubSectionLink } from "@/components/hub/HubSubNav";
import { useCountryHub, type HubSectionKey, type QuickLink } from "@/lib/hub/useCountryHub";

type NewsRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  image_crops: ImageCrops | null;
  published_at: string;
  views_count: number;
  featured: boolean;
  country_code?: string | null;
  category_id?: string | null;
};

type EventRow = {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  location: string | null;
  cover_url: string | null;
};

type ResultRow = {
  id: string;
  athlete_name: string;
  position: number;
  event_name: string;
  category: string | null;
  race_time: string | null;
};

type InterviewRow = {
  id: string;
  title: string;
  slug: string;
  interviewee_name: string;
  cover_url: string | null;
};

type MagazineRow = {
  id: string;
  title: string;
  cover_url: string | null;
  cover_image_url: string | null;
  read_url: string | null;
  edition_date: string | null;
  issue_number: number | null;
  is_free: boolean | null;
};

export function HubDashboard({ country }: { country: string }) {
  const { hub } = useCountryHub(country);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [interview, setInterview] = useState<InterviewRow | null>(null);
  const [magazine, setMagazine] = useState<MagazineRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Map country code → news category slug(s) so the hub also shows
        // "Internacional > <País>" news created from the editorial panel.
        const CATEGORY_SLUGS_BY_COUNTRY: Record<string, string[]> = {
          co: ["colombia", "internacional-colombia"],
          ve: ["venezuela", "internacional-venezuela"],
        };
        const extraSlugs = CATEGORY_SLUGS_BY_COUNTRY[country] ?? [];
        let extraCategoryIds: string[] = [];
        if (extraSlugs.length) {
          const { data: cats } = await supabase
            .from("news_categories")
            .select("id")
            .in("slug", extraSlugs);
          extraCategoryIds = (cats ?? []).map((c: { id: string }) => c.id);
        }

        // Visibility filter: news_visibility rows (when present) are authoritative;
        // fall back to country_code when a news has no rows at all.
        const { data: visAll } = await supabase
          .from("news_visibility")
          .select("news_id, channel, country_code")
          .in("channel", ["global_home", "country"]);
        const newsWithAnyRow = new Set<string>();
        const newsForThisCountry = new Set<string>();
        for (const r of (visAll ?? []) as { news_id: string; channel: string; country_code: string | null }[]) {
          newsWithAnyRow.add(r.news_id);
          if (r.channel === "country" && r.country_code === country) {
            newsForThisCountry.add(r.news_id);
          }
        }

        const newsQuery = supabase
          .from("news")
          .select("id,title,slug,excerpt,image_url,image_crops,published_at,views_count,featured,country_code,category_id")
          .eq("published", true)
          .order("featured", { ascending: false })
          .order("published_at", { ascending: false })
          .limit(50);

        const [n, e, r, i] = await Promise.all([
          newsQuery,
          supabase
            .from("events")
            .select("id,name,slug,start_date,location,cover_url")
            .eq("published", true)
            .eq("country_code", country)
            .gte("start_date", new Date().toISOString().slice(0, 10))
            .order("start_date", { ascending: true })
            .limit(4),
          supabase
            .from("live_results")
            .select("id,athlete_name,position,event_name,category,race_time")
            .eq("published", true)
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("interviews")
            .select("id,title,slug,interviewee_name,cover_url,country_code,hub_countries")
            .eq("published", true)
            .or(`hub_countries.cs.{${country}},country_code.eq.${country}`)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (cancelled) return;
        const allNews = (n.data as NewsRow[]) ?? [];
        const visibleNews = allNews
          .filter((row) => {
            if (newsForThisCountry.has(row.id)) return true;
            if (newsWithAnyRow.has(row.id)) return false; // explicit rows excluded this country
            // Backwards compat
            if (row.country_code === country) return true;
            if (extraCategoryIds.length && row.category_id && extraCategoryIds.includes(row.category_id)) return true;
            return false;
          })
          .slice(0, 6);
        setNews(visibleNews);
        setEvents((e.data as EventRow[]) ?? []);
        setResults((r.data as ResultRow[]) ?? []);
        setInterview((i.data as InterviewRow) ?? null);
      } catch {
        if (!cancelled) {
          setNews([]);
          setEvents([]);
          setResults([]);
          setInterview(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [country]);

  const featured = news[0];
  const rest = news.slice(1);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-10 md:py-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
        {/* MAIN COLUMN */}
        <div className="lg:col-span-8 space-y-12 md:space-y-16">
          {/* Featured */}
          {featured && (
            <article>
              <Link
                to="/noticias/articulo/$slug"
                params={{ slug: featured.slug }}
                className="group block rounded-2xl overflow-hidden bg-[#242424] border border-[#333] transition-all duration-300 hover:border-[#D4A017]/40 hover:shadow-2xl"
              >
                {featured.image_url && (
                  <div className="aspect-video relative overflow-hidden bg-[#0d0d0d]">
                    <img
                      src={featured.image_url}
                      alt={featured.title}
                      style={{ objectPosition: cropObjectPosition(featured.image_crops, "card") }}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="eager"
                    />

                    <div className="absolute top-6 left-6">
                      <span className="px-3 py-1 bg-[#D4A017] text-[#1A1A1A] text-[10px] font-black uppercase tracking-widest rounded-[3px]">
                        Destacado
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-6 md:p-10 space-y-4 md:space-y-5">
                  <div className="flex items-center gap-3 text-[10px] font-bold text-[#888] uppercase tracking-widest">
                    <span>{formatShortDate(featured.published_at, "es")}</span>
                    <span className="w-1 h-1 rounded-full bg-[#444]" />
                    <span>{featured.views_count} vistas</span>
                  </div>
                  <h2 className="font-display text-2xl md:text-4xl font-extrabold leading-tight text-white group-hover:text-[#D4A017] transition-colors">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="text-[#A0A0A0] leading-relaxed text-base md:text-lg line-clamp-3">
                      {featured.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            </article>
          )}

          {/* Última hora */}
          {rest.length > 0 && (
            <section className="space-y-6 md:space-y-8">
              <div className="flex items-center justify-between border-b border-[#333] pb-4">
                <h3 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                  Última hora
                </h3>
                <Link
                  to="/noticias"
                  className="text-[10px] font-bold text-[#D4A017] uppercase tracking-[0.2em] hover:text-white transition-colors"
                >
                  Ver todo el archivo
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                {rest.map((n) => (
                  <Link
                    key={n.id}
                    to="/noticias/articulo/$slug"
                    params={{ slug: n.slug }}
                    className="group flex gap-5 cursor-pointer"
                  >
                    {n.image_url && (
                      <div className="w-32 md:w-36 h-24 shrink-0 rounded-lg overflow-hidden border border-[#333] bg-[#0d0d0d]">
                        <img
                          src={n.image_url}
                          alt=""
                          style={{ objectPosition: cropObjectPosition(n.image_crops, "thumb") }}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />

                      </div>
                    )}
                    <div className="min-w-0 space-y-2">
                      <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider">
                        {formatShortDate(n.published_at, "es")}
                      </span>
                      <h4 className="font-display text-sm md:text-base font-bold leading-snug text-white group-hover:text-[#D4A017] transition-colors line-clamp-3">
                        {n.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Resultados */}
          {results.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#333] pb-4">
                <h3 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-[#D4A017]" />
                  Resultados recientes
                </h3>
                <Link
                  to="/resultados"
                  className="text-[10px] font-bold text-[#D4A017] uppercase tracking-[0.2em] hover:text-white transition-colors"
                >
                  Ver todos
                </Link>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[#333] bg-[#242424]">
                <table className="w-full text-sm">
                  <thead className="bg-[#2E2E2E]">
                    <tr className="text-left text-[10px] uppercase tracking-wider text-[#888]">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Atleta</th>
                      <th className="px-4 py-3 hidden md:table-cell">Prueba</th>
                      <th className="px-4 py-3 text-right">Tiempo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.slice(0, 6).map((r) => (
                      <tr key={r.id} className="border-t border-[#333] text-white">
                        <td className="px-4 py-3 font-bold text-[#D4A017]">{r.position}</td>
                        <td className="px-4 py-3">{r.athlete_name}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-[#A0A0A0]">{r.event_name}</td>
                        <td className="px-4 py-3 text-right text-[#A0A0A0]">{r.race_time ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {!featured && results.length === 0 && events.length === 0 && (
            <EmptyState
              icon={Newspaper}
              title="Próximamente"
              message="Aún no hay contenido publicado para este país. Estamos preparando las primeras noticias, eventos y resultados."
            />
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="lg:col-span-4 space-y-10 md:space-y-12">
          {/* Próximos eventos */}
          {events.length > 0 && (
            <section className="bg-[#242424] rounded-2xl border border-[#333] p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#D4A017]" />
                  Próximos eventos
                </h3>
                <Link
                  to="/eventos"
                  className="px-2 py-0.5 rounded bg-[#D4A017]/10 text-[#D4A017] text-[9px] font-bold tracking-wider hover:bg-[#D4A017]/20 transition-colors"
                >
                  CALENDARIO
                </Link>
              </div>
              <ul className="space-y-5">
                {events.map((ev, idx) => (
                  <li key={ev.id}>
                    <Link
                      to="/eventos/$slug"
                      params={{ slug: ev.slug }}
                      className="block group"
                    >
                      <h4 className="font-display text-sm font-extrabold text-white group-hover:text-[#D4A017] transition-colors leading-snug">
                        {ev.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-[#888] font-medium uppercase">
                        <span className="text-[#D4A017]">{formatShortDate(ev.start_date, "es")}</span>
                        {ev.location && (
                          <>
                            <span className="opacity-30">·</span>
                            <span>{ev.location}</span>
                          </>
                        )}
                      </div>
                    </Link>
                    {idx < events.length - 1 && <div className="h-px bg-[#333] mt-5" />}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Perfil destacado / Entrevista */}
          {interview && (
            <section className="rounded-2xl overflow-hidden border border-[#333] bg-[#242424] shadow-xl">
              <Link to="/entrevistas/$slug" params={{ slug: interview.slug }} className="block group">
                <div className="aspect-square relative overflow-hidden bg-[#0d0d0d]">
                  {interview.cover_url && (
                    <img
                      src={interview.cover_url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/60 to-transparent h-2/3" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="text-[9px] font-black uppercase text-[#D4A017] tracking-[0.25em]">
                      Perfil destacado
                    </span>
                    <h3 className="font-display text-xl md:text-2xl font-black text-white mt-1 group-hover:text-[#D4A017] transition-colors leading-tight">
                      {interview.interviewee_name}
                    </h3>
                  </div>
                </div>
                <div className="px-6 md:px-8 py-5">
                  <p className="text-xs text-[#A0A0A0] leading-relaxed line-clamp-3">{interview.title}</p>
                </div>
              </Link>
            </section>
          )}

          {/* Accesos rápidos */}
          <section className="space-y-5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#666]">
              Accesos rápidos
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <QuickLink country={country} section="competicion" label="Liga Nacional" />
              <QuickLink country={country} section="competicion" label="Campeonatos" />
              <QuickLink country={country} section="clubes" label="Clubs" />
              <QuickLink country={country} section="patinadores" label="Patinadores" />
              <QuickLink country={country} section="mvp" label="MVP" />
              <QuickLink country={country} section="tv" label="TV" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function QuickLink({ country, section, label }: { country: string; section: string; label: string }) {
  return (
    <HubSectionLink
      country={country}
      section={section as HubSectionKey}
      className="h-12 flex items-center justify-center bg-[#2E2E2E] border border-[#333] rounded-lg text-[10px] font-bold uppercase tracking-wider text-[#F5F5F5] hover:bg-[#D4A017] hover:text-[#1A1A1A] hover:border-[#D4A017] transition-all duration-300"
    >
      {label}
    </HubSectionLink>
  );
}
