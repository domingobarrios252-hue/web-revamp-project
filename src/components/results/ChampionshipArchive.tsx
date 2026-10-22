import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useUiText } from "@/lib/i18n/uiText";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Search, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loadEventResults, type NormalizedResult } from "@/lib/results/provider";
import { Asu26Results, groupResults } from "@/components/tv/asu26/Asu26Results";
import { ASU26_DEFAULTS } from "@/lib/tv/asu26Streaming";
import { phaseOrder } from "@/lib/results/vensportSource";

/**
 * Archivo histórico de un campeonato con resultados enlazados por ID
 * (result_events.id). Solo lectura: reutiliza provider.ts y las tarjetas/PDF
 * de ASU26. Los filtros eligen qué clasificaciones se ven; el PDF siempre
 * incluye la clasificación completa.
 */
export type ArchiveSearch = { prueba?: string; categoria?: string; sexo?: string; ronda?: string; modalidad?: string; pais?: string; nombre?: string };
type Champ = { id: string; slug: string; name: string; event_date: string | null };

const fold = (s: string | null | undefined) => (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.map((x) => (x ?? "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
const PAGE = 24;

export function modalityOf(race: string | null | undefined): string {
  const r = (race ?? "").toLowerCase();
  if (/^road|ruta/.test(r)) return "Ruta";
  if (/marat/.test(r)) return "Maratón";
  if (/^track|pista/.test(r)) return "Pista";
  return "Pista";
}
const raceOf = (race: string | null) => {
  const p = (race ?? "").split(" · ");
  return (p[p.length - 1] || "").trim();
};
const phaseKey = (r: NormalizedResult) => (r.phase ? r.phase.split(" · ")[0] : "__final");

function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  const { lang: linkLanguage } = useLanguage();
  const ui = useUiText();
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="font-condensed text-[10px] font-bold uppercase tracking-[2px] text-gold">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="min-h-11 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-gold focus:outline-none">
        <option value="">{ui('Todas')}</option>
        {options.map(([v, l]) => (<option key={v} value={v}>{ui(l)}</option>))}
      </select>
    </label>
  );
}

export function ChampionshipArchive({ eventId, slug, name, eventDate, search }: { eventId: string; slug: string; name: string; eventDate: string | null; search: ArchiveSearch }) {
  const { lang: linkLanguage } = useLanguage();
  const ui = useUiText();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [results, setResults] = useState<NormalizedResult[] | null>(null);
  const [champs, setChamps] = useState<Champ[]>([]);
  const [shown, setShown] = useState(PAGE);
  const [nameInput, setNameInput] = useState(search.nombre ?? "");
  const f = {
    modalidad: search.modalidad ?? "", prueba: search.prueba ?? "", categoria: search.categoria ?? "",
    sexo: search.sexo ?? "", ronda: search.ronda ?? "", pais: search.pais ?? "", nombre: search.nombre ?? "",
  };
  const set = (patch: Partial<typeof f>) => {
    setShown(PAGE);
    const next = { ...f, ...patch };
    navigate({ to: lang === "en" ? "/en/results/$evento" : "/resultados/$evento", params: { evento: slug }, search: Object.fromEntries(Object.entries(next).map(([k, v]) => [k, v || undefined])) as ArchiveSearch, replace: true, resetScroll: false });
  };

  useEffect(() => {
    const t = setTimeout(() => { if (nameInput !== f.nombre) set({ nombre: nameInput.trim() }); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameInput]);

  useEffect(() => {
    let off = false;
    (async () => {
      const [{ data: items }, { data: ev }] = await Promise.all([
        supabase.from("schedule_items").select("id, scheduled_at").eq("result_event_id", eventId),
        supabase.from("result_events").select("id, slug, name, event_date").eq("published", true).order("event_date", { ascending: false }),
      ]);
      const times = new Map((items ?? []).filter((i) => i.scheduled_at).map((i) => [i.id as string, i.scheduled_at as string]));
      const r = await loadEventResults(supabase, eventId, null, times, { phases: true }).catch(() => []);
      if (off) return;
      setResults(r.filter((x) => x.state !== "upcoming"));
      setChamps((ev ?? []) as Champ[]);
    })();
    return () => { off = true; };
  }, [eventId]);

  const groups = useMemo(() => groupResults(results ?? []), [results]);
  const opts = useMemo(() => {
    const rs = results ?? [];
    return {
      mod: uniq(rs.map((r) => modalityOf(r.race))),
      race: uniq(rs.map((r) => raceOf(r.race))),
      cat: uniq(rs.map((r) => r.category)),
      gen: uniq(rs.map((r) => r.gender)),
      ph: [["__final", "Clasificación general"] as [string, string], ...[...new Set(rs.map((r) => r.phase?.split(" · ")[0]).filter((x): x is string => !!x))].sort((a, b) => phaseOrder(a) - phaseOrder(b)).map((v) => [v, v] as [string, string])],
      country: uniq(rs.map((r) => (r.country ?? "").toUpperCase().slice(0, 3))),
    };
  }, [results]);

  const q = fold(f.nombre);
  const visible = groups.filter(([, rows]) => {
    const r0 = rows[0];
    if (f.modalidad && modalityOf(r0.race) !== f.modalidad) return false;
    if (f.prueba && raceOf(r0.race) !== f.prueba) return false;
    if (f.categoria && (r0.category ?? "") !== f.categoria) return false;
    if (f.sexo && (r0.gender ?? "") !== f.sexo) return false;
    if (f.ronda && phaseKey(r0) !== f.ronda) return false;
    if (f.pais && !rows.some((r) => (r.country ?? "").toUpperCase().startsWith(f.pais))) return false;
    if (q && !rows.some((r) => fold(r.athlete).includes(q))) return false;
    return true;
  });
  const page = visible.slice(0, shown);
  // Se pasan las filas completas de cada clasificación visible: el PDF nunca se recorta por filtros.
  const pageRows = page.flatMap(([, rows]) => rows);
  const hasFilter = Object.values(f).some(Boolean);
  const year = (d: string | null) => (d ? d.slice(0, 4) : ui("Sin fecha"));
  const years = [...new Set(champs.map((c) => year(c.event_date)))];

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 md:px-8 md:py-10">
      <Link to={linkLanguage === "en" ? "/en/results" : "/resultados"} className="font-condensed inline-flex min-h-11 items-center gap-2 text-xs font-bold uppercase tracking-[2px] text-gold">
        <ArrowLeft className="h-4 w-4" /> {ui('Todos los campeonatos')}
      </Link>
      <header className="mt-2 border-b border-border pb-5">
        <div className="font-condensed inline-flex items-center gap-2 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background">
          <Trophy className="h-3.5 w-3.5" /> {ui('Archivo de resultados')}{eventDate ? ` · ${eventDate.slice(0, 4)}` : ""}
        </div>
        <h1 className="font-display mt-3 text-4xl uppercase leading-none tracking-widest md:text-6xl">{name}</h1>
        <p className="font-condensed mt-2 text-xs font-bold uppercase tracking-[3px] text-muted-foreground">{ui('Resultados ofrecidos por VeloPro')}</p>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-4 lg:grid-cols-5">
        <label className="col-span-2 flex min-w-0 flex-col gap-1 md:col-span-2">
          <span className="font-condensed text-[10px] font-bold uppercase tracking-[2px] text-gold">{ui('Campeonato y año')}</span>
          <select value={slug} onChange={(e) => navigate({ to: lang === "en" ? "/en/results/$evento" : "/resultados/$evento", params: { evento: e.target.value }, search: {} })} aria-label={ui("Campeonato")} className="min-h-11 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-gold focus:outline-none">
            {champs.length === 0 && <option value={slug}>{name}</option>}
            {years.map((y) => (
              <optgroup key={y} label={y}>
                {champs.filter((c) => year(c.event_date) === y).map((c) => (<option key={c.id} value={c.slug}>{c.name}</option>))}
              </optgroup>
            ))}
          </select>
        </label>
        <Sel label={ui("Modalidad")} value={f.modalidad} onChange={(modalidad) => set({ modalidad })} options={opts.mod.map((v) => [v, v])} />
        <Sel label={ui("Prueba")} value={f.prueba} onChange={(prueba) => set({ prueba })} options={opts.race.map((v) => [v, v])} />
        <Sel label={ui("Categoría")} value={f.categoria} onChange={(categoria) => set({ categoria })} options={opts.cat.map((v) => [v, v])} />
        <Sel label={ui("Género")} value={f.sexo} onChange={(sexo) => set({ sexo })} options={opts.gen.map((v) => [v, v])} />
        <Sel label={ui("Fase")} value={f.ronda} onChange={(ronda) => set({ ronda })} options={opts.ph} />
        <Sel label={ui("País")} value={f.pais} onChange={(pais) => set({ pais })} options={opts.country.map((v) => [v, v])} />
        <label className="col-span-2 flex min-w-0 flex-col gap-1">
          <span className="font-condensed text-[10px] font-bold uppercase tracking-[2px] text-gold">{ui('Patinador')}</span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={ui("Buscar por nombre…")} aria-label={ui("Buscar patinador")} className="min-h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:border-gold focus:outline-none" />
          </span>
        </label>
        {hasFilter && (
          <button type="button" onClick={() => { setNameInput(""); set({ modalidad: "", prueba: "", categoria: "", sexo: "", ronda: "", pais: "", nombre: "" }); }} className="font-condensed col-span-2 min-h-11 rounded-lg border border-gold/60 text-xs font-bold uppercase tracking-widest text-gold md:col-span-4 lg:col-span-5">
            {ui('Quitar filtros')}
          </button>
        )}
      </section>

      {results !== null && (
        <p className="font-condensed mt-4 text-xs uppercase tracking-widest text-muted-foreground">
          {lang === "en" ? `${visible.length} of ${groups.length} classifications` : `${visible.length} de ${groups.length} clasificaciones`}
        </p>
      )}

      <div className="asu-dark mt-3 overflow-hidden rounded-xl bg-asu-deep p-3 md:p-5">
        {results === null ? (
          <p className="p-6 text-center text-sm text-muted-foreground">{ui('Cargando resultados…')}</p>
        ) : (
          <Asu26Results
            cfg={{ ...ASU26_DEFAULTS, veloproEnabled: false }}
            results={pageRows}
            pdf
            emptyText={ui(groups.length ? "No hay clasificaciones con estos filtros." : "Todavía no hay clasificaciones publicadas para este campeonato.")}
          />
        )}
      </div>

      {visible.length > shown && (
        <div className="mt-6 text-center">
          <button type="button" onClick={() => setShown((s) => s + PAGE)} className="font-condensed min-h-11 rounded-full border border-gold/60 px-6 text-xs font-bold uppercase tracking-[2px] text-gold hover:bg-gold/10">
            {lang === "en" ? "View more classifications" : "Ver más clasificaciones"} ({visible.length - shown})
          </button>
        </div>
      )}
    </div>
  );
}
