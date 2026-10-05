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
import { DualTime, TzLegend } from "@/components/tv/asu26/Asu26Time";
import { Asu26Results } from "@/components/tv/asu26/Asu26Results";
import { Asu26LiveUpdates, type Asu26TimelineEntry } from "@/components/tv/asu26/Asu26LiveUpdates";
import { Asu26LogosBlock } from "@/components/tv/asu26/Asu26LogosBlock";
import ogAsset from "@/assets/og-asu26-rollerzone-tv.jpg.asset.json";

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
      { name: "apple-mobile-web-app-title", content: "ASU26 TV" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: Asu26HubWithShortcut,
});

// Acceso directo propio («ASU26 TV») con el icono general de Rollerzone.
function Asu26HubWithShortcut() {
  useEffect(() => {
    const link = document.head.querySelector('link[rel="manifest"]');
    if (!link) return;
    const prev = link.getAttribute("href");
    link.setAttribute("href", "/manifest-asu26-tv.webmanifest");
    return () => {
      if (prev) link.setAttribute("href", prev);
    };
  }, []);
  return <Asu26Hub />;
}

type Item = ScheduleItem;

const NAV = [
  { id: "directo", label: "Directo" },
  { id: "calendario", label: "Calendario" },
  { id: "resultados", label: "Resultados" },
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

function Asu26Hub() {
  const [cfg, setCfg] = useState<Asu26StreamingConfig>(ASU26_DEFAULTS);
  const [items, setItems] = useState<Item[] | null>(null);
  const [results, setResults] = useState<NormalizedResult[]>([]);
  const [liveUpdates, setLiveUpdates] = useState<Asu26TimelineEntry[]>([]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    let off = false;
    (async () => {
      const [c, s, updates] = await Promise.all([
        loadAsu26Config(),
        supabase
          .from("schedule_items")
          .select("id,event_name,event_name_en,category,gender,phase,discipline,venue_type,location,scheduled_at,status,featured,sort_order")
          .eq("result_event_id", ASU26_RESULT_EVENT_ID)
          .eq("published", true)
          .order("scheduled_at")
          .order("sort_order"),
        supabase
          .from("live_timeline")
          .select("id,message,occurred_at")
          .eq("result_event_id", ASU26_RESULT_EVENT_ID)
          .eq("published", true)
          .order("occurred_at", { ascending: false }),
      ]);
      if (off) return;
      setCfg(c);
      const list = ((s.data ?? []) as Item[]);
      setItems(list);
      setLiveUpdates((updates.data ?? []) as Asu26TimelineEntry[]);
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
      <section className="asu-hero-bg relative isolate overflow-hidden">
        <img src={cfg.heroImageUrl || ogAsset.url} alt="" aria-hidden="true" fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/70 to-asu-deep/40" aria-hidden="true" />
        <div className="asu-curve pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <div className="asu-speed pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/2 md:block" aria-hidden="true" />
        <div className="mx-auto max-w-[1500px] px-4 pb-8 pt-8 md:px-8 md:pb-14 md:pt-16">
          <div className="asu-reveal min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              {live ? (
                <span className="asu-live-glow font-condensed inline-flex items-center gap-2 rounded-full bg-tv-red px-3 py-1 text-[11px] font-bold uppercase tracking-[2px] text-foreground">
                  <span className="live-dot h-2 w-2 rounded-full bg-foreground" /> En directo ahora
                </span>
              ) : (
                <span className="font-condensed inline-flex items-center gap-2 rounded-full bg-asu-coral px-3 py-1 text-[11px] font-bold uppercase tracking-[2px] text-background">
                  <Clock className="h-3.5 w-3.5" /> {cfg.streamStatus === "finished" ? "Retransmisión finalizada" : "Próxima retransmisión"}
                  {cfg.streamStatus !== "finished" && (cfg.expectedStart || next) ? ` · ${timeInTz(cfg.expectedStart || next!.scheduled_at, ASU26_TZ)} PY` : ""}
                </span>
              )}
              <span className="font-condensed inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[2.5px] text-asu-light">
                <ShieldCheck className="h-3.5 w-3.5" /> Señal autorizada por World Skate
              </span>
            </div>
            {cfg.logoAsu26Url && (
              <img src={cfg.logoAsu26Url} alt="World Skate Games ASU26" className="mt-6 h-14 w-auto max-w-[220px] object-contain md:h-20" />
            )}
            <h1 className="mt-5 break-words uppercase">
              <span className="font-condensed block text-sm font-bold tracking-[5px] text-asu-cream md:text-base">World Skate Games</span>
              <span className="font-display mt-1 block text-6xl leading-[0.9] tracking-wide text-foreground sm:text-8xl md:text-[9rem]">ASU<span className="text-asu-coral">26</span></span>
            </h1>
            <div className="asu-stripe mt-4 h-[3px] w-24 md:w-40" aria-hidden="true" />
            <p className="font-display mt-4 text-2xl uppercase tracking-[0.12em] text-foreground/90 md:text-3xl">Patinaje de velocidad</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs uppercase tracking-[2px] text-asu-cream/80">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-asu-light" /> 10 — 18 octubre 2026</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-asu-light" /> Asunción · Paraguay</span>
              <span className="font-condensed font-bold text-gold">Rollerzone.TV</span>
            </div>
          </div>
        </div>
      </section>

      {/* NAV sticky */}
      <nav aria-label="Secciones ASU26" className="sticky top-0 z-30 border-y border-asu/30 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-2 py-1.5 [scrollbar-width:none] md:px-6">
          {NAV.map((n) => (
            <a
              key={n.label}
              href={`#${n.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(n.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="font-condensed inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-xs font-bold uppercase tracking-[2px] text-muted-foreground transition-colors hover:bg-surface hover:text-asu-cream"
            >
              {n.label}
            </a>
          ))}
        </div>
      </nav>

      {/* STREAMING */}
      <section id="directo" className="asu-track-soft scroll-mt-16 py-10 md:py-16">
        <div className="mx-auto grid max-w-[1560px] gap-6 px-4 md:px-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="font-display text-4xl uppercase tracking-wide text-foreground md:text-6xl">{cfg.title}</h2>
              <StatusBadge status={cfg.streamStatus} />
            </div>
            <p className="font-condensed -mt-2 mb-4 text-xs uppercase tracking-[3px] text-muted-foreground">{cfg.subtitle}</p>
            {!live && (
              <div className="order-1 mt-4 rounded-2xl bg-asu-deep/50 p-4 md:order-none md:mb-6 md:mt-0 md:p-6">
                <p className="font-condensed text-[11px] font-bold uppercase tracking-[3px] text-asu-light">
                  {cfg.streamStatus === "finished" ? "Retransmisión finalizada" : "Próxima retransmisión"}
                </p>
                {(cfg.expectedStart || next) && (
                  <div className="mt-2">
                    <p className="font-display text-lg uppercase tracking-wide text-foreground/90">
                      {dayLabel(dayInTz((cfg.expectedStart || next!.scheduled_at), ASU26_TZ)).replace(/ de /g, " ").replace(",", "")}
                    </p>
                    <div className="mt-2"><DualTime iso={cfg.expectedStart || next!.scheduled_at} /></div>
                    {!cfg.expectedStart && next && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <p className="font-display text-xl uppercase tracking-wide text-foreground">{next.event_name}</p>
                        {next.venue_type && <span className="font-condensed text-[10px] font-bold uppercase tracking-[2px] text-asu-light">{next.venue_type}</span>}
                        <span className="font-condensed rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">Próximamente</span>
                      </div>
                    )}
                  </div>
                )}
                <TzLegend className="mt-3" />
                {cfg.preStreamMessage && <p className="mt-1 text-sm text-muted-foreground">{cfg.preStreamMessage}</p>}
              </div>
            )}
            <div className="asu-frame order-2 overflow-hidden rounded-2xl md:order-none">
              <Asu26Player cfg={cfg} nextIso={cfg.expectedStart || next?.scheduled_at || null} />
            </div>
            <div className="order-3 md:order-none"><Asu26LogosBlock cfg={cfg} /></div>
            <div className="order-4 md:order-none">
            <Asu26LiveUpdates entries={liveUpdates} />
            </div>
          </div>

          <aside id="horarios" className="scroll-mt-16 min-w-0 self-start rounded-2xl bg-asu-deep/50 p-4 md:p-6 xl:sticky xl:top-16 xl:p-7">
            <h2 className="font-display text-3xl uppercase tracking-wide text-foreground md:text-4xl">Próximas pruebas</h2>
            <TzLegend className="mb-3 mt-1" />
            {items === null ? (
              <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-surface" />)}</div>
            ) : upcoming.length === 0 ? (
              <p className="rounded-xl border border-border bg-surface/60 p-4 text-sm text-muted-foreground">No hay próximas pruebas programadas.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {upcoming.map((it, idx) => {
                  const st = raceState(it, results);
                  const lead = idx === 0;
                  return (
                    <li
                      key={it.id}
                      className={`asu-reveal grid grid-cols-[5.5rem_1fr] gap-3 rounded-xl px-2 py-4 transition-colors duration-200 hover:bg-asu-deep/40 xl:py-5 ${
                        st.hot ? "bg-tv-red/10" : lead ? "bg-asu/25 ring-1 ring-asu-light/40" : ""
                      }`}
                    >
                      <div className="text-center">
                        <DualTime iso={it.scheduled_at} variant="compact" />
                        <p className="font-condensed mt-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                          {dayLabel(dayInTz(it.scheduled_at, ASU26_TZ)).split(",")[1]?.trim() ?? ""}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-condensed text-[10px] font-bold uppercase tracking-[2px] text-asu-light">
                          {[it.category, it.gender].filter(Boolean).join(" ")}
                        </p>
                        {lead && !st.hot && <p className="font-condensed text-[9px] font-bold uppercase tracking-[3px] text-asu-coral">Siguiente</p>}
                        <p className="font-display break-words text-lg uppercase leading-tight tracking-wide text-foreground">{it.event_name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {it.venue_type && <span className="font-condensed text-[11px] font-bold uppercase tracking-widest text-foreground/75">{it.venue_type} ·</span>}
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
            <a
              href={specialLink(cfg.links.calendario)}
              className="font-condensed mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-gold px-5 text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-gold-light"
            >
              Ver calendario completo <ArrowRight className="h-4 w-4" />
            </a>
          </aside>
        </div>
      </section>

      {/* RESULTADOS */}
      <section id="resultados" className="asu-track-soft scroll-mt-16 py-12 md:py-20">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-4xl uppercase tracking-wide text-foreground md:text-6xl">Resultados oficiales</h2>
              <p className="font-condensed mt-1 text-xs uppercase tracking-[3px] text-muted-foreground">Powered by VeloPro</p>
            </div>
            {cfg.logoPoweredByVeloproUrl ? (
              <img src={cfg.logoPoweredByVeloproUrl} alt="Powered by VeloPro" className="h-9 w-auto max-w-[180px] object-contain" loading="lazy" />
            ) : null}
          </div>
          <div className="overflow-hidden rounded-2xl bg-asu-deep/40 p-3 ring-1 ring-asu-light/20 md:p-6">
            <div className="asu-stripe -mx-3 -mt-3 mb-4 h-[3px] md:-mx-6 md:-mt-6 md:mb-6" aria-hidden="true" />
            <Asu26Results cfg={cfg} results={results} />
          </div>
        </div>
      </section>

      {/* HOY */}
      <section id="calendario" className={`scroll-mt-16 bg-asu-deep/60 ${todays.length === 0 ? "py-6" : "py-10"}`}>
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-4xl uppercase tracking-wide text-foreground md:text-5xl">Hoy en ASU26</h2>
            <TzLegend />
          </div>
          <p className="font-condensed mt-1 text-xs uppercase tracking-[3px] text-asu-light first-letter:uppercase">{dayLabel(today)}</p>
          {todays.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No hay pruebas de velocidad programadas hoy.</p>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat k="Modalidad" v={[...new Set(todays.map((t) => t.venue_type).filter(Boolean))].join(" · ") || "—"} />
              <Stat k="Carreras" v={String(todays.length)} />
              <Stat k="Primera prueba" v={`${timeInTz(todays[0].scheduled_at, ASU26_TZ)} PY · ${todays[0].event_name}`} />
              <Stat k="Última prueba" v={`${timeInTz(todays[todays.length - 1].scheduled_at, ASU26_TZ)} PY · ${todays[todays.length - 1].event_name}`} />
            </div>
          )}
          <a
            href={specialLink(cfg.links.calendario)}
            className={`font-condensed ${todays.length === 0 ? "mt-4" : "mt-6"} inline-flex min-h-11 items-center gap-2 rounded-md bg-gold px-5 text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-gold-light`}
          >
            Ver calendario completo <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* ESPECIAL */}
      <section id="especial" className="scroll-mt-16 py-10 md:py-14">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <h2 className="font-display mb-8 text-4xl uppercase tracking-wide text-foreground md:text-5xl">Descubre el especial ASU26</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {(
              [
                ["calendario", "Calendario", "Todas las pruebas"],
                ["resultados", "Resultados", "Clasificaciones oficiales"],
                ["espana", "España", "Selección española"],
                ["medallero", "Medallero", "Países y medallas"],
                ["noticias", "Noticias", "Actualidad ASU26"],
              ] as const
            ).map(([k, label, sub]) => (
              <a
                key={k}
                href={specialLink(cfg.links[k])}
                className="group flex min-h-24 flex-col justify-between rounded-xl bg-surface/70 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-asu-deep/60"
              >
                <span>
                  <span className="font-display block text-xl uppercase tracking-wide text-foreground group-hover:text-gold">{label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{sub}</span>
                </span>
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
    <div className="min-w-0 rounded-xl bg-background/50 p-4">
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
    <span className="font-condensed inline-flex items-center gap-1.5 rounded-full bg-asu-deep/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[2px] text-asu-light">
      <Clock className="h-3.5 w-3.5" /> {status === "finished" ? "Finalizado" : "Próximamente"}
    </span>
  );
}
