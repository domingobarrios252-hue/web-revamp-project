import { createFileRoute, Link } from "@tanstack/react-router";
import { Component, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { ArrowDownRight, ArrowUpRight, Info, Play, Eye, Radio, AlertTriangle } from "lucide-react";
import { getStats, getRealtime, type StatsResult, type RealtimeResult, type StatsModule } from "@/lib/stats/stats.functions";

export const Route = createFileRoute("/admin/estadisticas")({
  head: () => ({ meta: [{ title: "Estadísticas — Panel RollerZone" }, { name: "robots", content: "noindex" }] }),
  component: StatsPage,
});

type Preset = "today" | "yesterday" | "7d" | "30d" | "month" | "prevMonth" | "year" | "custom";
const PRESETS: { id: Preset; label: string }[] = [
  { id: "today", label: "Hoy" }, { id: "yesterday", label: "Ayer" }, { id: "7d", label: "Últimos 7 días" },
  { id: "30d", label: "Últimos 30 días" }, { id: "month", label: "Este mes" }, { id: "prevMonth", label: "Mes anterior" },
  { id: "year", label: "Este año" }, { id: "custom", label: "Personalizado" },
];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime());

function rangeFor(p: Preset, cs: string, ce: string) {
  const t = new Date();
  let s: Date, e: Date;
  switch (p) {
    case "today": s = e = t; break;
    case "yesterday": s = e = addDays(t, -1); break;
    case "7d": s = addDays(t, -6); e = t; break;
    case "30d": s = addDays(t, -29); e = t; break;
    case "month": s = new Date(t.getFullYear(), t.getMonth(), 1); e = t; break;
    case "prevMonth": s = new Date(t.getFullYear(), t.getMonth() - 1, 1); e = new Date(t.getFullYear(), t.getMonth(), 0); break;
    case "year": s = new Date(t.getFullYear(), 0, 1); e = t; break;
    default: {
      s = validDate(cs) ? new Date(`${cs}T00:00:00`) : addDays(t, -29);
      e = validDate(ce) ? new Date(`${ce}T00:00:00`) : t;
      if (e < s) e = s;
    }
  }
  const len = Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
  return { start: iso(s), end: iso(e), prevStart: iso(addDays(s, -len)), prevEnd: iso(addDays(s, -1)) };
}

const nfBase = new Intl.NumberFormat("es-ES");
const n0 = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const nf = { format: (v: unknown) => nfBase.format(n0(v)) };
const pct = (a: unknown, b: unknown) => (n0(b) ? (n0(a) / n0(b)) * 100 : 0);
const dur = (v: unknown) => { const s = n0(v); return `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, "0")}s`; };
const arr = <T,>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : []);
const errText = (e: unknown) => (e instanceof Error && e.message ? e.message : "Error desconocido");

function Notice({ children, tone = "warn" }: { children: ReactNode; tone?: "warn" | "error" }) {
  return (
    <p className={`flex items-start gap-2 border p-3 text-sm ${tone === "error" ? "border-destructive/50 text-destructive" : "border-gold/40 text-muted-foreground"}`}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{children}</span>
    </p>
  );
}

// Aísla cada bloque: si su render falla, solo ese bloque muestra un aviso.
class BlockBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e: unknown) { console.error("[stats] bloque con error", e); }
  render() { return this.state.failed ? <Notice tone="error">Este bloque no se ha podido mostrar.</Notice> : this.props.children; }
}

function Delta({ cur, prev }: { cur: number; prev: number | undefined | null }) {
  if (prev == null || !n0(prev)) return <span className="text-[11px] text-muted-foreground">Sin datos del periodo anterior</span>;
  const d = ((n0(cur) - prev) / prev) * 100;
  const up = d >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${up ? "text-gold" : "text-destructive"}`}>
      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {up ? "+" : ""}{d.toFixed(1)} %
    </span>
  );
}

function Card({ title, children, error, className = "" }: { title: string; children: ReactNode; error?: string; className?: string }) {
  return (
    <section className={`min-w-0 border border-border bg-surface p-4 ${className}`}>
      <h2 className="font-condensed mb-3 text-xs font-bold uppercase tracking-widest text-gold">{title}</h2>
      <BlockBoundary>{error ? <Notice>{error}</Notice> : children}</BlockBoundary>
    </section>
  );
}

function Bars({ rows, total, unit }: { rows: { name: string; value: number }[]; total: number; unit: string }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">Sin datos en este periodo.</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => (
        <li key={`${r.name}-${i}`} className="text-sm">
          <div className="flex justify-between gap-2">
            <span className="truncate">{r.name || "—"}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{nf.format(r.value)} {unit} · {pct(r.value, total).toFixed(1)} %</span>
          </div>
          <div className="mt-1 h-1.5 bg-background"><div className="h-full bg-gold" style={{ width: `${Math.min(100, pct(r.value, total))}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function StatsPage() {
  const [preset, setPreset] = useState<Preset>("30d");
  const [cs, setCs] = useState(iso(addDays(new Date(), -29)));
  const [ce, setCe] = useState(iso(new Date()));
  const [grain, setGrain] = useState<"day" | "week" | "month">("day");
  const r = useMemo(() => rangeFor(preset, cs, ce), [preset, cs, ce]);
  const fetchStats = useServerFn(getStats);
  const fetchRt = useServerFn(getRealtime);
  const q = useQuery({ queryKey: ["admin-stats", r, grain], queryFn: () => fetchStats({ data: { ...r, grain } }), retry: 1 });
  const rt = useQuery({ queryKey: ["admin-stats-rt"], queryFn: () => fetchRt(), refetchInterval: 30_000, retry: 1 });

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-widest">ESTADÍSTICAS</h1>
          <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
            Los datos de Google Analytics solo incluyen a los visitantes que aceptan las cookies de Analíticas. El ranking de noticias usa el contador propio de RollerZone, que cuenta a todos los lectores.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={preset} onChange={(e) => setPreset(e.target.value as Preset)} className="min-h-[44px] border border-border bg-background px-3 text-sm">
            {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          {preset === "custom" && (
            <>
              <input type="date" value={cs} max={ce} onChange={(e) => setCs(e.target.value)} className="min-h-[44px] border border-border bg-background px-2 text-sm" />
              <input type="date" value={ce} min={cs} onChange={(e) => setCe(e.target.value)} className="min-h-[44px] border border-border bg-background px-2 text-sm" />
            </>
          )}
        </div>
      </header>

      {q.isLoading && <p className="text-muted-foreground">Cargando datos reales…</p>}
      {q.error && <Notice tone="error">No se han podido cargar las estadísticas: {errText(q.error)}</Notice>}
      {q.data && !q.data.configured && <Notice>Pendiente de conectar Google Analytics.</Notice>}
      {q.data?.error && <Notice tone="error">{q.data.error}</Notice>}

      {q.data && <BlockBoundary><Dashboard d={q.data} grain={grain} setGrain={setGrain} rt={rt.data} rtError={rt.error ? errText(rt.error) : null} /></BlockBoundary>}
    </div>
  );
}

function Dashboard({ d, grain, setGrain, rt, rtError }: {
  d: StatsResult; grain: string; setGrain: (g: "day" | "week" | "month") => void;
  rt: RealtimeResult | undefined; rtError: string | null;
}) {
  const E = (m: StatsModule) => (d.configured ? d.errors?.[m] : undefined);
  const ga = d.configured;
  const t = d.totals, p = d.prevTotals;
  const sections = arr(d.sections), countries = arr(d.countries), sources = arr(d.sources);
  const devices = arr(d.devices), browsers = arr(d.browsers), os = arr(d.os);
  const specials = arr(d.specials), news = arr(d.news), comparisons = arr(d.comparisons), series = arr(d.series);
  const tv = d.tv ?? { pageViews: 0, pageUsers: 0, avgDuration: 0, plays: null, playUsers: null, streams: null, streamsNote: null };
  const sum = <T,>(rows: T[], f: (r: T) => number) => rows.reduce((a, r) => a + n0(f(r)), 0);
  const label = (k: string) => { const s = String(k ?? ""); return s.length === 8 ? `${s.slice(6)}/${s.slice(4, 6)}` : s.length === 6 ? `${s.slice(4)}/${s.slice(0, 4)}` : s; };

  const cards = t ? [
    { label: "Usuarios únicos", v: nf.format(t.users), cur: n0(t.users), prev: p?.users },
    { label: "Sesiones / visitas", v: nf.format(t.sessions), cur: n0(t.sessions), prev: p?.sessions },
    { label: "Páginas vistas", v: nf.format(t.views), cur: n0(t.views), prev: p?.views },
    { label: "Usuarios activos ahora", v: rt?.ok ? nf.format(rt.active) : "—", cur: 0, prev: -1 },
    { label: "Tiempo medio", v: dur(t.avgDuration), cur: n0(t.avgDuration), prev: p?.avgDuration },
    { label: "Páginas por sesión", v: n0(t.viewsPerSession).toFixed(2), cur: n0(t.viewsPerSession), prev: p?.viewsPerSession },
  ] : [];

  return (
    <div className="space-y-5">
      {ga && (
        <BlockBoundary>
          {E("totals") ? <Notice>Resumen: {E("totals")}</Notice> : t && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
              {cards.map((c) => (
                <div key={c.label} className="min-w-0 border border-border bg-surface p-3">
                  <div className="font-condensed text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{c.label}</div>
                  <div className="font-display mt-1 truncate text-2xl tracking-wide md:text-3xl">{c.v}</div>
                  <div className="mt-1">{c.prev === -1 ? <span className="text-[11px] text-muted-foreground">Tiempo real</span> : <Delta cur={c.cur} prev={c.prev} />}</div>
                </div>
              ))}
            </div>
          )}
        </BlockBoundary>
      )}

      {ga && (
        <Card title="Evolución de visitas" error={E("series")}>
          <div className="mb-3 flex gap-1">
            {(["day", "week", "month"] as const).map((g) => (
              <button key={g} onClick={() => setGrain(g)} className={`min-h-[44px] border px-3 text-xs font-bold uppercase tracking-widest ${grain === g ? "border-gold text-gold" : "border-border text-muted-foreground"}`}>
                {g === "day" ? "Día" : g === "week" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
          {series.length === 0 ? <p className="text-sm text-muted-foreground">Sin datos en este periodo.</p> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series.map((s) => ({ key: label(s.key), users: n0(s.users), sessions: n0(s.sessions), views: n0(s.views) }))}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="key" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} width={40} />
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
                  <Legend />
                  <Line type="monotone" dataKey="users" name="Usuarios" stroke="var(--gold)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="sessions" name="Sesiones" stroke="var(--foreground)" dot={false} />
                  <Line type="monotone" dataKey="views" name="Páginas vistas" stroke="var(--muted-foreground)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      <Card title="Noticias más leídas · contador propio" error={d.errors?.news}>
        {news.length === 0 ? <p className="text-sm text-muted-foreground">Sin lecturas registradas en este periodo.</p> : (
          <ol className="divide-y divide-border">
            {news.map((n, i) => (
              <li key={n.id} className="flex items-center gap-3 py-2">
                <span className="font-display w-6 shrink-0 text-lg text-gold">{i + 1}</span>
                {n.image ? <img src={n.image} alt="" loading="lazy" className="h-12 w-16 shrink-0 object-cover" /> : <div className="h-12 w-16 shrink-0 bg-background" />}
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm font-semibold">{n.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {n.hub}{n.publishedAt && !Number.isNaN(new Date(n.publishedAt).getTime()) ? ` · ${new Date(n.publishedAt).toLocaleDateString("es-ES")}` : ""} · {nf.format(n.views)} lecturas · {nf.format(n.unique)} lectores
                    {n.gaAvgSeconds != null ? ` · ${dur(n.gaAvgSeconds)} de lectura (GA4)` : ""}
                  </div>
                </div>
                {n.slug && (
                  <Link to="/noticias/articulo/$slug" params={{ slug: n.slug }} target="_blank" className="font-condensed flex min-h-[44px] shrink-0 items-center border border-border px-3 text-[10px] font-bold uppercase tracking-widest hover:text-gold">
                    Ver noticia
                  </Link>
                )}
              </li>
            ))}
          </ol>
        )}
      </Card>

      {ga && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Secciones más visitadas" error={E("pages")}>
            <Bars rows={sections.map((s) => ({ name: s.name, value: n0(s.views) }))} total={sum(sections, (s) => s.views)} unit="vistas" />
          </Card>
          <Card title="Países" error={E("countries")}>
            {countries.length === 0 ? <p className="text-sm text-muted-foreground">Sin datos en este periodo.</p> : (
              <div className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground"><th className="py-1">País</th><th className="text-right">Usuarios</th><th className="text-right">Sesiones</th><th className="text-right">%</th></tr></thead>
                  <tbody>
                    {countries.slice(0, 12).map((c, i) => (
                      <tr key={`${c.name}-${i}`} className="border-t border-border"><td className="py-1.5 pr-2">{c.name}</td><td className="text-right tabular-nums">{nf.format(c.users)}</td><td className="text-right tabular-nums">{nf.format(c.sessions)}</td><td className="text-right tabular-nums text-muted-foreground">{pct(c.users, sum(countries, (x) => x.users)).toFixed(1)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <Card title="Fuentes de tráfico" error={E("sources")}>
            <Bars rows={sources.map((s) => ({ name: s.name, value: n0(s.sessions) }))} total={sum(sources, (s) => s.sessions)} unit="sesiones" />
          </Card>
          <Card title="Dispositivos" error={E("devices")}>
            <Bars rows={devices.map((s) => ({ name: s.name, value: n0(s.users) }))} total={sum(devices, (s) => s.users)} unit="usuarios" />
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="min-w-0"><div className="mb-1 font-bold uppercase tracking-widest text-muted-foreground">Navegador</div>{browsers.map((b, i) => <div key={`${b.name}-${i}`} className="flex justify-between gap-2"><span className="truncate">{b.name}</span><span>{nf.format(b.users)}</span></div>)}</div>
              <div className="min-w-0"><div className="mb-1 font-bold uppercase tracking-widest text-muted-foreground">Sistema</div>{os.map((b, i) => <div key={`${b.name}-${i}`} className="flex justify-between gap-2"><span className="truncate">{b.name}</span><span>{nf.format(b.users)}</span></div>)}</div>
            </div>
          </Card>
        </div>
      )}

      {ga && (
        <Card title="Rollerzone TV">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-border p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"><Eye className="h-3.5 w-3.5" /> Visitas a Rollerzone TV</div>
              {E("pages") ? <p className="mt-2 text-xs text-muted-foreground">No disponible ahora mismo.</p> : (
                <>
                  <div className="font-display mt-1 text-3xl">{nf.format(tv.pageViews)}</div>
                  <div className="text-xs text-muted-foreground">{nf.format(tv.pageUsers)} usuarios · {dur(tv.avgDuration)} de media por vista</div>
                </>
              )}
            </div>
            <div className="border border-gold/50 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gold"><Play className="h-3.5 w-3.5" /> Reproducciones</div>
              {E("tv") && tv.plays == null ? <p className="mt-2 text-xs text-muted-foreground">No disponible ahora mismo.</p> : (
                <>
                  <div className="font-display mt-1 text-3xl">{nf.format(tv.plays ?? 0)}</div>
                  <div className="text-xs text-muted-foreground">{nf.format(tv.playUsers ?? 0)} usuarios · vídeo cargado realmente tras pulsar Play</div>
                </>
              )}
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Emisiones más reproducidas</div>
            {arr(tv.streams).length ? arr(tv.streams).map((s, i) => <div key={`${s.name}-${i}`} className="flex justify-between gap-2 text-sm"><span className="truncate">{s.name}</span><span>{nf.format(s.plays)}</span></div>)
              : <p className="text-xs text-muted-foreground">{tv.streamsNote ?? "Sin reproducciones en este periodo."}</p>}
          </div>
        </Card>
      )}

      {ga && (
        <Card title="Especiales y campeonatos" error={E("pages")}>
          {specials.length === 0 ? <p className="text-sm text-muted-foreground">Sin visitas a especiales en este periodo.</p> : (
            <div className="grid gap-3 md:grid-cols-2">
              {specials.map((s) => (
                <div key={s.slug} className="min-w-0 border border-border p-3">
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{nf.format(s.views)} páginas vistas · {nf.format(s.users)} usuarios</div>
                  <ul className="mt-2 space-y-0.5 text-xs">
                    {arr(s.top).map((pg) => <li key={pg.path} className="flex justify-between gap-2"><span className="truncate text-muted-foreground">{pg.path}</span><span>{nf.format(pg.views)}</span></li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {ga && (
        <Card title="Ahora en Rollerzone" error={rtError ? "No se han podido cargar los datos en tiempo real." : rt && !rt.ok ? (rt.error ?? "Tiempo real no disponible.") : undefined}>
          {!rt ? <p className="text-sm text-muted-foreground">Cargando tiempo real…</p> : (
            <>
              <div className="mb-3 flex items-center gap-2"><Radio className="h-4 w-4 text-gold" /><span className="font-display text-3xl">{nf.format(rt.active)}</span><span className="text-xs text-muted-foreground">usuarios activos (últimos 30 min)</span></div>
              <div className="grid gap-3 text-xs sm:grid-cols-3">
                {([["Páginas", rt.pages], ["País", rt.countries], ["Dispositivo", rt.devices]] as const).map(([l, rows]) => (
                  <div key={l} className="min-w-0"><div className="mb-1 font-bold uppercase tracking-widest text-muted-foreground">{l}</div>
                    {arr(rows as { name: string; users: number }[]).length === 0 ? <span className="text-muted-foreground">—</span>
                      : arr(rows as { name: string; users: number }[]).map((x, i) => <div key={`${x.name}-${i}`} className="flex justify-between gap-2"><span className="truncate">{x.name}</span><span>{nf.format(x.users)}</span></div>)}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {ga && (
        <Card title="Comparativas" error={E("comparisons")}>
          {comparisons.length === 0 ? <p className="text-sm text-muted-foreground">Sin datos.</p> : (
            <div className="grid gap-3 md:grid-cols-3">
              {comparisons.map((c) => (
                <div key={c.label} className="border border-border p-3 text-sm">
                  <div className="mb-2 text-xs font-bold">{c.label}</div>
                  {c.cur ? (["users", "sessions", "views"] as const).map((k) => (
                    <div key={k} className="flex justify-between gap-2"><span className="text-muted-foreground">{k === "users" ? "Usuarios" : k === "sessions" ? "Sesiones" : "Páginas vistas"}</span>
                      <span className="flex gap-2">{nf.format(c.cur?.[k])} <Delta cur={n0(c.cur?.[k])} prev={c.prev?.[k]} /></span></div>
                  )) : <p className="text-xs text-muted-foreground">Sin datos.</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
