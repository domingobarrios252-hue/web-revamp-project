import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, ShieldCheck, Clock, ArrowRight, ListOrdered, Users, Medal, Newspaper } from "lucide-react";
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
import { ASU_ZONE, ZoneTag, hhmm, useViewerZone } from "@/components/tv/asu26/Asu26Time";
import veloproLogo from "@/assets/logo-velopro-tight.png.asset.json";
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
  { id: "resultados", label: "Resultados", href: "/rollerzone-tv/world-skate-games-asu26/resultados" },
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

  const nextIso = cfg.expectedStart || next?.scheduled_at || null;
  const viewerZone = useViewerZone();
  const statusPill = <StatusBadge status={cfg.streamStatus} />;

  return (
    <div className="asu-light relative isolate w-full min-w-0 overflow-x-clip">
      {/* Grafismo ASU26 solo en bordes */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 hidden h-[900px] w-full md:block" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMin slice">
        <path d="M0 0H300C220 40 120 60 0 140Z" className="fill-asu-pink/40" />
        <path d="M0 160C60 120 120 110 170 120L0 230Z" className="fill-asu-coral/35" />
        <path d="M1440 0H1060C1180 40 1320 100 1440 200Z" className="fill-asu/25" />
        <path d="M1440 220C1400 200 1360 190 1330 200L1440 300Z" className="fill-asu-coral/35" />
      </svg>

      {/* NAV del especial (oscuro) */}
      <nav aria-label="Secciones ASU26" className="asu-dark sticky top-0 z-30 border-b border-border bg-asu-deep">
        <div className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-2 py-1 [scrollbar-width:none] md:px-6">
          {NAV.map((n) => (
            <a
              key={n.label}
              href={"href" in n && n.href ? n.href : "link" in n && n.link ? specialLink(cfg.links[n.link]) : `#${n.id}`}
              onClick={(e) => {
                if (("link" in n && n.link) || ("href" in n && n.href)) return;
                e.preventDefault();
                document.getElementById(n.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="font-condensed inline-flex min-h-11 shrink-0 items-center border-b-2 border-transparent px-3 text-xs font-bold uppercase tracking-[2px] text-muted-foreground transition-colors first:border-asu-coral first:text-foreground hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </div>
      </nav>

      {/* DIRECTO */}
      <section id="directo" className="scroll-mt-14 pb-10 pt-8 md:pb-14 md:pt-10">
        <div className="mx-auto grid max-w-[1500px] gap-6 px-4 md:px-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col">
            <p className="font-condensed text-xs font-bold uppercase tracking-[2.5px] text-asu-coral md:text-sm">
              <ShieldCheck className="mr-1.5 inline h-4 w-4 align-[-3px]" />World Skate Games ASU26
              <span className="text-asu-ink/70"> · Patinaje de velocidad</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3">
              <h1 className="font-display text-6xl uppercase leading-[0.95] tracking-wide md:text-8xl">
                <span className="text-asu-ink">En </span><span className="text-asu-coral">directo</span>
              </h1>
              {statusPill}
            </div>
            {nextIso && cfg.streamStatus !== "finished" && (
              <div className="font-condensed mt-4 flex flex-wrap items-center gap-x-7 gap-y-2 text-sm font-bold uppercase tracking-[2.5px] text-asu-ink md:text-base">
                <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-asu-coral" />{dayLabel(dayInTz(nextIso, ASU26_TZ))}</span>
                <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-asu-coral" />{timeInTz(nextIso, ASU26_TZ)} · Asunción{viewerZone && <span className="text-asu-ink/70">· {hhmm(nextIso, viewerZone.tz)} {viewerZone.label}</span>}</span>
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-asu" />Asunción, Paraguay</span>
              </div>
            )}

            {!live && (
              <div className="mt-6 grid gap-4 rounded-2xl border border-asu/30 bg-surface/80 p-5 md:grid-cols-[auto_1fr] md:items-center md:gap-8 md:p-6">
                <div className="md:border-r md:border-asu/20 md:pr-8">
                  <p className="font-condensed text-xs font-bold uppercase tracking-[2.5px] text-asu">
                    {cfg.streamStatus === "finished" ? "Retransmisión finalizada" : "Próxima transmisión"}
                  </p>
                  {nextIso && <div className="mt-2"><NextTime iso={nextIso} /></div>}
                </div>
                <div className="min-w-0">
                  {!cfg.expectedStart && next && (
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-2xl uppercase tracking-wide text-asu-ink md:text-3xl">{next.event_name}</p>
                      {next.venue_type && <span className="font-condensed rounded-full bg-asu-coral px-3 py-0.5 text-[11px] font-bold uppercase tracking-[2px] text-asu-ink">{next.venue_type}</span>}
                      <span className="font-condensed rounded-full border border-asu px-3 py-0.5 text-[11px] font-bold uppercase tracking-[2px] text-asu">Próximamente</span>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-asu-ink/70">Horario oficial de Asunción (PY) y conversión automática a la hora local del visitante.</p>
                  {cfg.preStreamMessage && <p className="mt-1 text-sm text-asu-ink/80">{cfg.preStreamMessage}</p>}
                </div>
              </div>
            )}

            <div className="mt-6">
              <Asu26Player cfg={cfg} nextIso={nextIso} />
            </div>
            <div className="asu-dark">
              <Asu26LiveUpdates entries={liveUpdates} />
            </div>
          </div>

          <aside id="horarios" className="scroll-mt-16 min-w-0 self-start overflow-hidden rounded-2xl border border-asu/25 bg-surface xl:sticky xl:top-16">
            <div className="asu-dark bg-asu-deep px-5 py-4">
              <h2 className="font-display text-3xl uppercase tracking-wide text-foreground">Próximas pruebas</h2>
              <p className="mt-0.5 text-[11px] text-asu-cream/80">Horario oficial de Asunción (PY) y conversión automática a la hora local del visitante.</p>
            </div>
            <div className="px-5 pb-5">
              {items === null ? (
                <div className="space-y-2 pt-4">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2" />)}</div>
              ) : upcoming.length === 0 ? (
                <p className="pt-4 text-sm text-muted-foreground">No hay próximas pruebas programadas.</p>
              ) : (
                <ul className="divide-y divide-asu/15">
                  {upcoming.map((it) => {
                    const st = raceState(it, results);
                    return (
                      <li key={it.id} className={`grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-4 ${st.hot ? "bg-tv-red/5" : ""}`}>
                        <div>
                          <RowTime iso={it.scheduled_at} />
                          <p className="font-condensed mt-1.5 text-[10px] font-bold uppercase tracking-[1.5px] text-asu-ink/70">
                            {dayLabel(dayInTz(it.scheduled_at, ASU26_TZ)).split(",")[1]?.trim() ?? ""}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="font-display break-words text-lg uppercase leading-tight tracking-wide text-asu-ink">{it.event_name}</p>
                          <p className="font-condensed text-[10px] font-bold uppercase tracking-[1.5px] text-asu-ink/60">{[it.category, it.gender].filter(Boolean).join(" ")}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            {it.venue_type && <span className="font-condensed text-[10px] font-bold uppercase tracking-[2px] text-asu-ink/80">{it.venue_type} ·</span>}
                            <span className={`font-condensed rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[1.5px] ${st.hot ? "bg-tv-red text-white" : "border border-asu text-asu"}`}>{st.label}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <a
                href={specialLink(cfg.links.calendario)}
                className="font-condensed mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-gold px-5 text-xs font-bold uppercase tracking-widest text-asu-ink transition-colors hover:bg-gold-light"
              >
                Ver calendario completo <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </aside>
        </div>

        <div className="mx-auto mt-6 max-w-[1500px] px-4 md:px-8">
          <Asu26LogosBlock cfg={cfg} />
        </div>
      </section>

      {/* RESULTADOS */}
      <section id="resultados" className="scroll-mt-14 pb-12 md:pb-16">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <div className="rounded-2xl border border-asu/20 bg-surface/70 p-4 md:p-7">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-4xl uppercase tracking-wide md:text-6xl">
                  <span className="text-asu-ink">Resultados </span><span className="text-asu-coral">oficiales</span>
                </h2>
                <p className="font-condensed mt-1 text-xs font-bold uppercase tracking-[3px] text-asu">Powered by VeloPro</p>
              </div>
              <img src={veloproLogo.url} alt="VeloPro" className="h-10 w-auto max-w-[180px] object-contain mix-blend-multiply md:h-12" loading="lazy" />
            </div>
            <div className="asu-dark overflow-hidden rounded-xl bg-asu-deep p-3 md:p-5">
              <Asu26Results cfg={cfg} results={results} limit={4} />
            </div>
            <div className="mt-5 flex justify-center">
              <Link
                to="/rollerzone-tv/world-skate-games-asu26/resultados"
                className="font-condensed inline-flex min-h-12 items-center gap-2 rounded-lg bg-asu-coral px-6 text-sm font-bold uppercase tracking-widest text-background transition-opacity hover:opacity-90"
              >
                Ver todos los resultados <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOY */}
      <section id="calendario" className="relative scroll-mt-14 overflow-hidden pb-12 md:pb-16">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-0 -z-10 hidden h-72 w-72 rounded-full bg-asu-light/15 md:block" />
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-4xl uppercase tracking-wide md:text-6xl">
              <span className="text-asu-ink">Hoy en </span><span className="text-asu-coral">ASU26</span>
            </h2>
            <p className="font-condensed text-[10px] font-bold uppercase tracking-[2px] text-asu">Horarios oficiales · Hora local de Asunción (PY)</p>
          </div>
          <p className="font-condensed mt-1 text-xs font-bold uppercase tracking-[3px] text-asu first-letter:uppercase">{dayLabel(today)}</p>
          {todays.length === 0 ? (
            <p className="mt-2 text-sm text-asu-ink/80">No hay pruebas de velocidad programadas hoy.</p>
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
            className="font-condensed mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-gold px-5 text-xs font-bold uppercase tracking-widest text-asu-ink transition-colors hover:bg-gold-light"
          >
            Ver calendario completo <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* ESPECIAL */}
      <section id="especial" className="scroll-mt-14 border-t border-asu/15 py-10 md:py-14">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <h2 className="font-display mb-6 text-4xl uppercase tracking-wide md:text-5xl">
            <span className="text-asu-ink">Descubre el especial </span><span className="text-asu-coral">ASU26</span>
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {(
              [
                ["calendario", "Calendario", "Todas las pruebas", CalendarDays],
                ["resultados", "Resultados", "Clasificaciones oficiales", ListOrdered],
                ["espana", "España", "Selección española", Users],
                ["medallero", "Medallero", "Países y medallas", Medal],
                ["noticias", "Noticias", "Actualidad ASU26", Newspaper],
              ] as const
            ).map(([k, label, sub, Icon]) => (
              <a
                key={k}
                href={specialLink(cfg.links[k])}
                className="group flex items-start gap-4 rounded-xl border border-asu/20 bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-asu/50"
              >
                <Icon className="h-8 w-8 shrink-0 text-asu" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="font-display block text-xl uppercase tracking-wide text-asu-ink">{label}</span>
                  <span className="block text-xs text-asu-ink/70">{sub}</span>
                  <ArrowRight className="mt-2 h-4 w-4 text-asu-coral transition-transform group-hover:translate-x-1" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function NextTime({ iso }: { iso: string }) {
  const zone = useViewerZone();
  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <p className="font-display text-6xl leading-none text-asu-ink md:text-7xl">{hhmm(iso, ASU26_TZ)}</p>
          <ZoneTag zone={ASU_ZONE} className="mt-1.5 text-[11px] tracking-[2.5px] text-asu" />
        </div>
        {zone && (
          <div className="pb-0.5">
            <p className="font-display text-4xl leading-none text-asu-ink/85 md:text-5xl">{hhmm(iso, zone.tz)}</p>
            <ZoneTag zone={{ ...zone, label: zone.label === "Hora local" ? "Tu zona horaria" : `${zone.label} · hora local` }} className="mt-1.5 text-[10px] tracking-[2px] text-asu-ink/75" />
          </div>
        )}
      </div>
    </div>
  );
}

function RowTime({ iso }: { iso: string }) {
  const zone = useViewerZone();
  return (
    <div className="leading-none">
      <p className="font-display text-3xl text-asu-ink">{hhmm(iso, ASU26_TZ)}</p>
      <ZoneTag zone={{ label: "PY", flag: ASU_ZONE.flag }} className="mt-1 text-[9px] tracking-[1.5px] text-asu" />
      {zone && (
        <div className="mt-1.5">
          <p className="font-display text-xl text-asu-ink/75">{hhmm(iso, zone.tz)}</p>
          <ZoneTag zone={zone} className="mt-0.5 text-[9px] tracking-[1px] text-asu-ink/70" />
        </div>
      )}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-asu/20 bg-surface p-4">
      <p className="font-condensed text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">{k}</p>
      <p className="mt-1 break-words text-sm font-semibold text-foreground">{v}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Asu26StreamingConfig["streamStatus"] }) {
  if (status === "live")
    return (
      <span className="asu-live-glow font-condensed inline-flex min-h-11 items-center gap-2 rounded-full bg-tv-red px-5 text-sm font-bold uppercase tracking-[3px] text-white">
        <span className="live-dot h-2 w-2 rounded-full bg-white" /> En directo
      </span>
    );
  return (
    <span className="font-condensed inline-flex min-h-11 items-center gap-2 rounded-full bg-asu-deep px-5 text-sm font-bold uppercase tracking-[3px] text-asu-cream">
      <span className={`h-2 w-2 rounded-full ${status === "finished" ? "bg-asu-cream/50" : "bg-asu-coral"}`} /> {status === "finished" ? "Finalizado" : "Próximamente"}
    </span>
  );
}
