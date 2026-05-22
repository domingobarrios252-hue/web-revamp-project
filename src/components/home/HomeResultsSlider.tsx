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
  position: number;
  athlete_name: string;
  club: string | null;
  country: string | null;
  race_time: string | null;
};

type EventMeta = {
  slug: string;
  name: string;
  event_date: string | null;
  country: string | null;
  banner_url: string | null;
  placements: string[] | null;
};

type Group = {
  key: string;
  eventSlug: string;
  eventName: string;
  race: string;
  category: string;
  rows: Row[];
};

export type HomeResultsSliderProps = {
  /** Placement filter: 'home' (default), 'spain', 'general', or any custom tag */
  placement?: string;
  /** Override the title shown above the slider */
  title?: React.ReactNode;
  /** Override the small tag pill */
  tag?: string;
};

export function HomeResultsSlider({
  placement = "home",
  title,
  tag = "Resultados destacados",
}: HomeResultsSliderProps = {}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [events, setEvents] = useState<Record<string, EventMeta>>({});
  const [activeCategory, setActiveCategory] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: evs } = await supabase
        .from("result_events")
        .select("slug, name, event_date, country, banner_url, placements")
        .eq("published", true)
        .contains("placements", [placement])
        .order("sort_order", { ascending: true })
        .order("event_date", { ascending: false });
      const slugs = (evs ?? []).map((e: { slug: string }) => e.slug);
      const evMap: Record<string, EventMeta> = {};
      (evs ?? []).forEach((e: EventMeta) => { evMap[e.slug] = e; });

      if (slugs.length === 0) {
        if (!cancelled) { setEvents({}); setRows([]); }
        return;
      }

      const { data } = await supabase
        .from("live_results")
        .select("id, event_name, event_slug, race, category, gender, position, athlete_name, club, country, race_time")
        .eq("published", true)
        .lte("position", 3)
        .in("event_slug", slugs)
        .order("sort_order", { ascending: true })
        .order("position", { ascending: true });
      if (cancelled) return;
      setEvents(evMap);
      setRows((data as Row[]) ?? []);
    };
    load();
    const ch = supabase
      .channel(`home-results-slider-${placement}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_results" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "result_events" }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [placement]);

  const allGroups: Group[] = useMemo(() => {
    if (!rows) return [];
    const map = new Map<string, Group>();
    for (const r of rows) {
      const slug = r.event_slug ?? "evento";
      const key = `${slug}::${r.race ?? ""}::${r.category ?? ""}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          eventSlug: slug,
          eventName: r.event_name,
          race: r.race ?? "",
          category: r.category ?? "",
          rows: [],
        });
      }
      map.get(key)!.rows.push(r);
    }
    return Array.from(map.values()).map((g) => ({
      ...g,
      rows: g.rows.sort((a, b) => a.position - b.position).slice(0, 3),
    }));
  }, [rows]);

  const categories = useMemo(
    () => Array.from(new Set(allGroups.map((g) => g.category).filter(Boolean))).sort(),
    [allGroups],
  );

  const groups = useMemo(
    () => (activeCategory ? allGroups.filter((g) => g.category === activeCategory) : allGroups),
    [allGroups, activeCategory],
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: "start", loop: groups.length > 3, slidesToScroll: 1 },
    [Autoplay({ delay: 5500, stopOnInteraction: true, stopOnMouseEnter: true })],
  );

  // Reset carousel when filter changes
  useEffect(() => { emblaApi?.reInit(); }, [emblaApi, groups.length]);

  if (rows === null) return null;
  if (allGroups.length === 0) return null;

  return (
    <section className="border-y border-border bg-background py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="font-condensed inline-flex items-center gap-2 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background">
              <Trophy className="h-3 w-3" /> {tag}
            </div>
            <h2 className="font-display mt-2 text-2xl uppercase tracking-widest md:text-3xl">
              {title ?? <>Podios <span className="text-gold">por categoría</span></>}
            </h2>
          </div>
          <Link
            to="/resultados"
            className="font-condensed hidden text-xs font-bold uppercase tracking-widest text-gold hover:text-gold-light sm:inline-flex"
          >
            Ver todos →
          </Link>
        </div>

        {/* Category filter chips */}
        {categories.length > 1 && (
          <div className="mb-5 flex flex-wrap gap-2">
            <Chip active={activeCategory === ""} onClick={() => setActiveCategory("")} label="Todas" />
            {categories.map((c) => (
              <Chip key={c} active={activeCategory === c} onClick={() => setActiveCategory(c)} label={c} />
            ))}
          </div>
        )}

        {groups.length === 0 ? (
          <p className="font-condensed py-6 text-center text-xs uppercase tracking-widest text-muted-foreground">
            Sin podios para esta categoría
          </p>
        ) : (
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
        )}
      </div>
    </section>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "font-condensed rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors " +
        (active
          ? "border-gold bg-gold text-background"
          : "border-border bg-surface text-muted-foreground hover:border-gold hover:text-gold")
      }
    >
      {label}
    </button>
  );
}

function PodiumCard({ group, event }: { group: Group; event?: EventMeta }) {
  return (
    <Link
      to="/resultados/$evento"
      params={{ evento: group.eventSlug }}
      className="group block h-full overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-gold hover:shadow-xl"
    >
      <div className="border-b border-border bg-gradient-to-b from-gold/10 to-transparent px-4 py-3">
        <div className="font-condensed text-[10px] uppercase tracking-[2.5px] text-gold">
          {group.race || "Resultados"}
        </div>
        <div className="font-display mt-1 line-clamp-1 text-lg uppercase tracking-wider text-foreground">
          {group.category || group.eventName}
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
