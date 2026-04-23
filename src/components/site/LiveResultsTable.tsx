import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Trophy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type LiveResultStatus = "en_vivo" | "finalizado" | "proxima";

export type LiveResultRow = {
  id: string;
  event_name: string;
  event_slug: string | null;
  race: string | null;
  category: string | null;
  position: number;
  athlete_name: string;
  club: string | null;
  race_time: string | null;
  points: number | null;
  status: LiveResultStatus;
  sort_order: number;
  updated_at: string;
};

const REFRESH_MS = 15_000;
const ALL = "__all__";

/**
 * Live Results — real-time sports results module.
 * - Filtros: Evento / Carrera / Categoría
 * - Estados: 🔴 LIVE · ✅ FINAL · ⏳ UPCOMING
 * - Auto-refresh cada 15s + realtime postgres_changes
 * - Top 3 destacados, animaciones suaves al actualizar
 *
 * Props:
 * - compact: render mini-carrusel (sin section wrapper / filtros / header grande),
 *   pensado para encajar en una columna lateral junto a TV y Próximas pruebas.
 */
export function LiveResultsTable({ compact = false }: { compact?: boolean } = {}) {
  const [rows, setRows] = useState<LiveResultRow[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const prevPositionsRef = useRef<Map<string, number>>(new Map());
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scrollByCards = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    // Scroll ~ one card width
    const amount = Math.max(220, Math.round(el.clientWidth * 0.85));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  // Filtros
  const [filterEvent, setFilterEvent] = useState<string>(ALL);
  const [filterRace, setFilterRace] = useState<string>(ALL);
  const [filterCategory, setFilterCategory] = useState<string>(ALL);

  // Tick para mostrar "hace Xs" actualizado
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchRows = async () => {
      setRefreshing(true);
      const { data } = await supabase
        .from("live_results")
        .select(
          "id, event_name, event_slug, race, category, position, athlete_name, club, race_time, points, status, sort_order, updated_at",
        )
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .order("position", { ascending: true })
        .limit(200);
      if (!cancelled) {
        setRows((data as LiveResultRow[]) ?? []);
        setLastUpdated(new Date());
        setTimeout(() => {
          if (!cancelled) setRefreshing(false);
        }, 350);
      }
    };

    fetchRows();

    const channel = supabase
      .channel("live-results-home")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_results" },
        () => fetchRows(),
      )
      .subscribe();

    // Auto-refresh cada 15s (cumple requisito UX)
    const interval = setInterval(fetchRows, REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Listas únicas para los selects
  const allEvents = useMemo(
    () => Array.from(new Set((rows ?? []).map((r) => r.event_name))).sort(),
    [rows],
  );
  const allRaces = useMemo(() => {
    const subset = (rows ?? []).filter(
      (r) => filterEvent === ALL || r.event_name === filterEvent,
    );
    return Array.from(new Set(subset.map((r) => r.race).filter(Boolean) as string[])).sort();
  }, [rows, filterEvent]);
  const allCategories = useMemo(() => {
    const subset = (rows ?? []).filter(
      (r) =>
        (filterEvent === ALL || r.event_name === filterEvent) &&
        (filterRace === ALL || r.race === filterRace),
    );
    return Array.from(
      new Set(subset.map((r) => r.category).filter(Boolean) as string[]),
    ).sort();
  }, [rows, filterEvent, filterRace]);

  // Reset filtros dependientes si dejan de existir
  useEffect(() => {
    if (filterRace !== ALL && !allRaces.includes(filterRace)) setFilterRace(ALL);
  }, [allRaces, filterRace]);
  useEffect(() => {
    if (filterCategory !== ALL && !allCategories.includes(filterCategory))
      setFilterCategory(ALL);
  }, [allCategories, filterCategory]);

  const filtered = useMemo(() => {
    return (rows ?? []).filter(
      (r) =>
        (filterEvent === ALL || r.event_name === filterEvent) &&
        (filterRace === ALL || r.race === filterRace) &&
        (filterCategory === ALL || r.category === filterCategory),
    );
  }, [rows, filterEvent, filterRace, filterCategory]);

  // Agrupar por evento + carrera + categoría
  const groups = useMemo(() => {
    const map = new Map<
      string,
      {
        event_name: string;
        event_slug: string | null;
        race: string | null;
        category: string | null;
        rows: LiveResultRow[];
      }
    >();
    for (const r of filtered) {
      const key = `${r.event_name}::${r.race ?? ""}::${r.category ?? ""}`;
      if (!map.has(key)) {
        map.set(key, {
          event_name: r.event_name,
          event_slug: r.event_slug,
          race: r.race,
          category: r.category,
          rows: [],
        });
      }
      map.get(key)!.rows.push(r);
    }
    // Orden de grupos: live primero, luego upcoming, luego final
    return Array.from(map.values())
      .map((g) => ({
        ...g,
        rows: g.rows.sort((a, b) => a.position - b.position),
      }))
      .sort((a, b) => groupPriority(a.rows) - groupPriority(b.rows));
  }, [filtered]);

  // Snapshot de posiciones previas para animar tendencia
  const prevPositions = prevPositionsRef.current;
  useEffect(() => {
    if (!rows) return;
    const next = new Map<string, number>();
    for (const r of rows) next.set(r.id, r.position);
    prevPositionsRef.current = next;
  }, [rows]);

  if (rows === null) {
    if (compact) {
      return <div className="h-32 animate-pulse bg-surface" />;
    }
    return (
      <section className="border-y-2 border-tv-red/40 bg-gradient-to-br from-background via-surface to-background">
        <div className="mx-auto max-w-7xl px-5 py-10 md:px-6">
          <div className="h-40 animate-pulse bg-surface" />
        </div>
      </section>
    );
  }

  // Si no hay nada absolutamente, ocultar
  if ((rows ?? []).length === 0) return null;

  // ====== COMPACT MODE: mini-carrusel para columna lateral ======
  if (compact) {
    return (
      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-sm uppercase tracking-widest text-foreground">
              Resultados <span className="text-tv-red">en vivo</span>
            </h3>
            <RefreshCw
              className={`h-3 w-3 text-gold ${refreshing ? "animate-spin" : ""}`}
              aria-hidden
            />
          </div>
          <span className="font-condensed text-[9px] uppercase tracking-widest text-muted-foreground">
            {lastUpdated ? formatRelative(lastUpdated) : "auto"}
          </span>
        </div>

        {groups.length === 0 ? (
          <p className="font-condensed py-4 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
            Sin resultados
          </p>
        ) : (
          <div className="relative">
            <div
              ref={(el) => {
                scrollerRef.current = el;
                if (el) requestAnimationFrame(updateScrollState);
              }}
              onScroll={updateScrollState}
              className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {groups.map((g) => (
                <div
                  key={`${g.event_name}-${g.race}-${g.category}`}
                  className="w-[150px] shrink-0 snap-start"
                >
                  <LiveGroup group={g} prevPositions={prevPositions} compact />
                </div>
              ))}
            </div>

            <div className="mt-1 flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => scrollByCards(-1)}
                aria-label="Anterior"
                disabled={!canScrollLeft}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background/90 text-foreground transition-all disabled:opacity-30 hover:border-tv-red hover:text-tv-red"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => scrollByCards(1)}
                aria-label="Siguiente"
                disabled={!canScrollRight}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background/90 text-foreground transition-all disabled:opacity-30 hover:border-tv-red hover:text-tv-red"
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ====== DEFAULT MODE: section completa con filtros ======
  return (
    <section className="border-y-2 border-tv-red/40 bg-gradient-to-br from-background via-surface to-background">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-6 md:py-14">
        {/* HEADER */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <div className="live-red-tag font-condensed inline-flex items-center gap-2 bg-tv-red px-3 py-1.5 text-[11px] font-bold uppercase tracking-[3px] text-white">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
              Live Results
            </div>
            <h2 className="font-display text-2xl uppercase tracking-widest md:text-3xl">
              Resultados <span className="text-tv-red">en vivo</span>
            </h2>
          </div>
          <div className="font-condensed flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            <RefreshCw
              className={`h-3.5 w-3.5 text-gold ${refreshing ? "animate-spin" : ""}`}
              aria-hidden
            />
            <span>
              {refreshing
                ? "Actualizando…"
                : lastUpdated
                  ? `Actualizado ${formatRelative(lastUpdated)}`
                  : "Auto-refresh activo"}
            </span>
          </div>
        </div>

        {/* FILTROS */}
        <div className="mb-6 grid gap-2 sm:grid-cols-3">
          <FilterSelect
            label="Evento"
            value={filterEvent}
            onChange={setFilterEvent}
            options={allEvents}
          />
          <FilterSelect
            label="Carrera"
            value={filterRace}
            onChange={setFilterRace}
            options={allRaces}
          />
          <FilterSelect
            label="Categoría"
            value={filterCategory}
            onChange={setFilterCategory}
            options={allCategories}
          />
        </div>

        {groups.length === 0 ? (
          <p className="font-condensed py-10 text-center text-xs uppercase tracking-widest text-muted-foreground">
            Sin resultados con esos filtros.
          </p>
        ) : (
          <div className="relative">
            {/* Botones de navegación */}
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              aria-label="Anterior"
              className={`absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 hidden h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md backdrop-blur transition-all hover:border-tv-red hover:text-tv-red sm:flex ${
                canScrollLeft ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              aria-label="Siguiente"
              className={`absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2 hidden h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md backdrop-blur transition-all hover:border-tv-red hover:text-tv-red sm:flex ${
                canScrollRight ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>

            <div
              ref={(el) => {
                scrollerRef.current = el;
                if (el) requestAnimationFrame(updateScrollState);
              }}
              onScroll={updateScrollState}
              className="-mx-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-3 md:-mx-6 md:px-6 [scrollbar-width:thin]"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {groups.map((g) => (
                <div
                  key={`${g.event_name}-${g.race}-${g.category}`}
                  className="w-[260px] shrink-0 snap-start sm:w-[280px]"
                >
                  <LiveGroup group={g} prevPositions={prevPositions} />
                </div>
              ))}
            </div>

            {/* Botones móvil bajo el carrusel */}
            <div className="mt-2 flex justify-center gap-2 sm:hidden">
              <button
                type="button"
                onClick={() => scrollByCards(-1)}
                aria-label="Anterior"
                disabled={!canScrollLeft}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 text-foreground transition-all disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => scrollByCards(1)}
                aria-label="Siguiente"
                disabled={!canScrollRight}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 text-foreground transition-all disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function groupPriority(rows: LiveResultRow[]): number {
  // Determina el estado dominante del grupo (prioriza el más "vivo")
  if (rows.some((r) => r.status === "en_vivo")) return 0;
  if (rows.some((r) => r.status === "proxima")) return 1;
  return 2;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-condensed text-[10px] uppercase tracking-[3px] text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-condensed border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-foreground transition-colors focus:border-gold focus:outline-none"
      >
        <option value={ALL}>Todos</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({ status }: { status: LiveResultStatus }) {
  if (status === "en_vivo") {
    return (
      <span className="live-red-tag font-condensed inline-flex shrink-0 items-center gap-1.5 bg-tv-red px-2 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-white">
        <span className="live-dot inline-block h-1 w-1 rounded-full bg-white" />
        Live
      </span>
    );
  }
  if (status === "proxima") {
    return (
      <span className="font-condensed inline-flex shrink-0 items-center gap-1.5 border border-gold/60 bg-gold/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-gold">
        <span aria-hidden>⏳</span> Próxima
      </span>
    );
  }
  return (
    <span className="font-condensed inline-flex shrink-0 items-center gap-1.5 border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-emerald-400">
      <span aria-hidden>✓</span> Final
    </span>
  );
}

function formatRelative(date: Date) {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 5) return "ahora mismo";
  if (seconds < 60) return `hace ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `hace ${hours} h`;
}

function LiveGroup({
  group,
  prevPositions,
}: {
  group: {
    event_name: string;
    event_slug: string | null;
    race: string | null;
    category: string | null;
    rows: LiveResultRow[];
  };
  prevPositions: Map<string, number>;
}) {
  // Determinar estado dominante para el badge del grupo
  const dominantStatus: LiveResultStatus = group.rows.some((r) => r.status === "en_vivo")
    ? "en_vivo"
    : group.rows.some((r) => r.status === "proxima")
      ? "proxima"
      : "finalizado";

  const showPoints = group.rows.some((r) => r.points !== null && r.points !== undefined);
  const isUpcoming = dominantStatus === "proxima";

  return (
    <div className="flex h-full flex-col border border-border bg-surface/60 backdrop-blur-sm transition-colors">
      <div className="flex items-start justify-between gap-2 border-b border-border bg-background/60 px-3 py-2">
        <div className="min-w-0">
          <h3 className="font-display truncate text-sm uppercase tracking-widest text-foreground">
            {group.event_name}
          </h3>
          <div className="font-condensed mt-0.5 flex flex-wrap gap-x-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            {group.race && <span className="text-gold">{group.race}</span>}
            {group.category && <span className="truncate">{group.category}</span>}
          </div>
        </div>
        <StatusBadge status={dominantStatus} />
      </div>

      {isUpcoming ? (
        <div className="flex flex-1 items-center justify-center gap-2 px-3 py-6 text-center">
          <span className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
            Inscritos: {group.rows.length}
          </span>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="font-condensed border-b border-border bg-background/30 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-2 py-1.5 text-center">#</th>
                <th className="px-2 py-1.5">Atleta</th>
                <th className="px-2 py-1.5 text-right">Tiempo</th>
                {showPoints && <th className="px-2 py-1.5 text-right">Pts</th>}
              </tr>
            </thead>
            <tbody>
              {group.rows.map((r) => (
                <LiveRow
                  key={r.id}
                  row={r}
                  prevPosition={prevPositions.get(r.id)}
                  showPoints={showPoints}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {group.event_slug && !isUpcoming && (
        <div className="border-t border-border bg-background/30 px-3 py-2">
          <Link
            to="/events/$slug"
            params={{ slug: group.event_slug }}
            className="font-condensed group inline-flex w-full items-center justify-center gap-1.5 border border-tv-red/60 bg-tv-red/10 px-2 py-1.5 text-[10px] font-bold uppercase tracking-[2px] text-tv-red transition-all hover:bg-tv-red hover:text-white"
          >
            Ver evento
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </div>
  );
}

function LiveRow({
  row,
  prevPosition,
  showPoints,
}: {
  row: LiveResultRow;
  prevPosition: number | undefined;
  showPoints: boolean;
}) {
  const [highlight, setHighlight] = useState(false);
  const updatedAtRef = useRef(row.updated_at);

  useEffect(() => {
    if (updatedAtRef.current !== row.updated_at) {
      updatedAtRef.current = row.updated_at;
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 1400);
      return () => clearTimeout(t);
    }
  }, [row.updated_at]);

  const trend: "up" | "down" | "same" | "new" =
    prevPosition === undefined
      ? "new"
      : prevPosition > row.position
        ? "up"
        : prevPosition < row.position
          ? "down"
          : "same";

  const isTop3 = row.position >= 1 && row.position <= 3;

  return (
    <tr
      className={`border-b border-border last:border-0 transition-all duration-700 ease-out animate-fade-in ${
        highlight
          ? "bg-gold/15 shadow-[inset_3px_0_0_0] shadow-gold"
          : isTop3
            ? "bg-gold/[0.04] hover:bg-background/40"
            : "hover:bg-background/40"
      }`}
    >
      <td className="px-2 py-1.5 text-center">
        <div className="inline-flex items-center gap-0.5">
          <span
            className={`font-display inline-flex h-5 w-5 items-center justify-center text-[10px] transition-transform duration-500 ${
              highlight ? "scale-110" : ""
            } ${
              row.position === 1
                ? "bg-gold text-background"
                : row.position === 2
                  ? "bg-foreground/30 text-background"
                  : row.position === 3
                    ? "bg-amber-700/70 text-background"
                    : "text-muted-foreground"
            }`}
          >
            {row.position}
          </span>
          {trend === "up" && (
            <ChevronUp
              className="h-2.5 w-2.5 text-emerald-500 animate-fade-in"
              aria-label="Subió posiciones"
            />
          )}
          {trend === "down" && (
            <ChevronDown
              className="h-2.5 w-2.5 text-tv-red animate-fade-in"
              aria-label="Bajó posiciones"
            />
          )}
          {trend === "same" && prevPosition !== undefined && (
            <Minus className="h-2.5 w-2.5 text-muted-foreground/40" aria-hidden />
          )}
        </div>
      </td>
      <td className="font-display px-2 py-1.5 uppercase tracking-wider">
        <span className="inline-flex items-center gap-1 text-[12px] leading-tight">
          {row.position === 1 && <Trophy className="h-3 w-3 text-gold" aria-hidden />}
          <span className="truncate">{row.athlete_name}</span>
        </span>
        {row.club && (
          <div className="font-condensed mt-0.5 truncate text-[10px] uppercase tracking-wider text-muted-foreground/80">
            {row.club}
          </div>
        )}
      </td>
      <td className="px-2 py-1.5 text-right font-mono text-[12px] text-gold whitespace-nowrap">
        {row.race_time ?? "—"}
      </td>
      {showPoints && (
        <td className="px-2 py-1.5 text-right font-mono text-[12px] text-foreground/80">
          {row.points !== null && row.points !== undefined ? row.points : "—"}
        </td>
      )}
    </tr>
  );
}
