import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Group = {
  id: string;
  competition_group: string;
  division_name: string;
  season: string;
  display_order: number;
  visible: boolean;
};

type Row = {
  id: string;
  group_id: string;
  position: number;
  club_name: string;
  club_logo: string | null;
  points: number;
};

type GroupWithRows = Group & { rows: Row[] };

export function HomeStandingsCarousel() {
  const [groups, setGroups] = useState<GroupWithRows[] | null>(null);
  const autoplay = useRef(
    Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true }),
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", slidesToScroll: 1 },
    [autoplay.current],
  );
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sb = supabase as any;
      const { data: g } = await sb
        .from("home_standings_groups")
        .select("*")
        .eq("visible", true)
        .order("display_order", { ascending: true });
      if (!g || cancelled) {
        if (!cancelled) setGroups([]);
        return;
      }
      const ids = g.map((x: Group) => x.id);
      const { data: r } = ids.length
        ? await sb
            .from("home_standings_rows")
            .select("*")
            .in("group_id", ids)
            .order("position", { ascending: true })
        : { data: [] };
      if (cancelled) return;
      const byGroup = new Map<string, Row[]>();
      (r ?? []).forEach((row: Row) => {
        const arr = byGroup.get(row.group_id) ?? [];
        arr.push(row);
        byGroup.set(row.group_id, arr);
      });
      setGroups(g.map((x: Group) => ({ ...x, rows: (byGroup.get(x.id) ?? []).slice(0, 5) })));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    setSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", () => {
      setSnaps(emblaApi.scrollSnapList());
      onSelect();
    });
    onSelect();
  }, [emblaApi, groups]);

  const items = useMemo(() => groups ?? [], [groups]);

  return (
    <section className="relative mx-auto max-w-7xl px-5 py-10 md:px-6 md:py-14">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-gold" />
            <h2 className="font-display text-2xl uppercase tracking-widest md:text-3xl">
              Liga Nacional
            </h2>
          </div>
          <div className="mt-2 h-[3px] w-20 bg-gold" aria-hidden="true" />
        </div>
        <Link
          to="/liga-nacional/clasificaciones"
          className="font-condensed group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold transition-all hover:text-gold-light hover:drop-shadow-[0_0_8px_rgba(212,160,23,0.6)]"
        >
          Ver todas las clasificaciones{" "}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Carousel */}
      {groups === null ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <StandingCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          Aún no hay clasificaciones publicadas.
        </div>
      ) : (
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-4">
              {items.map((g) => (
                <div
                  key={g.id}
                  className="min-w-0 shrink-0 grow-0 basis-full pl-4 sm:basis-1/2 lg:basis-1/4"
                >
                  <StandingCard group={g} />
                </div>
              ))}
            </div>
          </div>

          {items.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Anterior"
                onClick={() => emblaApi?.scrollPrev()}
                className="absolute -left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-foreground backdrop-blur-md transition-all hover:border-gold hover:text-gold hover:shadow-[0_0_18px_rgba(212,160,23,0.45)] md:flex"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Siguiente"
                onClick={() => emblaApi?.scrollNext()}
                className="absolute -right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-foreground backdrop-blur-md transition-all hover:border-gold hover:text-gold hover:shadow-[0_0_18px_rgba(212,160,23,0.45)] md:flex"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {snaps.length > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2">
              {snaps.map((_, i) => {
                const active = i === selected;
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Ir a ${i + 1}`}
                    onClick={() => emblaApi?.scrollTo(i)}
                    className={
                      "h-1.5 rounded-full transition-all duration-300 " +
                      (active ? "w-8 bg-gold" : "w-3 bg-white/25 hover:bg-white/60")
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function StandingCard({ group }: { group: GroupWithRows }) {
  return (
    <Link
      to="/resultados"
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-gradient-to-b from-surface to-surface-2/40 shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-[0_8px_32px_rgba(212,160,23,0.25)]"
    >
      {/* Header */}
      <div className="border-b border-border bg-black/30 px-4 py-3">
        <div className="font-condensed text-[10px] font-bold uppercase tracking-[2.5px] text-gold">
          {group.competition_group}
        </div>
        <h3 className="font-display mt-1 text-base uppercase leading-tight tracking-wide text-foreground md:text-[17px]">
          {group.division_name}
        </h3>
        <div className="font-condensed mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          {group.season}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 px-2 py-3">
        <div className="font-condensed grid grid-cols-[28px_1fr_48px] gap-2 px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <span>Pos</span>
          <span>Club</span>
          <span className="text-right">Pts</span>
        </div>
        {group.rows.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-muted-foreground">Sin datos</div>
        ) : (
          <ul className="divide-y divide-border/60">
            {group.rows.map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-[28px_1fr_48px] items-center gap-2 px-2 py-2"
              >
                <span
                  className={
                    "font-display text-sm font-black " +
                    (r.position <= 3 ? "text-gold" : "text-muted-foreground")
                  }
                >
                  {r.position}
                </span>
                <span className="flex items-center gap-2 min-w-0">
                  {r.club_logo ? (
                    <img
                      src={r.club_logo}
                      alt=""
                      className="h-6 w-6 shrink-0 rounded-sm object-contain bg-black/40"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-black/40 text-[9px] font-bold text-gold/70">
                      {r.club_name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="truncate text-[13px] font-semibold text-foreground">
                    {r.club_name}
                  </span>
                </span>
                <span className="font-display text-right text-sm font-black text-gold">
                  {Number(r.points).toFixed(0)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-black/20 px-4 py-3">
        <span className="font-condensed inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gold transition-transform group-hover:translate-x-1">
          Ver clasificación completa <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

function StandingCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="h-[78px] animate-pulse border-b border-border bg-surface-2/60" />
      <div className="space-y-2 p-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-7 animate-pulse rounded bg-surface-2/60" />
        ))}
      </div>
    </div>
  );
}
