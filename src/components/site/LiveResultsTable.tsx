import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, RefreshCw, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  status: "en_vivo" | "finalizado";
  sort_order: number;
  updated_at: string;
};

/**
 * Live Results table — realtime, sorted by position, with smooth animations.
 * Used on the homepage. Only shows results with status="en_vivo" by default.
 */
export function LiveResultsTable() {
  const [rows, setRows] = useState<LiveResultRow[] | null>(null);
  const prevPositionsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const fetchRows = async () => {
      const { data } = await supabase
        .from("live_results")
        .select(
          "id, event_name, event_slug, race, category, position, athlete_name, club, race_time, status, sort_order, updated_at",
        )
        .eq("published", true)
        .eq("status", "en_vivo")
        .order("sort_order", { ascending: true })
        .order("position", { ascending: true })
        .limit(50);
      if (!cancelled) setRows((data as LiveResultRow[]) ?? []);
    };

    fetchRows();

    const channel = supabase
      .channel("live-results-home")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_results" },
        () => {
          fetchRows();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // Group by event + race
  const groups = useMemo(() => {
    if (!rows) return [];
    const map = new Map<string, { event_name: string; event_slug: string | null; race: string | null; category: string | null; rows: LiveResultRow[] }>();
    for (const r of rows) {
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
    return Array.from(map.values()).map((g) => ({
      ...g,
      rows: g.rows.sort((a, b) => a.position - b.position),
    }));
  }, [rows]);

  // Track position changes for animation
  useEffect(() => {
    if (!rows) return;
    const next = new Map<string, number>();
    for (const r of rows) next.set(r.id, r.position);
    prevPositionsRef.current = next;
  }, [rows]);

  if (rows === null) {
    return (
      <section className="border-y-2 border-tv-red/40 bg-gradient-to-br from-background via-surface to-background">
        <div className="mx-auto max-w-7xl px-5 py-10 md:px-6">
          <div className="h-40 animate-pulse bg-surface" />
        </div>
      </section>
    );
  }

  if (groups.length === 0) return null;

  return (
    <section className="border-y-2 border-tv-red/40 bg-gradient-to-br from-background via-surface to-background">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-6 md:py-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <div className="live-red-tag font-condensed inline-flex items-center gap-2 bg-tv-red px-3 py-1.5 text-[11px] font-bold uppercase tracking-[3px] text-white">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
              Live Results
            </div>
            <h2 className="font-display text-2xl uppercase tracking-widest md:text-3xl">
              Resultados <span className="text-tv-red">en vivo</span>
            </h2>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {groups.map((g) => (
            <LiveGroup key={`${g.event_name}-${g.race}-${g.category}`} group={g} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveGroup({
  group,
}: {
  group: {
    event_name: string;
    event_slug: string | null;
    race: string | null;
    category: string | null;
    rows: LiveResultRow[];
  };
}) {
  return (
    <div className="border border-border bg-surface/60 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border bg-background/60 px-4 py-3">
        <div className="min-w-0">
          <h3 className="font-display truncate text-base uppercase tracking-widest text-foreground">
            {group.event_name}
          </h3>
          <div className="font-condensed mt-0.5 flex flex-wrap gap-x-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            {group.race && <span className="text-gold">{group.race}</span>}
            {group.category && <span>{group.category}</span>}
          </div>
        </div>
        <span className="live-red-tag font-condensed inline-flex shrink-0 items-center gap-1.5 bg-tv-red px-2 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-white">
          <span className="live-dot inline-block h-1 w-1 rounded-full bg-white" />
          Live
        </span>
      </div>

      <div className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="font-condensed border-b border-border bg-background/30 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-3 py-2 text-center">#</th>
              <th className="px-3 py-2">Atleta</th>
              <th className="hidden px-3 py-2 sm:table-cell">Club</th>
              <th className="px-3 py-2 text-right">Tiempo</th>
            </tr>
          </thead>
          <tbody>
            {group.rows.map((r) => (
              <LiveRow key={r.id} row={r} />
            ))}
          </tbody>
        </table>
      </div>

      {group.event_slug && (
        <div className="border-t border-border bg-background/30 px-4 py-3">
          <Link
            to="/events/$slug"
            params={{ slug: group.event_slug }}
            className="font-condensed inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gold hover:text-gold-dark"
          >
            Ver resultados completos <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

function LiveRow({ row }: { row: LiveResultRow }) {
  const [highlight, setHighlight] = useState(false);
  const updatedAtRef = useRef(row.updated_at);

  useEffect(() => {
    if (updatedAtRef.current !== row.updated_at) {
      updatedAtRef.current = row.updated_at;
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 1200);
      return () => clearTimeout(t);
    }
  }, [row.updated_at]);

  return (
    <tr
      className={`border-b border-border last:border-0 transition-colors duration-700 ${
        highlight ? "bg-gold/10" : "hover:bg-background/40"
      }`}
    >
      <td className="px-3 py-2.5 text-center">
        <span
          className={`font-display inline-flex h-6 w-6 items-center justify-center text-[11px] ${
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
      </td>
      <td className="font-display px-3 py-2.5 uppercase tracking-wider">{row.athlete_name}</td>
      <td className="hidden px-3 py-2.5 text-xs text-muted-foreground sm:table-cell">
        {row.club ?? "—"}
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-xs text-gold">
        {row.race_time ?? "—"}
      </td>
    </tr>
  );
}
