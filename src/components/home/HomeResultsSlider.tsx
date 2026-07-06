import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Trophy, ArrowRight, Calendar, MapPin } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  event_name: string;
  event_slug: string | null;
  race: string | null;
  category: string | null;
  gender: string | null;
  round: string | null;
  position: number;
  athlete_name: string;
  club: string | null;
  country: string | null;
  race_time: string | null;
  home_sort_order: number;
};

type EventMeta = {
  slug: string;
  name: string;
  event_date: string | null;
  country: string | null;
  banner_url: string | null;
};

type Group = {
  key: string;
  eventSlug: string;
  eventName: string;
  race: string;
  category: string;
  gender: string;
  round: string;
  homeOrder: number;
  rows: Row[];
};

export function HomeResultsSlider() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [events, setEvents] = useState<Record<string, EventMeta>>({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: evs } = await supabase
        .from("result_events")
        .select("slug, name, event_date, country, banner_url, show_in_home, home_order")
        .eq("published", true)
        .order("event_date", { ascending: false });
      const evMap: Record<string, EventMeta> = {};
      (evs ?? []).forEach((e: EventMeta) => { evMap[e.slug] = e; });

      // Slugs marcados "Mostrar en Home" desde el admin de resultados.
      const homeSlugs = (evs ?? [])
        .filter((e: { show_in_home?: boolean }) => e.show_in_home === true)
        .sort((a: { home_order?: number }, b: { home_order?: number }) => (a.home_order ?? 0) - (b.home_order ?? 0))
        .map((e: { slug: string }) => e.slug);

      // Podios: filas de eventos featured (bandera clásica) + eventos con show_in_home
      const { data: rowsFeatured } = await supabase
        .from("live_results")
        .select("id, event_name, event_slug, race, category, gender, round, position, athlete_name, club, country, race_time, home_sort_order")
        .eq("published", true)
        .eq("featured_in_live_center", true)
        .lte("position", 3)
        .order("home_sort_order", { ascending: true })
        .order("position", { ascending: true });

      let rowsHome: Row[] = [];
      if (homeSlugs.length > 0) {
        const { data } = await supabase
          .from("live_results")
          .select("id, event_name, event_slug, race, category, gender, round, position, athlete_name, club, country, race_time, home_sort_order")
          .eq("published", true)
          .in("event_slug", homeSlugs)
          .lte("position", 3)
          .order("position", { ascending: true });
        rowsHome = (data as Row[]) ?? [];
      }

      // Merge deduplicando por id
      const seen = new Set<string>();
      const merged: Row[] = [];
      for (const r of [...(rowsFeatured as Row[] ?? []), ...rowsHome]) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        merged.push(r);
      }

      if (cancelled) return;
      setEvents(evMap);
      setRows(merged);
    };

    load();
    const ch = supabase
      .channel("home-results-slider")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_results" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "result_events" }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, []);

  const groups: Group[] = useMemo(() => {
    if (!rows) return [];
    const map = new Map<string, Group>();
    for (const r of rows) {
      const slug = r.event_slug ?? "evento";
      const key = `${slug}::${r.race ?? ""}::${r.category ?? ""}::${r.gender ?? ""}::${r.round ?? ""}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          eventSlug: slug,
          eventName: r.event_name,
          race: r.race ?? "",
          category: r.category ?? "",
          gender: r.gender ?? "",
          round: r.round ?? "",
          homeOrder: r.home_sort_order ?? 0,
          rows: [],
        });
      }
      map.get(key)!.rows.push(r);
    }
    return Array.from(map.values())
      .map((g) => ({ ...g, rows: g.rows.sort((a, b) => a.position - b.position).slice(0, 3) }))
      .sort((a, b) => a.homeOrder - b.homeOrder);
  }, [rows]);

  const [emblaRef] = useEmblaCarousel(
    { align: "start", loop: groups.length > 3, slidesToScroll: 1 },
    [Autoplay({ delay: 5500, stopOnInteraction: true, stopOnMouseEnter: true })]
  );

  if (rows === null) return null;
  if (groups.length === 0) return null;

  return (
    <section className="border-y border-border bg-background py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-6 flex items-end justify-between border-b border-border pb-4">
          <div>
            <div className="font-condensed inline-flex items-center gap-2 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background">
              <Trophy className="h-3 w-3" /> Resultados destacados
            </div>
            <h2 className="font-display mt-2 text-2xl uppercase tracking-widest md:text-3xl">
              Podios <span className="text-gold">en directo</span>
            </h2>
          </div>
          <Link
            to="/resultados"
            className="font-condensed hidden text-xs font-bold uppercase tracking-widest text-gold hover:text-gold-light sm:inline-flex"
          >
            Ver todos →
          </Link>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {groups.map((g) => (
              <div
                key={g.key}
                className="min-w-0 flex-[0_0_85%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
              >
                <PodiumCard group={g} event={events[g.eventSlug]} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PodiumCard({ group, event }: { group: Group; event?: EventMeta }) {
  const search: Record<string, string> = {};
  if (group.race) search.prueba = group.race;
  if (group.category) search.categoria = group.category;
  if (group.gender) search.sexo = group.gender;
  if (group.round) search.ronda = group.round;

  return (
    <Link
      to="/resultados/$evento"
      params={{ evento: group.eventSlug }}
      search={search}
      className="group block h-full overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-gold hover:shadow-xl"
    >
      <div className="border-b border-border bg-gradient-to-b from-gold/10 to-transparent px-4 py-3">
        <div className="font-condensed flex items-center gap-2 text-[10px] uppercase tracking-[2.5px] text-gold">
          <span>{group.race || "Resultados"}</span>
          {group.round && <span className="text-muted-foreground">· {group.round}</span>}
        </div>
        <div className="font-display mt-1 line-clamp-1 text-lg uppercase tracking-wider text-foreground">
          {[group.category, group.gender].filter(Boolean).join(" · ") || group.eventName}
        </div>
        <div className="font-condensed mt-1 line-clamp-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          {group.eventName}
        </div>
      </div>

      <ul className="divide-y divide-border">
        {group.rows.map((r) => {
          const medal = ["🥇", "🥈", "🥉"][r.position - 1] ?? "🏅";
          const accent =
            r.position === 1 ? "text-gold" : r.position === 2 ? "text-foreground/80" : "text-amber-700";
          return (
            <li key={r.id} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 px-4 py-3">
              <span className={`font-display text-xl ${accent}`}>{medal}</span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">{r.athlete_name}</div>
                {r.club && (
                  <div className="font-condensed truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                    {r.club}{r.country ? ` · ${r.country}` : ""}
                  </div>
                )}
              </div>
              <span className="font-mono text-sm font-bold text-gold">{r.race_time ?? "—"}</span>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <div className="font-condensed flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          {event?.event_date && (
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(event.event_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</span>
          )}
          {event?.country && (
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.country}</span>
          )}
        </div>
        <span className="font-condensed inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gold transition-transform group-hover:translate-x-1">
          Ver <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
