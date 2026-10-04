import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, ShieldCheck, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loadEventResults, type NormalizedResult } from "@/lib/results/provider";
import { dayInTz, timeInTz, type ScheduleItem } from "@/lib/specials/liveEvent";
import {
  ASU26_DEFAULTS,
  ASU26_RESULT_EVENT_ID,
  ASU26_TZ,
  loadAsu26Config,
  specialLink,
  type Asu26StreamingConfig,
} from "@/lib/tv/asu26Streaming";
import { Asu26Player } from "@/components/tv/asu26/Asu26Player";
import { Asu26Results } from "@/components/tv/asu26/Asu26Results";
import ogAsset from "@/assets/og-asu26-rollerzone-tv.jpg.asset.json";
import rzLogo from "@/assets/rollerzone-logo.png";

const PAGE_URL = "https://rollerzone.es/rollerzone-tv/world-skate-games-asu26";
const OG = `https://rollerzone.es${ogAsset.url}`;
const TITLE = "World Skate Games ASU26 2026 en directo | Patinaje de Velocidad | Rollerzone.TV";
const DESC =
  "Sigue en Rollerzone.TV el streaming autorizado de las pruebas de patinaje de velocidad de los World Skate Games ASU26 2026, con horarios, resultados oficiales y toda la información.";
const OG_TITLE = "World Skate Games ASU26 · Patinaje de Velocidad EN DIRECTO";
const OG_DESC = "Streaming, horarios y resultados oficiales del patinaje de velocidad en ASU26 2026.";

export const Route = createFileRoute("/rollerzone-tv/world-skate-games-asu26")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: OG_TITLE },
      { property: "og:description", content: OG_DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: OG },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: OG_TITLE },
      { name: "twitter:description", content: OG_DESC },
      { name: "twitter:image", content: OG },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: Asu26Hub,
});

type Item = ScheduleItem;

const NAV = [
  { id: "directo", label: "Directo" },
  { id: "horarios", label: "Horarios" },
  { id: "resultados", label: "Resultados" },
  { id: "calendario", label: "Calendario" },
  { id: "especial", label: "España", link: "espana" as const },
  { id: "especial", label: "Medallero", link: "medallero" as const },
  { id: "especial", label: "Noticias", link: "noticias" as const },
];

function raceState(it: Item, results: NormalizedResult[]) {
  if (it.status === "en_curso") return { label: "En curso", hot: true };
  if (it.status === "aplazada") return { label: "Aplazada", hot: false };
  if (it.status === "cancelada") return { label: "Cancelada", hot: false };
  if (it.status === "finalizada") {
    const rs = results.filter((r) => r.scheduleItemId === it.id);
    if (rs.some((r) => r.state === "official")) return { label: "Oficial", hot: false };
    if (rs.some((r) => r.state === "provisional")) return { label: "Provisional", hot: false };
    return { label: "Finalizada", hot: false };
  }
  return { label: "Próximamente", hot: false };
}

function dayLabel(day: string) {
  return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${day}T12:00:00Z`),
  );
}

function Wordmark({ url, text, className = "" }: { url: string; text: string; className?: string }) {
  return url ? (
    <img src={url} alt={text} loading="lazy" decoding="async" className={`h-10 w-auto max-w-[160px] object-contain ${className}`} />
  ) : (
    <span className={`font-display text-2xl uppercase tracking-wider text-foreground ${className}`}>{text}</span>
  );
}

function Asu26Hub() {
  const [cfg, setCfg] = useState<Asu26StreamingConfig>(ASU26_DEFAULTS);
  const [items, setItems] = useState<Item[] | null>(null);
  const [results, setResults] = useState<NormalizedResult[]>([]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    let off = false;
    (async () => {
      const [c, s] = await Promise.all([
        loadAsu26Config(),
        supabase
          .from("schedule_items")
          .select("id,event_name,event_name_en,category,gender,phase,discipline,venue_type,location,scheduled_at,status,featured,sort_order")
          .eq("result_event_id", ASU26_RESULT_EVENT_ID)
          .eq("published", true)
          .order("scheduled_at")
          .order("sort_order"),
      ]);
      if (off) return;
      setCfg(c);
      const list = ((s.data ?? []) as Item[]);
      setItems(list);
      const times = new Map(list.map((i) => [i.id, i.scheduled_at]));
      const r = await loadEventResults(supabase, ASU26_RESULT_EVENT_ID, null, times).catch(() => []);
      if (!off) setResults(r);
    })();
    return () => {
      off = true;
      clearInterval(t);
    };
  }, []);

  const upcoming = useMemo(
    () => (items ?? []).filter((i) => i.status === "en_curso" || (i.status === "programada" && new Date(i.scheduled_at) >= new Date(now.getTime() - 30 * 60_000))).slice(0, 6),
    [items, now],
  );
  const today = dayInTz(now, ASU26_TZ);
  const todays = (items ?? []).filter((i) => dayInTz(i.scheduled_at, ASU26_TZ) === today);
  const next = upcoming.find((i) => i.status === "programada");
  const live = cfg.streamStatus === "live";

  return (
    <div className="w-full min-w-0 overflow-x-clip bg-background">
      {/* HERO */}
      <section className="asu-hero-bg relative isolate overflow-hidden border-b border-asu/40">
        <div className="asu-curve pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto max-w-[1500px] px-4 pb-8 pt-8 md:px-8 md:pb-12 md:pt-12">
          <nav className="font-condensed mb-5 text-[11px] uppercase tracking-[2px] text-muted-foreground">
            <Link to="/tv" className="hover:text-gold">Rollerzone.TV</Link> <span aria-hidden="true">/</span> ASU26
          </nav>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="asu-reveal min-w-0">
              {cfg.logoAsu26Url && (
                <img src={cfg.logoAsu26Url} alt="World Skate Games ASU26" className="mb-4 h-14 w-auto max-w-[220px] object-contain md:h-20" fetchPriority="high" />
              )}
              <p className="font-condensed text-xs font-bold uppercase tracking-[4px] text-asu-light">World Skate Games</p>
              <h1 className="font-display mt-1 break-words text-5xl uppercase leading-[0.95] tracking-wide text-foreground sm:text-6xl md:text-7xl">
                ASU26 <span className="text-gold">2026</span>
              </h1>
              <p className="font-display mt-1 text-2xl uppercase tracking-wider text-foreground/90 md:text-3xl">Patinaje de velocidad</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-foreground/80">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-gold" /> 10 — 18 octubre 2026</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gold" /> Asunción · Paraguay</span>
              </div>
            </div>
            <div className="asu-reveal flex flex-col items-start gap-2 md:items-end">
              <span className="font-condensed text-xs font-bold uppercase tracking-[3px] text-foreground">Streaming oficial en Rollerzone.TV</span>
              <span className="font-condensed inline-flex items-center gap-1.5 rounded-full border border-gold/60 bg-background/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[2px] text-gold">
                <ShieldCheck className="h-3.5 w-3.5" /> Señal autorizada por World Skate
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* NAV sticky */}
      <nav aria-label="Secciones ASU26" className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-2 py-1.5 [scrollbar-width:none] md:px-6">
          {NAV.map((n) => (
            <a
              key={n.label}
              href={`#${n.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(n.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="font-condensed inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-xs font-bold uppercase tracking-[2px] text-muted-foreground transition-colors hover:bg-surface hover:text-gold"
            >
              {n.label}
            </a>
          ))}
        </div>
      </nav>

      {/* STREAMING */}
      <section id="directo" className="scroll-mt-16 py-8 md:py-12">
        <div className="mx-auto grid max-w-[1500px] gap-6 px-4 md:px-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="font-display text-3xl uppercase tracking-wider text-foreground md:text-4xl">{cfg.title}</h2>
              <StatusBadge status={cfg.streamStatus} />
            </div>
            <p className="font-condensed -mt-2 mb-4 text-xs uppercase tracking-[3px] text-muted-foreground">{cfg.subtitle}</p>
            {!live && (
              <div className="mb-4 rounded-xl border border-border bg-surface/60 p-4">
                <p className="font-condensed text-[11px] font-bold uppercase tracking-[3px] text-gold">
                  {cfg.streamStatus === "finished" ? "Retransmisión finalizada" : "Próxima retransmisión"}
                </p>
                {cfg.expectedStart ? (
                  <p className="font-display mt-1 text-xl uppercase text-foreground">
                    {dayLabel(dayInTz(cfg.expectedStart, ASU26_TZ))} · {timeInTz(cfg.expectedStart, ASU26_TZ)} h (Asunción)
                  </p>
                ) : next ? (
                  <p className="font-display mt-1 text-xl uppercase text-foreground">
                    {dayLabel(dayInTz(next.scheduled_at, ASU26_TZ))} · {timeInTz(next.scheduled_at, ASU26_TZ)} h · {next.event_name}
                  </p>
                ) : null}
                {cfg.preStreamMessage && <p className="mt-1 text-sm text-muted-foreground">{cfg.preStreamMessage}</p>}
              </div>
            )}
            <Asu26Player cfg={cfg} />
            <div className="mt-4 flex flex-col gap-1 border-l-2 border-gold pl-4">
              <p className="font-display text-lg uppercase tracking-wide text-foreground">World Skate Games ASU26 2026</p>
              <p className="text-sm text-muted-foreground">Patinaje de Velocidad · Asunción · Paraguay</p>
              <p className="text-xs text-muted-foreground">
                Streaming autorizado por World Skate para Rollerzone.TV. Resultados oficiales proporcionados por VeloPro.
              </p>
            </div>
          </div>

          <aside id="horarios" className="scroll-mt-16 min-w-0">
            <h2 className="font-display mb-3 text-2xl uppercase tracking-wider text-foreground">Próximas pruebas</h2>
            {items === null ? (
              <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-surface" />)}</div>
            ) : upcoming.length === 0 ? (
              <p className="rounded-xl border border-border bg-surface/60 p-4 text-sm text-muted-foreground">No hay próximas pruebas programadas.</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((it) => {
                  const st = raceState(it, results);
                  return (
                    <li
                      key={it.id}
                      className={`asu-reveal grid grid-cols-[4.25rem_1fr] gap-3 rounded-xl border p-3 transition-colors duration-200 hover:border-gold/60 ${
                        st.hot ? "border-tv-red/70 bg-tv-red/10" : "border-border bg-surface"
                      }`}
                    >
                      <div className="text-center">
                        <p className="font-display text-2xl leading-none text-foreground">{timeInTz(it.scheduled_at, ASU26_TZ)}</p>
                        <p className="font-condensed mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                          {dayLabel(dayInTz(it.scheduled_at, ASU26_TZ)).split(",")[1]?.trim() ?? ""}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-condensed text-[10px] font-bold uppercase tracking-[2px] text-asu-light">
                          {[it.category, it.gender].filter(Boolean).join(" ")}
                        </p>
                        <p className="font-display truncate text-base uppercase tracking-wide text-foreground">{it.event_name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {it.venue_type && <span className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">{it.venue_type}</span>}
                          <span className={`font-condensed rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px] ${st.hot ? "bg-tv-red text-foreground" : "border border-border text-muted-foreground"}`}>
                            {st.label}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>
      </section>

      {/* INSTITUCIONAL */}
      <section className="border-y border-border bg-surface/40 py-8">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <p className="font-condensed mb-5 text-center text-[11px] uppercase tracking-[3px] text-muted-foreground">
            Cobertura oficial autorizada para Rollerzone.TV
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { logo: <Wordmark url={cfg.logoWorldSkateUrl} text="World Skate" />, a: "Organización internacional", b: "Señal oficial autorizada" },
              { logo: <Wordmark url={cfg.logoVeloproUrl} text="VeloPro" />, a: "Proveedor de resultados oficiales", b: "" },
              { logo: <img src={rzLogo} alt="Rollerzone.TV" className="h-10 w-auto max-w-[160px] object-contain" loading="lazy" />, a: "Rollerzone.TV", b: "Cobertura digital de patinaje de velocidad" },
            ].map((x, i) => (
              <div key={i} className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background/60 p-5 text-center transition-colors duration-200 hover:border-asu-light/50">
                {x.logo}
                <p className="font-condensed text-[11px] font-bold uppercase tracking-[2px] text-foreground/90">{x.a}</p>
                {x.b && <p className="text-xs text-muted-foreground">{x.b}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTADOS */}
      <section id="resultados" className="scroll-mt-16 py-10 md:py-14">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl uppercase tracking-wider text-foreground md:text-4xl">Resultados oficiales</h2>
              <p className="font-condensed mt-1 text-xs uppercase tracking-[3px] text-muted-foreground">Powered by VeloPro</p>
            </div>
            {cfg.logoPoweredByVeloproUrl ? (
              <img src={cfg.logoPoweredByVeloproUrl} alt="Powered by VeloPro" className="h-9 w-auto max-w-[180px] object-contain" loading="lazy" />
            ) : null}
          </div>
          <Asu26Results cfg={cfg} results={results} />
        </div>
      </section>

      {/* HOY */}
      <section id="calendario" className="scroll-mt-16 border-y border-asu/30 bg-asu-deep/60 py-10">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <h2 className="font-display text-3xl uppercase tracking-wider text-foreground">Hoy en ASU26</h2>
          <p className="font-condensed mt-1 text-xs uppercase tracking-[3px] text-asu-light first-letter:uppercase">{dayLabel(today)}</p>
          {todays.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No hay pruebas de velocidad programadas hoy.</p>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat k="Modalidad" v={[...new Set(todays.map((t) => t.venue_type).filter(Boolean))].join(" · ") || "—"} />
              <Stat k="Carreras" v={String(todays.length)} />
              <Stat k="Primera prueba" v={`${timeInTz(todays[0].scheduled_at, ASU26_TZ)} · ${todays[0].event_name}`} />
              <Stat k="Última prueba" v={`${timeInTz(todays[todays.length - 1].scheduled_at, ASU26_TZ)} · ${todays[todays.length - 1].event_name}`} />
            </div>
          )}
          <a
            href={specialLink(cfg.links.calendario)}
            className="font-condensed mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-gold px-5 text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-gold-light"
          >
            Ver calendario completo <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* ESPECIAL */}
      <section id="especial" className="scroll-mt-16 py-10 md:py-14">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <h2 className="font-display mb-5 text-3xl uppercase tracking-wider text-foreground">Descubre el especial ASU26</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {(
              [
                ["calendario", "Calendario"],
                ["resultados", "Resultados"],
                ["espana", "España"],
                ["medallero", "Medallero"],
                ["noticias", "Noticias"],
                ["galeria", "Galería"],
              ] as const
            ).map(([k, label]) => (
              <a
                key={k}
                href={specialLink(cfg.links[k])}
                className="group flex min-h-24 flex-col justify-between rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold"
              >
                <span className="font-display text-xl uppercase tracking-wide text-foreground group-hover:text-gold">{label}</span>
                <ArrowRight className="h-4 w-4 text-asu-light transition-transform group-hover:translate-x-1" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-background/60 p-3">
      <p className="font-condensed text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">{k}</p>
      <p className="mt-1 break-words text-sm font-semibold text-foreground">{v}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Asu26StreamingConfig["streamStatus"] }) {
  if (status === "live")
    return (
      <span className="asu-live-glow font-condensed inline-flex items-center gap-2 rounded-full bg-tv-red px-3 py-1 text-[11px] font-bold uppercase tracking-[2px] text-foreground">
        <span className="live-dot h-2 w-2 rounded-full bg-foreground" /> En directo
      </span>
    );
  return (
    <span className="font-condensed inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[11px] font-bold uppercase tracking-[2px] text-muted-foreground">
      <Clock className="h-3.5 w-3.5" /> {status === "finished" ? "Finalizado" : "Próximamente"}
    </span>
  );
}
