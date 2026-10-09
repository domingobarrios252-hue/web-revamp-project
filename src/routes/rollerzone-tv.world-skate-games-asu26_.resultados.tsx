import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loadEventResults, type NormalizedResult } from "@/lib/results/provider";
import { dayInTz, timeInTz, type ScheduleItem } from "@/lib/specials/liveEvent";
import { ASU26_DEFAULTS, ASU26_RESULT_EVENT_ID, ASU26_TZ, loadAsu26Config, type Asu26StreamingConfig } from "@/lib/tv/asu26Streaming";
import { Asu26Results } from "@/components/tv/asu26/Asu26Results";
import veloproLogo from "@/assets/logo-velopro-tight.png.asset.json";

const PAGE_URL = "https://rollerzone.es/rollerzone-tv/world-skate-games-asu26/resultados";
const TITLE = "Resultados oficiales ASU26 · Patinaje de Velocidad | Rollerzone.TV";
const DESC = "Clasificaciones oficiales del patinaje de velocidad en los World Skate Games ASU26 2026, por fecha, prueba, categoría y género. Powered by VeloPro.";

export const Route = createFileRoute("/rollerzone-tv/world-skate-games-asu26_/resultados")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: "Resultados oficiales ASU26 · Patinaje de Velocidad" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PAGE_URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: Asu26ResultsPage,
});

const norm = (v: string | null | undefined) => (v ?? "").trim();
const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));

function dayLabel(day: string) {
  return new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="font-condensed text-[10px] font-bold uppercase tracking-[2px] text-asu">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="min-h-11 w-full min-w-0 rounded-lg border border-asu/30 bg-surface px-3 text-sm text-asu-ink"
      >
        <option value="">Todas</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

function Asu26ResultsPage() {
  const [cfg, setCfg] = useState<Asu26StreamingConfig>(ASU26_DEFAULTS);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [results, setResults] = useState<NormalizedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ day: "", mod: "", race: "", cat: "", gen: "" });

  useEffect(() => {
    let off = false;
    const load = async () => {
      const [c, s] = await Promise.all([
        loadAsu26Config(),
        supabase
          .from("schedule_items")
          .select("*")
          .eq("result_event_id", ASU26_RESULT_EVENT_ID)
          .eq("published", true)
          .order("scheduled_at")
          .order("sort_order"),
      ]);
      const list = (s.data ?? []) as ScheduleItem[];
      const r = await loadEventResults(supabase, ASU26_RESULT_EVENT_ID, null, new Map(list.map((i) => [i.id, i.scheduled_at]))).catch(() => []);
      if (off) return;
      setCfg(c);
      setItems(list);
      setResults(r);
      setLoading(false);
    };
    load();
    const t = setInterval(load, 120_000);
    return () => {
      off = true;
      clearInterval(t);
    };
  }, []);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const opts = useMemo(
    () => ({
      day: uniq(items.map((i) => dayInTz(i.scheduled_at, ASU26_TZ))).map((d) => [d, dayLabel(d)] as [string, string]),
      mod: uniq(items.map((i) => norm(i.venue_type))).map((v) => [v, v] as [string, string]),
      race: uniq(items.map((i) => norm(i.event_name))).map((v) => [v, v] as [string, string]),
      cat: uniq(results.map((r) => norm(r.category))).map((v) => [v, v] as [string, string]),
      gen: uniq(results.map((r) => norm(r.gender))).map((v) => [v, v] as [string, string]),
    }),
    [items, results],
  );

  const itemOk = (i: ScheduleItem | undefined) =>
    !!i &&
    (!f.day || dayInTz(i.scheduled_at, ASU26_TZ) === f.day) &&
    (!f.mod || norm(i.venue_type) === f.mod) &&
    (!f.race || norm(i.event_name) === f.race);

  const filtered = results.filter((r) => {
    const it = r.scheduleItemId ? byId.get(r.scheduleItemId) : undefined;
    if ((f.day || f.mod || f.race) && !itemOk(it)) return false;
    if (f.cat && norm(r.category) !== f.cat) return false;
    if (f.gen && norm(r.gender) !== f.gen) return false;
    return true;
  });
  const withResults = new Set(results.filter((r) => r.state !== "upcoming").map((r) => r.scheduleItemId));
  const pending = items.filter((i) => itemOk(i) && !withResults.has(i.id));
  const hasFilter = Object.values(f).some(Boolean);

  return (
    <div className="asu-light relative isolate w-full min-w-0 overflow-x-clip pb-14">
      <div className="mx-auto max-w-[1500px] px-4 pt-6 md:px-8 md:pt-10">
        <Link
          to="/rollerzone-tv/world-skate-games-asu26"
          className="font-condensed inline-flex min-h-11 items-center gap-2 text-xs font-bold uppercase tracking-[2px] text-asu-coral"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a En directo
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="font-condensed text-xs font-bold uppercase tracking-[2.5px] text-asu-coral">World Skate Games ASU26 · Patinaje de velocidad</p>
            <h1 className="font-display mt-1 text-5xl uppercase leading-[0.95] tracking-wide md:text-7xl">
              <span className="text-asu-ink">Resultados </span><span className="text-asu-coral">oficiales</span>
            </h1>
            <p className="font-condensed mt-2 text-xs font-bold uppercase tracking-[3px] text-asu">Powered by VeloPro</p>
          </div>
          <img src={veloproLogo.url} alt="VeloPro" className="h-10 w-auto max-w-[180px] object-contain mix-blend-multiply md:h-12" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-asu/20 bg-surface/70 p-4 md:grid-cols-5">
          <Select label="Fecha" value={f.day} onChange={(day) => setF({ ...f, day })} options={opts.day} />
          <Select label="Modalidad" value={f.mod} onChange={(mod) => setF({ ...f, mod })} options={opts.mod} />
          <div className="col-span-2 md:col-span-1">
            <Select label="Prueba" value={f.race} onChange={(race) => setF({ ...f, race })} options={opts.race} />
          </div>
          <Select label="Categoría" value={f.cat} onChange={(cat) => setF({ ...f, cat })} options={opts.cat} />
          <Select label="Género" value={f.gen} onChange={(gen) => setF({ ...f, gen })} options={opts.gen} />
          {hasFilter && (
            <button
              type="button"
              onClick={() => setF({ day: "", mod: "", race: "", cat: "", gen: "" })}
              className="font-condensed col-span-2 min-h-11 rounded-lg border border-asu-coral/60 text-xs font-bold uppercase tracking-widest text-asu-coral md:col-span-5"
            >
              Quitar filtros
            </button>
          )}
        </div>

        <div className="asu-dark mt-6 overflow-hidden rounded-xl bg-asu-deep p-3 md:p-5">
          {loading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Cargando resultados…</p>
          ) : (
            <Asu26Results
              cfg={{ ...cfg, veloproEnabled: false }}
              results={filtered}
              emptyText={results.length && hasFilter ? "No hay clasificaciones publicadas con estos filtros." : undefined}
            />
          )}
        </div>

        {!loading && pending.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-3xl uppercase tracking-wide text-asu-ink md:text-4xl">
              Pendientes de <span className="text-asu-coral">resultados</span>
            </h2>
            <ul className="mt-4 divide-y divide-asu/15 overflow-hidden rounded-xl border border-asu/20 bg-surface">
              {pending.map((i) => (
                <li key={i.id} className="grid grid-cols-[4.5rem_1fr] items-center gap-3 px-4 py-3 sm:grid-cols-[7rem_1fr_auto]">
                  <span className="font-condensed text-xs font-bold uppercase tracking-wider text-asu">
                    {dayLabel(dayInTz(i.scheduled_at, ASU26_TZ))}
                    <span className="block text-asu-ink/70">{timeInTz(i.scheduled_at, ASU26_TZ)} PY</span>
                  </span>
                  <span className="min-w-0 text-sm font-semibold text-asu-ink">
                    {i.event_name}
                    {i.venue_type && <span className="font-condensed ml-2 text-[10px] uppercase tracking-[2px] text-asu-ink/60">{i.venue_type}</span>}
                  </span>
                  <span className="font-condensed col-span-2 text-[10px] font-bold uppercase tracking-[2px] text-asu-ink/60 sm:col-span-1">Próximamente</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
