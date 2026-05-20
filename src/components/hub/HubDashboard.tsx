import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Calendar, Eye, ArrowRight, Trophy, Mic, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatShortDate } from "@/lib/i18n/format";

type NewsRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string;
  views_count: number;
  featured: boolean;
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

type SkaterRow = {
  id: string;
  full_name: string;
  slug: string;
  photo_url: string | null;
  category: string | null;
};

type ClubRow = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

export function HubDashboard({ country }: { country: string }) {
  const [news, setNews] = useState<NewsRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [interview, setInterview] = useState<InterviewRow | null>(null);
  const [skater, setSkater] = useState<SkaterRow | null>(null);
  const [club, setClub] = useState<ClubRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [n, e, r, i, s, c] = await Promise.all([
        supabase
          .from("news")
          .select("id,title,slug,excerpt,image_url,published_at,views_count,featured")
          .eq("published", true)
          .eq("country_code", country)
          .order("featured", { ascending: false })
          .order("published_at", { ascending: false })
          .limit(6),
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
          .select("id,title,slug,interviewee_name,cover_url")
          .eq("published", true)
          .eq("country_code", country)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("skaters")
          .select("id,full_name,slug,photo_url,category")
          .eq("country_code", country)
          .eq("featured", true)
          .order("total_points", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("clubs")
          .select("id,name,slug,logo_url")
          .eq("country_code", country)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setNews((n.data as NewsRow[]) ?? []);
      setEvents((e.data as EventRow[]) ?? []);
      setResults((r.data as ResultRow[]) ?? []);
      setInterview((i.data as InterviewRow) ?? null);
      setSkater((s.data as SkaterRow) ?? null);
      setClub((c.data as ClubRow) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [country]);

  const featured = news[0];
  const rest = news.slice(1);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-10 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* MAIN COLUMN */}
      <div className="lg:col-span-2 space-y-8">
        {featured && (
          <Link
            to="/noticias/$slug"
            params={{ slug: featured.slug }}
            className="group block overflow-hidden rounded-[6px] border border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#D4A017]/60 transition-colors"
          >
            {featured.image_url && (
              <div className="aspect-[16/9] overflow-hidden bg-[#0d0d0d]">
                <img
                  src={featured.image_url}
                  alt={featured.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  loading="eager"
                />
              </div>
            )}
            <div className="p-5 md:p-6">
              <span className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">
                Destacado
              </span>
              <h2 className="mt-2 font-display text-2xl md:text-3xl font-black leading-tight text-[#F5F5F5] group-hover:text-[#D4A017] transition-colors">
                {featured.title}
              </h2>
              {featured.excerpt && (
                <p className="mt-2 text-sm md:text-base text-[#B5B5B5] line-clamp-2">{featured.excerpt}</p>
              )}
              <div className="mt-3 flex items-center gap-4 text-[11px] text-[#888]">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatShortDate(featured.published_at, "es")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {featured.views_count}
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Secondary news grid */}
        {rest.length > 0 && (
          <div>
            <SectionHeading title="Última hora" href="/noticias" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {rest.map((n) => (
                <Link
                  key={n.id}
                  to="/noticias/$slug"
                  params={{ slug: n.slug }}
                  className="group flex gap-3 rounded-[6px] border border-[#2A2A2A] bg-[#1A1A1A] p-3 hover:border-[#D4A017]/60 transition-colors"
                >
                  {n.image_url && (
                    <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-[4px] bg-[#0d0d0d]">
                      <img src={n.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-bold leading-snug text-[#F5F5F5] group-hover:text-[#D4A017] line-clamp-2">
                      {n.title}
                    </h3>
                    <div className="mt-1 text-[10px] text-[#888]">
                      {formatShortDate(n.published_at, "es")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div>
            <SectionHeading title="Resultados recientes" href="/resultados" icon={<Trophy className="h-4 w-4" />} />
            <div className="mt-4 overflow-hidden rounded-[6px] border border-[#2A2A2A]">
              <table className="w-full text-sm">
                <thead className="bg-[#222]">
                  <tr className="text-left text-[10px] uppercase tracking-wider text-[#888]">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Atleta</th>
                    <th className="px-3 py-2 hidden md:table-cell">Prueba</th>
                    <th className="px-3 py-2">Tiempo</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 6).map((r) => (
                    <tr key={r.id} className="border-t border-[#2A2A2A] text-[#F5F5F5]">
                      <td className="px-3 py-2 font-bold text-[#D4A017]">{r.position}</td>
                      <td className="px-3 py-2">{r.athlete_name}</td>
                      <td className="px-3 py-2 hidden md:table-cell text-[#B5B5B5]">{r.event_name}</td>
                      <td className="px-3 py-2 text-[#B5B5B5]">{r.race_time ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!featured && results.length === 0 && events.length === 0 && (
          <div className="rounded-[6px] border border-dashed border-[#333] p-8 text-center text-sm text-[#888]">
            Aún no hay contenido publicado para este país.
          </div>
        )}
      </div>

      {/* SIDEBAR */}
      <aside className="space-y-6">
        {events.length > 0 && (
          <SideCard title="Próximos eventos" icon={<Calendar className="h-4 w-4" />} href="/eventos">
            <ul className="divide-y divide-[#2A2A2A]">
              {events.map((ev) => (
                <li key={ev.id} className="py-3">
                  <Link
                    to="/eventos/$slug"
                    params={{ slug: ev.slug }}
                    className="block hover:text-[#D4A017]"
                  >
                    <div className="font-display text-sm font-bold text-[#F5F5F5]">{ev.name}</div>
                    <div className="mt-1 text-[11px] text-[#888]">
                      {formatShortDate(ev.start_date, "es")} {ev.location ? `· ${ev.location}` : ""}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </SideCard>
        )}

        {skater && (
          <SideCard title="Patinador destacado" icon={<Users className="h-4 w-4" />}>
            <div className="flex items-center gap-3">
              {skater.photo_url ? (
                <img
                  src={skater.photo_url}
                  alt={skater.full_name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-[#D4A017]"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-[#222] border-2 border-[#D4A017]" />
              )}
              <div>
                <div className="font-display font-bold text-[#F5F5F5]">{skater.full_name}</div>
                {skater.category && (
                  <div className="text-[11px] text-[#888] uppercase tracking-wider">{skater.category}</div>
                )}
              </div>
            </div>
          </SideCard>
        )}

        {club && (
          <SideCard title="Club destacado" icon={<Trophy className="h-4 w-4" />}>
            <div className="flex items-center gap-3">
              {club.logo_url ? (
                <img src={club.logo_url} alt={club.name} className="h-14 w-14 object-contain" />
              ) : (
                <div className="h-14 w-14 rounded bg-[#222]" />
              )}
              <div className="font-display font-bold text-[#F5F5F5]">{club.name}</div>
            </div>
          </SideCard>
        )}

        {interview && (
          <SideCard title="Entrevista" icon={<Mic className="h-4 w-4" />} href="/entrevistas">
            <Link to="/entrevistas/$slug" params={{ slug: interview.slug }} className="block group">
              {interview.cover_url && (
                <div className="aspect-video overflow-hidden rounded mb-2 bg-[#0d0d0d]">
                  <img src={interview.cover_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              )}
              <div className="font-display text-sm font-bold text-[#F5F5F5] group-hover:text-[#D4A017]">
                {interview.title}
              </div>
              <div className="text-[11px] text-[#888] mt-1">{interview.interviewee_name}</div>
            </Link>
          </SideCard>
        )}

        <SideCard title="Accesos rápidos">
          <div className="grid grid-cols-2 gap-2">
            <QuickLink country={country} section="competicion" label="Liga Nacional" />
            <QuickLink country={country} section="competicion" label="Campeonatos" />
            <QuickLink country={country} section="clubes" label="Clubs" />
            <QuickLink country={country} section="patinadores" label="Patinadores" />
            <QuickLink country={country} section="mvp" label="MVP" />
            <QuickLink country={country} section="tv" label="TV" />
          </div>
        </SideCard>
      </aside>
    </div>
  );
}

function SectionHeading({ title, href, icon }: { title: string; href?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2">
      <h2 className="font-display text-lg font-black uppercase tracking-wide text-[#F5F5F5] flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {href && (
        <Link to={href} className="text-[11px] uppercase tracking-wider text-[#D4A017] hover:underline inline-flex items-center gap-1">
          Ver todo <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function SideCard({
  title,
  icon,
  href,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[6px] border border-[#2A2A2A] bg-[#1A1A1A] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#2A2A2A] px-4 py-3">
        <h3 className="font-display text-sm font-black uppercase tracking-wide text-[#F5F5F5] flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {href && (
          <Link to={href} className="text-[10px] uppercase text-[#D4A017] hover:underline">
            Ver +
          </Link>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function QuickLink({ country, section, label }: { country: string; section: string; label: string }) {
  return (
    <Link
      to="/hub/$country/$section"
      params={{ country, section }}
      className="font-ui text-[11px] font-bold uppercase tracking-wider text-[#B5B5B5] hover:text-[#1A1A1A] hover:bg-[#D4A017] border border-[#333] rounded px-3 py-2 text-center transition-colors"
    >
      {label}
    </Link>
  );
}
