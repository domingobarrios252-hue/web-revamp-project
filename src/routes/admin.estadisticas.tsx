import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { ArrowDownRight, ArrowUpRight, Info, Play, Eye, Radio } from "lucide-react";
import { getStats, getRealtime, type StatsResult } from "@/lib/stats/stats.functions";

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
    default: s = new Date(cs); e = new Date(ce);
  }
  const len = Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
  return { start: iso(s), end: iso(e), prevStart: iso(addDays(s, -len)), prevEnd: iso(addDays(s, -1)) };
}

const nf = new Intl.NumberFormat("es-ES");
const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);
const dur = (s: number) => `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, "0")}s`;

function Delta({ cur, prev }: { cur: number; prev: number | undefined }) {
  if (prev === undefined || prev === 0) return <span className="text-[11px] text-muted-foreground">Sin datos del periodo anterior</span>;
  const d = ((cur - prev) / prev) * 100;
  const up = d >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${up ? "text-gold" : "text-destructive"}`}>
      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {up ? "+" : ""}{d.toFixed(1)} %
    </span>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 border border-border bg-surface p-4 ${className}`}>
      <h2 className="font-condensed mb-3 text-xs font-bold uppercase tracking-widest text-gold">{title}</h2>
      {children}
    </section>
  );
}

function Bars({ rows, total, unit }: { rows: { name: string; value: number }[]; total: number; unit: string }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">Sin datos en este periodo.</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.name} className="text-sm">
          <div className="flex justify-between gap-2">
            <span className="truncate">{r.name}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{nf.format(r.value)} {unit} · {pct(r.value, total).toFixed(1)} %</span>
          </div>
          <div className="mt-1 h-1.5 bg-background"><div className="h-full bg-gold" style={{ width: `${pct(r.value, total)}%` }} /></div>
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
  const q = useQuery({ queryKey: ["admin-stats", r, grain], queryFn: () => fetchStats({ data: { ...r, grain } }) });
  const rt = useQuery({ queryKey: ["admin-stats-rt"], queryFn: () => fetchRt(), refetchInterval: 30_000 });
  const d = q.data;

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
      {q.error && <p className="text-destructive">No se han podido cargar las estadísticas.</p>}
      {d && !d.configured && <p className="border border-gold/40 p-3 text-sm">Pendiente de conectar Google Analytics.</p>}
      {d?.error && <p className="border border-destructive/50 p-3 text-sm text-destructive">{d.error}</p>}

      {d && <Dashboard d={d} grain={grain} setGrain={setGrain} rt={rt.data} />}
    </div>
  );
}

function Dashboard({ d, grain, setGrain, rt }: {
  d: StatsResult; grain: string; setGrain: (g: "day" | "week" | "month") => void;
  rt: Awaited<ReturnType<typeof getRealtime>> | undefined;
}) {
  const t = d.totals, p = d.prevTotals;
  const cards = t ? [
    { label: "Usuarios únicos", v: nf.format(t.users), cur: t.users, prev: p?.users },
    { label: "Sesiones / visitas", v: nf.format(t.sessions), cur: t.sessions, prev: p?.sessions },
    { label: "Páginas vistas", v: nf.format(t.views), cur: t.views, prev: p?.views },
    { label: "Usuarios activos ahora", v: rt?.ok ? nf.format(rt.active) : "—", cur: 0, prev: -1 },
    { label: "Tiempo medio", v: dur(t.avgDuration), cur: t.avgDuration, prev: p?.avgDuration },
    { label: "Páginas por sesión", v: t.viewsPerSession.toFixed(2), cur: t.viewsPerSession, prev: p?.viewsPerSession },
  ] : [];
  const secTotal = d.sections.reduce((a, s) => a + s.views, 0);
  const ctyTotal = d.countries.reduce((a, s) => a + s.users, 0);
  const srcTotal = d.sources.reduce((a, s) => a + s.sessions, 0);
  const devTotal = d.devices.reduce((a, s) => a + s.users, 0);
  const label = (k: string) => (k.length === 8 ? `${k.slice(6)}/${k.slice(4, 6)}` : k.length === 6 ? `${k.slice(4)}/${k.slice(0, 4)}` : k);

  return (
    <>
      {t && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map((c) => (
            <div key={c.label} className="border border-border bg-surface p-3">
              <div className="font-condensed text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{c.label}</div>
              <div className="font-display mt-1 text-2xl tracking-wide md:text-3xl">{c.v}</div>
              <div className="mt-1">{c.prev === -1 ? <span className="text-[11px] text-muted-foreground">Tiempo real</span> : <Delta cur={c.cur} prev={c.prev} />}</div>
            </div>
          ))}
        </div>
      )}

      {t && (
        <Card title="Evolución de visitas">
          <div className="mb-3 flex gap-1">
            {(["day", "week", "month"] as const).map((g) => (
              <button key={g} onClick={() => setGrain(g)} className={`min-h-[44px] border px-3 text-xs font-bold uppercase tracking-widest ${grain === g ? "border-gold text-gold" : "border-border text-muted-foreground"}`}>
                {g === "day" ? "Día" : g === "week" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={d.series.map((s) => ({ ...s, key: label(s.key) }))}>
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
        </Card>
      )}

      <Card title="Noticias más leídas · contador propio">
        {d.news.length === 0 ? <p className="text-sm text-muted-foreground">Sin lecturas registradas en este periodo.</p> : (
          <ol className="divide-y divide-border">
            {d.news.map((n, i) => (
              <li key={n.id} className="flex items-center gap-3 py-2">
                <span className="font-display w-6 shrink-0 text-lg text-gold">{i + 1}</span>
                {n.image ? <img src={n.image} alt="" loading="lazy" className="h-12 w-16 shrink-0 object-cover" /> : <div className="h-12 w-16 shrink-0 bg-background" />}
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm font-semibold">{n.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {n.hub}{n.publishedAt ? ` · ${new Date(n.publishedAt).toLocaleDateString("es-ES")}` : ""} · {nf.format(n.views)} lecturas · {nf.format(n.unique)} lectores
                    {n.gaAvgSeconds != null ? ` · ${dur(n.gaAvgSeconds)} de lectura (GA4)` : ""}
                  </div>
                </div>
                <Link to="/noticias/articulo/$slug" params={{ slug: n.slug }} target="_blank" className="font-condensed flex min-h-[44px] shrink-0 items-center border border-border px-3 text-[10px] font-bold uppercase tracking-widest hover:text-gold">
                  Ver noticia
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {t && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Secciones más visitadas"><Bars rows={d.sections.map((s) => ({ name: s.name, value: s.views }))} total={secTotal} unit="vistas" /></Card>
          <Card title="Países">
            <div className="overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground"><th className="py-1">País</th><th className="text-right">Usuarios</th><th className="text-right">Sesiones</th><th className="text-right">%</th></tr></thead>
                <tbody>
                  {d.countries.slice(0, 12).map((c) => (
                    <tr key={c.name} className="border-t border-border"><td className="py-1.5 pr-2">{c.name}</td><td className="text-right tabular-nums">{nf.format(c.users)}</td><td className="text-right tabular-nums">{nf.format(c.sessions)}</td><td className="text-right tabular-nums text-muted-foreground">{pct(c.users, ctyTotal).toFixed(1)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Fuentes de tráfico"><Bars rows={d.sources.map((s) => ({ name: s.name, value: s.sessions }))} total={srcTotal} unit="sesiones" /></Card>
          <Card title="Dispositivos">
            <Bars rows={d.devices.map((s) => ({ name: s.name, value: s.users }))} total={devTotal} unit="usuarios" />
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div><div className="mb-1 font-bold uppercase tracking-widest text-muted-foreground">Navegador</div>{d.browsers.map((b) => <div key={b.name} className="flex justify-between"><span className="truncate">{b.name}</span><span>{nf.format(b.users)}</span></div>)}</div>
              <div><div className="mb-1 font-bold uppercase tracking-widest text-muted-foreground">Sistema</div>{d.os.map((b) => <div key={b.name} className="flex justify-between"><span className="truncate">{b.name}</span><span>{nf.format(b.users)}</span></div>)}</div>
            </div>
          </Card>
        </div>
      )}

      {t && (
        <Card title="Rollerzone TV">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-border p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"><Eye className="h-3.5 w-3.5" /> Visitas a Rollerzone TV</div>
              <div className="font-display mt-1 text-3xl">{nf.format(d.tv.pageViews)}</div>
              <div className="text-xs text-muted-foreground">{nf.format(d.tv.pageUsers)} usuarios · {dur(d.tv.avgDuration)} de media por vista</div>
            </div>
            <div className="border border-gold/50 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gold"><Play className="h-3.5 w-3.5" /> Reproducciones</div>
              <div className="font-display mt-1 text-3xl">{nf.format(d.tv.plays ?? 0)}</div>
              <div className="text-xs text-muted-foreground">{nf.format(d.tv.playUsers ?? 0)} usuarios · vídeo cargado realmente tras pulsar Play</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Emisiones más reproducidas</div>
            {d.tv.streams?.length ? d.tv.streams.map((s) => <div key={s.name} className="flex justify-between text-sm"><span className="truncate">{s.name}</span><span>{nf.format(s.plays)}</span></div>)
              : <p className="text-xs text-muted-foreground">{d.tv.streamsNote ?? "Sin reproducciones en este periodo."}</p>}
          </div>
        </Card>
      )}

      {t && (
        <Card title="Especiales y campeonatos">
          {d.specials.length === 0 ? <p className="text-sm text-muted-foreground">Sin visitas a especiales en este periodo.</p> : (
            <div className="grid gap-3 md:grid-cols-2">
              {d.specials.map((s) => (
                <div key={s.slug} className="border border-border p-3">
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{nf.format(s.views)} páginas vistas · {nf.format(s.users)} usuarios</div>
                  <ul className="mt-2 space-y-0.5 text-xs">
                    {s.top.map((p) => <li key={p.path} className="flex justify-between gap-2"><span className="truncate text-muted-foreground">{p.path}</span><span>{nf.format(p.views)}</span></li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {rt?.ok && (
        <Card title="Ahora en Rollerzone">
          <div className="mb-3 flex items-center gap-2"><Radio className="h-4 w-4 text-gold" /><span className="font-display text-3xl">{nf.format(rt.active)}</span><span className="text-xs text-muted-foreground">usuarios activos (últimos 30 min)</span></div>
          <div className="grid gap-3 text-xs sm:grid-cols-3">
            {[["Páginas", rt.pages], ["País", rt.countries], ["Dispositivo", rt.devices]].map(([l, rows]) => (
              <div key={l as string}><div className="mb-1 font-bold uppercase tracking-widest text-muted-foreground">{l as string}</div>
                {(rows as { name: string; users: number }[]).map((r) => <div key={r.name} className="flex justify-between gap-2"><span className="truncate">{r.name}</span><span>{r.users}</span></div>)}
              </div>
            ))}
          </div>
        </Card>
      )}

      {d.comparisons.length > 0 && (
        <Card title="Comparativas">
          <div className="grid gap-3 md:grid-cols-3">
            {d.comparisons.map((c) => (
              <div key={c.label} className="border border-border p-3 text-sm">
                <div className="mb-2 text-xs font-bold">{c.label}</div>
                {c.cur && (["users", "sessions", "views"] as const).map((k) => (
                  <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k === "users" ? "Usuarios" : k === "sessions" ? "Sesiones" : "Páginas vistas"}</span>
                    <span className="flex gap-2">{nf.format(c.cur![k])} <Delta cur={c.cur![k]} prev={c.prev?.[k]} /></span></div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
