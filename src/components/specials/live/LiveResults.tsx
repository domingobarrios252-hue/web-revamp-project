import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { dayChipLabel, dayInTz, timeInTz } from "@/lib/specials/liveEvent";
import { RESULT_STATE_LABEL, type NormalizedResult, type ResultState } from "@/lib/results/provider";

export const RESULTS_FOCUS_EVENT = "rz:results-focus";
export const DEFAULT_RESULTS_EMPTY = "Los resultados estarán disponibles durante la competición.";

type Props = { results: NormalizedResult[]; tz: string; emptyText?: string | null };
type FilterKey = "day" | "race" | "category" | "gender" | "phase";

const FILTER_LABEL: Record<FilterKey, string> = {
  day: "Día",
  race: "Prueba",
  category: "Categoría",
  gender: "Género",
  phase: "Fase",
};

const STATE_RANK: Record<ResultState, number> = { in_progress: 0, provisional: 1, upcoming: 2, official: 3 };

function valueOf(r: NormalizedResult, k: FilterKey, tz: string) {
  if (k === "day") return r.scheduledAt ? dayInTz(r.scheduledAt, tz) : null;
  return r[k] || null;
}

/** Sección RESULTADOS del hub. Datos normalizados (manual hoy; VeloPro en el futuro). */
export function LiveResults({ results, tz, emptyText }: Props) {
  const [filters, setFilters] = useState<Partial<Record<FilterKey, string>>>({});
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    const on = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (id) {
        setFocus(id);
        setFilters({});
      }
    };
    window.addEventListener(RESULTS_FOCUS_EVENT, on);
    return () => window.removeEventListener(RESULTS_FOCUS_EVENT, on);
  }, []);

  const options = useMemo(() => {
    const out: { key: FilterKey; values: string[] }[] = [];
    for (const k of Object.keys(FILTER_LABEL) as FilterKey[]) {
      const set = new Set<string>();
      for (const r of results) {
        const v = valueOf(r, k, tz);
        if (v) set.add(v);
      }
      if (set.size >= 2) out.push({ key: k, values: [...set].sort() });
    }
    return out;
  }, [results, tz]);

  const filtered = useMemo(
    () =>
      results.filter((r) => {
        if (focus && r.scheduleItemId !== focus) return false;
        return (Object.entries(filters) as [FilterKey, string][]).every(([k, v]) => !v || valueOf(r, k, tz) === v);
      }),
    [results, filters, focus, tz],
  );

  const groups = useMemo(() => {
    const m = new Map<string, NormalizedResult[]>();
    for (const r of filtered) {
      const k = r.scheduleItemId ?? [r.race, r.phase, r.category, r.gender].join("|");
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    const list = [...m.values()].map((rows) => {
      rows.sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999) || a.sort - b.sort);
      const state = rows.reduce<ResultState>((acc, r) => (STATE_RANK[r.state] < STATE_RANK[acc] ? r.state : acc), "official");
      return { rows, state, head: rows[0] };
    });
    list.sort((a, b) => (b.head.scheduledAt ?? "").localeCompare(a.head.scheduledAt ?? ""));
    return list;
  }, [filtered]);

  return (
    <section id="resultados" className="scroll-mt-14 bg-background py-8 md:py-12">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <h2 className="font-display text-2xl uppercase tracking-wider text-foreground">Resultados</h2>

        {results.length === 0 ? (
          <p className="mt-2 border-l-2 border-gold pl-3 text-sm text-muted-foreground">
            {emptyText?.trim() || DEFAULT_RESULTS_EMPTY}
          </p>
        ) : (
          <>
            {focus && (
              <button
                type="button"
                onClick={() => setFocus(null)}
                className="font-condensed mt-3 inline-flex min-h-11 items-center border border-gold px-3 text-[11px] font-bold uppercase tracking-widest text-gold"
              >
                Prueba seleccionada · Ver todos ✕
              </button>
            )}
            {!focus &&
              options.map((o) => (
                <div key={o.key} className="mt-3">
                  <div className="font-condensed mb-1 text-[10px] uppercase tracking-[2px] text-muted-foreground">
                    {FILTER_LABEL[o.key]}
                  </div>
                  <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
                    {["", ...o.values].map((v) => {
                      const active = (filters[o.key] ?? "") === v;
                      return (
                        <button
                          key={v || "all"}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setFilters((f) => ({ ...f, [o.key]: v }))}
                          className={
                            "font-condensed min-h-11 shrink-0 whitespace-nowrap border px-3 text-[11px] font-bold uppercase tracking-widest " +
                            (active ? "border-gold bg-gold text-background" : "border-border text-foreground")
                          }
                        >
                          {v ? (o.key === "day" ? dayChipLabel(v) : v) : "Todos"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

            <div className="mt-5 space-y-6">
              {groups.length === 0 && <p className="text-sm text-muted-foreground">No hay resultados con estos filtros.</p>}
              {groups.map((g) => (
                <ResultGroup key={g.head.scheduleItemId ?? g.head.id} rows={g.rows} state={g.state} tz={tz} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function StateBadge({ state }: { state: ResultState }) {
  const cls =
    state === "provisional"
      ? "border border-gold bg-gold/15 text-gold"
      : state === "in_progress"
        ? "bg-destructive text-destructive-foreground"
        : state === "official"
          ? "bg-foreground text-background"
          : "border border-border text-muted-foreground";
  return (
    <span className={"font-condensed inline-flex shrink-0 items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px] " + cls}>
      {RESULT_STATE_LABEL[state]}
    </span>
  );
}

function ResultGroup({ rows, state, tz }: { rows: NormalizedResult[]; state: ResultState; tz: string }) {
  const h = rows[0];
  const meta = [h.phase, h.category, h.gender].filter(Boolean).join(" · ");
  return (
    <article className="border border-border bg-surface">
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-border p-3">
        <div className="min-w-0">
          <h3 className="font-display break-words text-lg uppercase leading-tight text-foreground">{h.race || "Prueba"}</h3>
          <p className="font-condensed mt-0.5 text-[11px] uppercase tracking-[1.5px] text-muted-foreground">
            {[meta, h.scheduledAt ? `${dayChipLabel(dayInTz(h.scheduledAt, tz))} · ${timeInTz(h.scheduledAt, tz)}` : ""]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <StateBadge state={state} />
      </header>
      {state === "provisional" && (
        <p className="font-condensed border-b border-gold/40 bg-gold/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[1.5px] text-gold">
          Resultados provisionales · pendientes de confirmación oficial
        </p>
      )}
      <ol>
        {rows.map((r) => (
          <ResultRow key={r.id} r={r} />
        ))}
      </ol>
    </article>
  );
}

function ResultRow({ r }: { r: NormalizedResult }) {
  const [open, setOpen] = useState(false);
  const perf = r.time || (r.points !== null && r.points !== undefined ? `${r.points} pts` : "—");
  const extra: [string, string | null][] = [
    ["Dorsal", r.bib],
    ["Categoría", r.category],
    ["Género", r.gender],
    ["Fase", r.phase],
    ["Diferencia", r.gap],
    ["Puntos", r.time && r.points !== null && r.points !== undefined ? String(r.points) : null],
    ["Club", r.club],
    ["Federación", r.federation],
    ["Récord / marca", r.record],
    ["Notas", r.notes],
  ];
  const details = extra.filter(([, v]) => v);
  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => details.length && setOpen((o) => !o)}
        aria-expanded={details.length ? open : undefined}
        className="grid min-h-12 w-full grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-2 text-left"
      >
        <span className="font-display text-xl text-gold">{r.position ?? "—"}</span>
        <span className="min-w-0">
          <span className="block break-words text-sm font-semibold uppercase leading-snug text-foreground">{r.athlete}</span>
          {r.country && (
            <span className="font-condensed block truncate text-[11px] uppercase tracking-[1.5px] text-muted-foreground">{r.country}</span>
          )}
        </span>
        <span className="flex items-center gap-1">
          {r.record && <span className="font-condensed bg-gold px-1 text-[9px] font-bold uppercase text-background">{r.record}</span>}
          <span className="font-display text-base tabular-nums text-foreground">{perf}</span>
          {details.length > 0 && (
            <ChevronDown className={"h-4 w-4 text-muted-foreground transition-transform " + (open ? "rotate-180" : "")} />
          )}
        </span>
      </button>
      {open && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 px-3 pb-3 pl-[3.75rem] text-xs sm:grid-cols-3">
          {details.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="font-condensed text-[10px] uppercase tracking-[1.5px] text-muted-foreground">{k}</dt>
              <dd className="break-words text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}
