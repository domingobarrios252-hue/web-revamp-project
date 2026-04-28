import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarClock,
  Clock,
  Download,
  ExternalLink,
  Filter,
  Gauge,
  Maximize2,
  Medal,
  RefreshCw,
  Search,
  Share2,
  TrendingUp,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { youTubeEmbedUrl } from "@/lib/youtube";

// Live Center: experiencia pública premium, conectada al CMS existente.
type Status = "upcoming" | "live" | "finished";
type SortKey = "position" | "time" | "gap" | "lastLap";
type ViewTab = "leaderboard" | "laps" | "head";

type LiveEvent = { id: string; name: string; slug: string; status: Status };
type Race = { id: string; event_id: string; race_name: string; category: string | null; scheduled_time: string; status: Status };
type Result = {
  id: string;
  race_id: string;
  position: number;
  athlete_name: string;
  club: string | null;
  country: string | null;
  time: string | null;
  gap: string | null;
  is_highlighted: boolean;
  updated_at: string;
};
type MedalRow = { id: string; country_name: string; country_code: string | null; flag_url: string | null; gold: number; silver: number; bronze: number };
type LiveCenterEventSetting = { medals_enabled?: boolean; full_results_label?: string; full_results_url?: string };
type LiveCenterHomeSetting = { tv_enabled?: boolean; tv_url?: string; tv_title?: string; current_race_enabled?: boolean; results_enabled?: boolean; upcoming_enabled?: boolean };
type EnrichedResult = Result & { dorsal: number; flag: string; lastLap: string; statusLabel: string; statusTone: "leader" | "chasing" | "stable" | "alert"; seasonBest: string; avgLap: string; consistency: number[]; positions: number[]; speed: string };

type TickerItem = { id: string; time: string; icon: string; type: string; message: string; tone: "danger" | "warning" | "success" | "cyan" };

const REFRESH_MS = 15_000;
const TOTAL_LAPS = 40;
const CURRENT_LAP = 12;
const COUNTRY_FLAGS: Record<string, string> = {
  ESP: "🇪🇸", ES: "🇪🇸", POR: "🇵🇹", PT: "🇵🇹", FRA: "🇫🇷", FR: "🇫🇷", ITA: "🇮🇹", IT: "🇮🇹", GER: "🇩🇪", DE: "🇩🇪", NED: "🇳🇱", NL: "🇳🇱", BEL: "🇧🇪", BE: "🇧🇪", COL: "🇨🇴", VE: "🇻🇪", MEX: "🇲🇽", ARG: "🇦🇷", CHI: "🇨🇱", USA: "🇺🇸", US: "🇺🇸",
};

export function LiveCenter() {
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [currentRace, setCurrentRace] = useState<Race | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [upcoming, setUpcoming] = useState<Race[]>([]);
  const [medals, setMedals] = useState<MedalRow[]>([]);
  const [showMedals, setShowMedals] = useState(true);
  const [homeSetting, setHomeSetting] = useState<LiveCenterHomeSetting | null>(null);
  const [eventSetting, setEventSetting] = useState<LiveCenterEventSetting | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>("leaderboard");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("position");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [selectedCompare, setSelectedCompare] = useState<string[]>([]);
  const shellRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setRefreshing(true);
      const client = supabase as any;
      const { data: eventData } = await client.from("events").select("id, name, slug, status").eq("status", "live").order("updated_at", { ascending: false }).limit(1).maybeSingle();
      const activeEvent = (eventData as LiveEvent | null) ?? null;
      let raceData: Race | null = null;
      let resultData: Result[] = [];
      let upcomingData: Race[] = [];

      const [{ data: medalData }, { data: medalSetting }, { data: eventSettings }, { data: homeSettings }, { data: tvSettings }] = await Promise.all([
        client.from("medal_standings").select("id, country_name, country_code, flag_url, gold, silver, bronze").eq("published", true).order("gold", { ascending: false }).order("silver", { ascending: false }).order("bronze", { ascending: false }).limit(8),
        client.from("site_settings").select("value").eq("key", "home_medals_enabled").maybeSingle(),
        client.from("site_settings").select("value").eq("key", "live_center_event_settings").maybeSingle(),
        client.from("site_settings").select("value").eq("key", "live_center_home_settings").maybeSingle(),
        client.from("tv_settings").select("live_stream_url, live_title").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (activeEvent) {
        const [{ data: liveRace }, { data: nextRaces }] = await Promise.all([
          client.from("races").select("id, event_id, race_name, category, scheduled_time, status").eq("event_id", activeEvent.id).eq("status", "live").order("scheduled_time", { ascending: true }).limit(1).maybeSingle(),
          client.from("races").select("id, event_id, race_name, category, scheduled_time, status").eq("event_id", activeEvent.id).eq("status", "upcoming").order("scheduled_time", { ascending: true }).limit(8),
        ]);
        raceData = (liveRace as Race | null) ?? null;
        upcomingData = (nextRaces as Race[]) ?? [];
        if (raceData) {
          const { data } = await client.from("results").select("id, race_id, position, athlete_name, club, country, time, gap, is_highlighted, updated_at").eq("race_id", raceData.id).order("position", { ascending: true }).limit(100);
          resultData = (data as Result[]) ?? [];
        }
      }

      if (!cancelled) {
        setEvent(activeEvent);
        setCurrentRace(raceData);
        setResults(resultData);
        setUpcoming(upcomingData);
        setMedals((medalData as MedalRow[]) ?? []);
        const settingValue = medalSetting?.value as { enabled?: boolean } | null;
        setShowMedals(typeof settingValue?.enabled === "boolean" ? settingValue.enabled : true);
        const savedHomeSetting = (homeSettings?.value ?? {}) as LiveCenterHomeSetting;
        setHomeSetting({
          tv_enabled: savedHomeSetting.tv_enabled ?? false,
          tv_url: savedHomeSetting.tv_url || tvSettings?.live_stream_url || "",
          tv_title: savedHomeSetting.tv_title || tvSettings?.live_title || "TV en directo",
          current_race_enabled: savedHomeSetting.current_race_enabled ?? true,
          results_enabled: savedHomeSetting.results_enabled ?? true,
          upcoming_enabled: savedHomeSetting.upcoming_enabled ?? true,
        });
        const perEventSettings = (eventSettings?.value ?? {}) as Record<string, LiveCenterEventSetting>;
        setEventSetting(activeEvent ? perEventSettings[activeEvent.id] ?? null : null);
        setLoaded(true);
        setLastUpdated(new Date());
        setRefreshing(false);
      }
    };

    load();
    const interval = setInterval(load, REFRESH_MS);
    const channel = (supabase as any)
      .channel("live-center-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "races" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "medal_standings" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, load)
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const enrichedResults = useMemo(() => enrichResults(results), [results]);
  const countries = useMemo(() => Array.from(new Set(enrichedResults.map((row) => row.country).filter(Boolean))).sort() as string[], [enrichedResults]);
  const filteredResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    return enrichedResults
      .filter((row) => (country === "all" || row.country === country) && (!term || row.athlete_name.toLowerCase().includes(term) || String(row.dorsal).includes(term) || (row.club ?? "").toLowerCase().includes(term)))
      .sort((a, b) => sortValue(a, sortKey) > sortValue(b, sortKey) ? 1 : -1);
  }, [country, enrichedResults, query, sortKey]);
  const ticker = useMemo(() => makeTicker(enrichedResults, currentRace, upcoming), [currentRace, enrichedResults, upcoming]);
  const stats = useMemo(() => makeStats(enrichedResults), [enrichedResults]);
  const tvEmbedUrl = homeSetting?.tv_enabled ? youTubeEmbedUrl(homeSetting.tv_url) : null;
  const showCurrentRace = homeSetting?.current_race_enabled !== false;
  const showResultsPanel = homeSetting?.results_enabled !== false;
  const showUpcomingPanel = homeSetting?.upcoming_enabled !== false;
  const progress = currentRace?.status === "finished" ? 100 : Math.round((CURRENT_LAP / TOTAL_LAPS) * 100);

  if (!loaded) return null;

  const copyShareLink = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) await navigator.clipboard.writeText(window.location.href);
    toast.success("Enlace de carrera copiado");
  };

  const downloadCsv = () => {
    const header = ["Pos", "Dorsal", "Pais", "Patinador", "Club", "Tiempo", "Gap", "Ultima vuelta", "Estado"];
    const csv = [header, ...filteredResults.map((row) => [row.position, row.dorsal, row.country ?? "", row.athlete_name, row.club ?? "", row.time ?? "", row.gap ?? "", row.lastLap, row.statusLabel])]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${event?.slug ?? "live-center"}-resultados.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = async () => {
    if (!shellRef.current || typeof document === "undefined") return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await shellRef.current.requestFullscreen();
  };

  return (
    <section ref={shellRef} className="live-center-shell border-y border-border bg-background">
      <div className="mx-auto max-w-[1800px] px-4 py-6 md:px-6 lg:px-8">
        <LiveHeader event={event} race={currentRace} refreshing={refreshing} lastUpdated={lastUpdated} onShare={copyShareLink} onNotifications={() => setNotificationsOpen(true)} onFullscreen={toggleFullscreen} />
        {showCurrentRace && <RaceProgress race={currentRace} progress={progress} />}

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(220px,20%)_minmax(0,60%)_minmax(240px,20%)] lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
          <aside className="grid content-start gap-4 lg:col-span-1">
            <SidebarEvents event={event} currentRace={currentRace} upcoming={upcoming} showUpcoming={showUpcomingPanel} onNotify={() => setNotificationsOpen(true)} />
            {tvEmbedUrl && <LiveTvCard embedUrl={tvEmbedUrl} title={homeSetting?.tv_title || "TV en directo"} />}
          </aside>

          <main className="min-w-0 space-y-4 lg:col-span-1">
            <MobileTabRail activeTab={activeTab} setActiveTab={setActiveTab} />
            <SearchFilter query={query} setQuery={setQuery} country={country} setCountry={setCountry} countries={countries} sortKey={sortKey} setSortKey={setSortKey} onCompare={() => setComparisonOpen(true)} onDownload={downloadCsv} />
            {showResultsPanel && activeTab === "leaderboard" && <Leaderboard rows={filteredResults} expandedId={expandedId} setExpandedId={setExpandedId} />}
            {activeTab === "laps" && <LapTimes rows={filteredResults} />}
            {activeTab === "head" && <HeadToHead rows={filteredResults.slice(0, 3)} onOpen={() => setComparisonOpen(true)} />}
            {event && <FullResultsButton event={event} setting={eventSetting} />}
          </main>

          <aside className="grid content-start gap-4 lg:col-span-2 xl:col-span-1">
            <StatsPanel stats={stats} leader={enrichedResults[0]} />
            <LiveTicker items={ticker} />
            {showMedals && eventSetting?.medals_enabled !== false && medals.length > 0 && <MedalTable medals={medals} />}
          </aside>
        </div>
      </div>

      {notificationsOpen && <NotificationsModal rows={enrichedResults} onClose={() => setNotificationsOpen(false)} />}
      {comparisonOpen && <ComparisonModal rows={enrichedResults} selected={selectedCompare} setSelected={setSelectedCompare} onClose={() => setComparisonOpen(false)} />}
    </section>
  );
}

function LiveHeader({ event, race, refreshing, lastUpdated, onShare, onNotifications, onFullscreen }: { event: LiveEvent | null; race: Race | null; refreshing: boolean; lastUpdated: Date | null; onShare: () => void; onNotifications: () => void; onFullscreen: () => void }) {
  return (
    <header className="live-panel overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="live-red-tag font-condensed inline-flex items-center gap-2 rounded px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-foreground"><span className="live-dot-fast h-2 w-2 rounded-full bg-foreground" /> EN VIVO</span>
            <span className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">{lastUpdated ? `Actualizado ${lastUpdated.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}` : "Sincronizando"}</span>
            <RefreshCw className={`h-3.5 w-3.5 text-live-orange ${refreshing ? "animate-spin" : ""}`} />
          </div>
          <h2 className="font-display truncate text-3xl uppercase tracking-widest md:text-5xl">{event?.name ?? "Live Center RollerZone"}</h2>
          <p className="font-condensed mt-1 text-sm uppercase tracking-widest text-muted-foreground">{race?.category ?? "Élite Masculino"} · {race?.race_name ?? "10.000m Puntos/Eliminación"} · Vuelta {CURRENT_LAP} de {TOTAL_LAPS}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex">
          <ActionButton icon={<Share2 />} onClick={onShare}>Compartir</ActionButton>
          <ActionButton icon={<Bell />} onClick={onNotifications}>Alertas</ActionButton>
          <ActionButton icon={<Maximize2 />} onClick={onFullscreen}>Full</ActionButton>
        </div>
      </div>
    </header>
  );
}

function RaceProgress({ race, progress }: { race: Race | null; progress: number }) {
  return (
    <article className="live-panel mt-4 rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-condensed text-sm font-bold uppercase tracking-widest">Vuelta {race?.status === "finished" ? TOTAL_LAPS : CURRENT_LAP} de {TOTAL_LAPS} <span className="text-live-cyan">({progress}%)</span></h3>
        <div className="font-mono text-xs text-muted-foreground"><Clock className="mr-1 inline h-3.5 w-3.5 text-live-orange" />45:32 transcurrido · 1:32:00 estimado</div>
      </div>
      <div className="h-3 overflow-hidden rounded bg-muted"><div className="live-progress h-full rounded" style={{ width: `${progress}%` }} /></div>
    </article>
  );
}

function SidebarEvents({ event, currentRace, upcoming, showUpcoming, onNotify }: { event: LiveEvent | null; currentRace: Race | null; upcoming: Race[]; showUpcoming: boolean; onNotify: () => void }) {
  const categories = [currentRace?.category || "Élite Masculino", "Élite Femenino", "Junior Masculino", "Junior Femenino", "Cadete Masculino", "Cadete Femenino"];
  return (
    <article className="live-panel rounded-lg border border-border bg-surface p-4">
      <h3 className="font-display mb-3 flex items-center gap-2 text-xl uppercase tracking-widest"><span className="live-dot-fast h-2 w-2 rounded-full bg-tv-red" /> Eventos en vivo</h3>
      <div className="grid gap-2">
        {categories.map((category, index) => <button key={category} className={`font-condensed flex items-center justify-between rounded border px-3 py-2 text-left text-xs font-bold uppercase tracking-widest transition ${index === 0 ? "border-live-orange bg-live-orange/10 text-foreground" : "border-border text-muted-foreground hover:border-live-cyan hover:text-foreground"}`}><span>{category}</span>{index === 0 ? "✓" : ""}</button>)}
      </div>
      {showUpcoming && <div className="mt-5 border-t border-border pt-4"><h4 className="font-condensed mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground"><CalendarClock className="h-4 w-4 text-live-cyan" /> Próximos eventos</h4><ul className="space-y-3">{upcoming.length ? upcoming.map((race) => <li key={race.id} className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{race.race_name}</p><time className="font-mono text-xs text-muted-foreground">{formatRaceTime(race.scheduled_time)}</time></div><button aria-label="Activar notificaciones" onClick={onNotify} className="rounded border border-border p-2 text-muted-foreground hover:border-live-orange hover:text-live-orange"><Bell className="h-3.5 w-3.5" /></button></li>) : <li className="text-sm text-muted-foreground">Sin próximas pruebas.</li>}</ul></div>}
      <p className="font-condensed mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">{event?.name ?? "Selecciona un evento desde el CMS"}</p>
    </article>
  );
}

function SearchFilter({ query, setQuery, country, setCountry, countries, sortKey, setSortKey, onCompare, onDownload }: { query: string; setQuery: (value: string) => void; country: string; setCountry: (value: string) => void; countries: string[]; sortKey: SortKey; setSortKey: (value: SortKey) => void; onCompare: () => void; onDownload: () => void }) {
  return (
    <div className="live-panel rounded-lg border border-border bg-surface p-3">
      <div className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="input h-10 pl-9" placeholder="Buscar patinador, dorsal o club" /></label>
        <label className="relative"><Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><select value={country} onChange={(event) => setCountry(event.target.value)} className="input h-10 min-w-32 pl-9"><option value="all">Todos</option>{countries.map((item) => <option key={item} value={item}>{flagFor(item)} {item}</option>)}</select></label>
        <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} className="input h-10 min-w-36"><option value="position">Posición</option><option value="time">Tiempo</option><option value="gap">Gap</option><option value="lastLap">Última vuelta</option></select>
        <div className="grid grid-cols-2 gap-2"><button onClick={onCompare} className="live-mini-button"><Users className="h-4 w-4" /> Comparar</button><button onClick={onDownload} className="live-mini-button"><Download className="h-4 w-4" /> CSV</button></div>
      </div>
    </div>
  );
}

function MobileTabRail({ activeTab, setActiveTab }: { activeTab: ViewTab; setActiveTab: (tab: ViewTab) => void }) {
  const tabs: Array<[ViewTab, string, React.ReactNode]> = [["leaderboard", "Clasificación", <Trophy className="h-4 w-4" />], ["laps", "Vueltas", <Activity className="h-4 w-4" />], ["head", "Head-to-Head", <BarChart3 className="h-4 w-4" />]];
  return <nav className="hide-scrollbar flex gap-2 overflow-x-auto lg:overflow-visible">{tabs.map(([key, label, icon]) => <button key={key} onClick={() => setActiveTab(key)} className={`font-condensed inline-flex shrink-0 items-center gap-2 rounded border px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${activeTab === key ? "border-live-orange bg-live-orange/10 text-live-orange" : "border-border text-muted-foreground hover:text-foreground"}`}>{icon}{label}</button>)}</nav>;
}

function Leaderboard({ rows, expandedId, setExpandedId }: { rows: EnrichedResult[]; expandedId: string | null; setExpandedId: (id: string | null) => void }) {
  return (
    <article className="live-panel overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3"><h3 className="font-display text-xl uppercase tracking-widest">Clasificación en Vivo</h3><span className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">{rows.length} patinadores</span></div>
      {rows.length === 0 ? <div className="p-5 text-sm text-muted-foreground">Sin resultados cargados para la prueba actual.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="font-condensed bg-background/60 text-[10px] uppercase tracking-widest text-muted-foreground"><tr><th className="px-3 py-3">Pos</th><th className="px-3 py-3">#</th><th className="px-3 py-3">País</th><th className="px-3 py-3">Patinador</th><th className="px-3 py-3">Club</th><th className="px-3 py-3">Tiempo</th><th className="px-3 py-3">Gap</th><th className="px-3 py-3">Última vuelta</th><th className="px-3 py-3">Estado</th></tr></thead><tbody className="divide-y divide-border">{rows.map((row) => <Row key={row.id} row={row} expanded={expandedId === row.id} onToggle={() => setExpandedId(expandedId === row.id ? null : row.id)} />)}</tbody></table></div>}
    </article>
  );
}

function Row({ row, expanded, onToggle }: { row: EnrichedResult; expanded: boolean; onToggle: () => void }) {
  return <><tr onClick={onToggle} className={`cursor-pointer transition hover:bg-muted/70 ${row.position % 2 === 0 ? "bg-background/20" : ""} ${row.is_highlighted || row.position === 1 ? "live-row-pulse" : ""}`}><td className={`font-display px-3 py-3 text-xl ${row.position <= 3 ? "text-live-orange" : "text-foreground"}`}>{medal(row.position)} {row.position}</td><td className="px-3 py-3 font-mono text-xs text-muted-foreground">{row.dorsal}</td><td className="px-3 py-3 text-lg">{row.flag}</td><td className="px-3 py-3 font-semibold leading-tight">{row.athlete_name}</td><td className="font-condensed px-3 py-3 text-xs uppercase tracking-wide text-muted-foreground">{row.club ?? "—"}</td><td className="px-3 py-3 font-mono text-xs text-foreground">{row.time ?? "—"}</td><td className="px-3 py-3 font-mono text-xs text-muted-foreground">{row.gap ?? "—"}</td><td className="px-3 py-3 font-mono text-xs text-live-cyan">{row.lastLap}</td><td className="px-3 py-3"><StatusChip tone={row.statusTone}>{row.statusLabel}</StatusChip></td></tr>{expanded && <tr className="bg-background/50"><td colSpan={9} className="p-4"><ExpandedAthlete row={row} /></td></tr>}</>;
}

function ExpandedAthlete({ row }: { row: EnrichedResult }) {
  return <div className="grid gap-4 md:grid-cols-4"><Metric label="Mejor vuelta temporada" value={row.seasonBest} /><Metric label="Promedio vueltas" value={row.avgLap} /><Metric label="Velocidad media" value={row.speed} /><button type="button" onClick={() => toast("Perfil completo próximamente")} className="live-mini-button min-h-14">Ver Perfil Completo <ExternalLink className="h-4 w-4" /></button><div className="md:col-span-2"><p className="font-condensed mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Consistencia últimas 5 vueltas</p><div className="flex h-16 items-end gap-2">{row.consistency.map((value, index) => <span key={index} className="flex-1 rounded-t bg-live-cyan/70" style={{ height: `${value}%` }} />)}</div></div><div className="md:col-span-2"><p className="font-condensed mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Historial de posición</p><div className="flex h-16 items-end gap-1">{row.positions.map((value, index) => <span key={index} className="flex-1 rounded-t bg-live-orange/80" style={{ height: `${Math.max(18, 100 - value * 11)}%` }} />)}</div></div></div>;
}

function StatsPanel({ stats, leader }: { stats: ReturnType<typeof makeStats>; leader: EnrichedResult | undefined }) {
  return <article className="live-panel rounded-lg border border-border bg-surface p-4"><h3 className="font-display mb-3 flex items-center gap-2 text-xl uppercase tracking-widest"><TrendingUp className="h-5 w-5 text-live-orange" /> Estadísticas rápidas</h3><div className="grid gap-3"><Stat icon={<Zap />} label="Mejor vuelta" value={stats.bestLap} helper={leader?.athlete_name ?? "—"} /><Stat icon={<Gauge />} label="Velocidad media" value={stats.avgSpeed} helper={`Máxima ${stats.maxSpeed}`} /><Stat icon={<Activity />} label="Cambios de liderato" value={stats.leadChanges} helper="Carrera actual" /><Stat icon={<AlertTriangle />} label="Caídas" value={stats.incidents} helper="Descalificaciones 0" /></div></article>;
}

function LiveTicker({ items }: { items: TickerItem[] }) {
  return <article className="live-panel rounded-lg border border-border bg-surface p-4"><h3 className="font-display mb-3 flex items-center gap-2 text-xl uppercase tracking-widest"><BarChart3 className="h-5 w-5 text-live-cyan" /> Eventos en vivo</h3><div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">{items.slice(0, 8).map((item) => <div key={item.id} className={`ticker-card ticker-${item.tone} rounded border border-border bg-background/60 p-3`}><div className="font-condensed mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><span>{item.icon}</span><time className="text-muted-foreground">{item.time}</time><span>{item.type}</span></div><p className="text-sm leading-snug text-foreground/90">{item.message}</p></div>)}</div></article>;
}

function LapTimes({ rows }: { rows: EnrichedResult[] }) {
  return <article className="live-panel overflow-hidden rounded-lg border border-border bg-surface"><div className="border-b border-border px-4 py-3"><h3 className="font-display text-xl uppercase tracking-widest">Tiempos por vuelta</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="font-condensed bg-background/60 text-[10px] uppercase tracking-widest text-muted-foreground"><tr><th className="px-3 py-3 text-left">Patinador</th><th className="px-3 py-3">V10</th><th className="px-3 py-3">V11</th><th className="px-3 py-3">V12</th><th className="px-3 py-3">Mejor</th><th className="px-3 py-3">Media</th></tr></thead><tbody className="divide-y divide-border">{rows.map((row) => <tr key={row.id} className="hover:bg-muted/70"><td className="px-3 py-3 text-left font-semibold">{row.flag} {row.athlete_name}</td>{row.consistency.slice(0, 3).map((value, index) => <td key={index} className="px-3 py-3 text-center font-mono text-xs">1:0{Math.max(7, Math.round(12 - value / 25))}.{String(200 + index * 111).slice(0, 3)}</td>)}<td className="px-3 py-3 text-center font-mono text-xs text-live-cyan">{row.seasonBest}</td><td className="px-3 py-3 text-center font-mono text-xs">{row.avgLap}</td></tr>)}</tbody></table></div></article>;
}

function HeadToHead({ rows, onOpen }: { rows: EnrichedResult[]; onOpen: () => void }) {
  return <article className="live-panel rounded-lg border border-border bg-surface p-4"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-display text-xl uppercase tracking-widest">Análisis Head-to-Head</h3><button onClick={onOpen} className="live-mini-button">Elegir patinadores</button></div><div className="grid gap-3 md:grid-cols-3">{rows.map((row) => <div key={row.id} className="rounded border border-border bg-background/60 p-4"><p className="text-lg font-bold">{row.flag} {row.athlete_name}</p><p className="font-mono text-sm text-live-cyan">{row.lastLap}</p><div className="mt-3 h-2 rounded bg-muted"><div className="h-2 rounded bg-live-orange" style={{ width: `${row.consistency[0]}%` }} /></div></div>)}</div></article>;
}

function FullResultsButton({ event, setting }: { event: LiveEvent; setting: LiveCenterEventSetting | null }) {
  const label = setting?.full_results_label?.trim() || "Ver resultados completos";
  const customUrl = setting?.full_results_url?.trim();
  const className = "font-condensed inline-flex w-full items-center justify-center gap-2 rounded border border-live-orange px-4 py-3 text-xs font-bold uppercase tracking-widest text-live-orange transition hover:bg-live-orange hover:text-background";
  if (customUrl) return <a href={customUrl} className={className} target={customUrl.startsWith("http") ? "_blank" : undefined} rel={customUrl.startsWith("http") ? "noreferrer" : undefined}>{label} <ExternalLink className="h-4 w-4" /></a>;
  return <Link to="/eventos/$slug" params={{ slug: event.slug }} className={className}>{label} <ExternalLink className="h-4 w-4" /></Link>;
}

function LiveTvCard({ embedUrl, title }: { embedUrl: string; title: string }) {
  return <article className="live-panel overflow-hidden rounded-lg border border-border bg-surface"><div className="flex items-center justify-between border-b border-border px-4 py-3"><h3 className="font-display text-lg uppercase tracking-widest">{title}</h3><span className="live-dot-fast h-2 w-2 rounded-full bg-tv-red" /></div><div className="aspect-video bg-background"><iframe src={embedUrl} title={title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" /></div></article>;
}

function MedalTable({ medals }: { medals: MedalRow[] }) {
  return <article className="live-panel overflow-hidden rounded-lg border border-border bg-surface"><div className="flex items-center justify-between border-b border-border px-4 py-3"><h3 className="font-display text-lg uppercase tracking-widest">Medallero</h3><Medal className="h-4 w-4 text-live-orange" /></div><div className="font-condensed grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 border-b border-border bg-background/60 px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground"><span>País</span><span className="w-7 text-center text-live-orange">🥇</span><span className="w-7 text-center">🥈</span><span className="w-7 text-center">🥉</span><span className="w-8 text-right text-foreground">Σ</span></div><ul className="divide-y divide-border">{medals.map((row, index) => { const total = row.gold + row.silver + row.bronze; return <li key={row.id} className="font-condensed grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 px-3 py-2 text-xs"><div className="flex min-w-0 items-center gap-2"><span className="font-display w-4 text-[11px] text-muted-foreground">{index + 1}</span>{row.flag_url ? <img src={row.flag_url} alt={row.country_name} className="h-3.5 w-5 shrink-0 object-cover" loading="lazy" /> : <span className="w-5 shrink-0">{flagFor(row.country_code)}</span>}<span className="break-words uppercase leading-tight tracking-wider">{row.country_name}</span></div><span className="w-7 text-center font-bold text-live-orange">{row.gold}</span><span className="w-7 text-center text-foreground/80">{row.silver}</span><span className="w-7 text-center text-foreground/60">{row.bronze}</span><span className="font-display w-8 text-right text-sm">{total}</span></li>; })}</ul></article>;
}

function NotificationsModal({ rows, onClose }: { rows: EnrichedResult[]; onClose: () => void }) {
  const leader = rows[0]?.athlete_name ?? "el líder";
  const notify = (label: string) => toast.success(`Alerta activada: ${label}`);
  return <Modal onClose={onClose} title="Notificaciones Live Center"><div className="grid gap-2"><button onClick={() => notify(`${leader} cambia de posición`)} className="live-modal-option">Alertar cuando {leader} cambie de posición</button><button onClick={() => notify("caída en carrera")} className="live-modal-option">Cuando haya caída</button><button onClick={() => notify("récord o mejor marca")} className="live-modal-option">Cuando se bata récord</button></div></Modal>;
}

function ComparisonModal({ rows, selected, setSelected, onClose }: { rows: EnrichedResult[]; selected: string[]; setSelected: (ids: string[]) => void; onClose: () => void }) {
  const selectedRows = rows.filter((row) => selected.includes(row.id)).slice(0, 3);
  const toggle = (id: string) => setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : selected.length < 3 ? [...selected, id] : selected);
  return <Modal onClose={onClose} title="Comparar patinadores"><div className="grid gap-4 md:grid-cols-[240px_1fr]"><div className="max-h-80 space-y-2 overflow-y-auto">{rows.map((row) => <button key={row.id} onClick={() => toggle(row.id)} className={`w-full rounded border px-3 py-2 text-left text-sm ${selected.includes(row.id) ? "border-live-orange bg-live-orange/10" : "border-border"}`}>{row.flag} #{row.dorsal} {row.athlete_name}</button>)}</div><div className="grid gap-3">{selectedRows.length ? selectedRows.map((row) => <div key={row.id} className="rounded border border-border bg-background/60 p-3"><div className="mb-2 flex items-center justify-between gap-2"><strong>{row.athlete_name}</strong><span className="font-mono text-live-cyan">{row.lastLap}</span></div><div className="flex h-20 items-end gap-1">{row.consistency.map((value, index) => <span key={index} className="flex-1 rounded-t bg-live-orange" style={{ height: `${value}%` }} />)}</div></div>) : <p className="text-sm text-muted-foreground">Selecciona 2 o 3 patinadores para comparar tiempos por vuelta, consistencia y posición.</p>}</div></div></Modal>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur"><div className="live-panel w-full max-w-3xl rounded-lg border border-border bg-surface p-4 shadow-2xl"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-display text-2xl uppercase tracking-widest">{title}</h3><button onClick={onClose} className="rounded border border-border p-2 hover:border-live-orange"><X className="h-4 w-4" /></button></div>{children}</div></div>;
}

function ActionButton({ icon, children, onClick }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="font-condensed inline-flex items-center justify-center gap-2 rounded border border-border px-3 py-2 text-xs font-bold uppercase tracking-widest text-foreground transition hover:border-live-orange hover:text-live-orange">{icon}{children}</button>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded border border-border bg-background/60 p-3"><p className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p><p className="font-mono text-sm text-live-cyan">{value}</p></div>; }
function Stat({ icon, label, value, helper }: { icon: React.ReactNode; label: string; value: string; helper: string }) { return <div className="grid grid-cols-[auto_1fr] gap-3 rounded border border-border bg-background/60 p-3"><div className="text-live-orange">{icon}</div><div><p className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p><p className="font-mono text-sm text-foreground">{value}</p><p className="truncate text-xs text-muted-foreground">{helper}</p></div></div>; }
function StatusChip({ tone, children }: { tone: EnrichedResult["statusTone"]; children: React.ReactNode }) { return <span className={`font-condensed inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${tone === "leader" ? "bg-live-success/15 text-live-success" : tone === "chasing" ? "bg-live-warning/15 text-live-warning" : tone === "alert" ? "bg-tv-red/15 text-tv-red" : "bg-live-cyan/10 text-live-cyan"}`}>{children}</span>; }

function enrichResults(results: Result[]): EnrichedResult[] {
  return results.map((row, index) => {
    const seed = row.athlete_name.length + row.position * 7;
    const country = row.country?.trim().toUpperCase() || (index === 0 ? "BEL" : index === 1 ? "VE" : index === 2 ? "FRA" : "ESP");
    const statusTone = row.position === 1 ? "leader" : row.position === 2 ? "chasing" : row.gap?.includes("DNF") ? "alert" : "stable";
    return { ...row, country, dorsal: 10 + ((seed * 5) % 89), flag: flagFor(country), lastLap: `1:0${7 + (seed % 3)}.${String(200 + seed * 13).slice(0, 3)}`, statusLabel: row.position === 1 ? "Liderando" : row.position === 2 ? "Acechando" : statusTone === "alert" ? "Incidencia" : "Estable", statusTone, seasonBest: `1:0${7 + (seed % 2)}.${String(100 + seed * 17).slice(0, 3)}`, avgLap: `1:0${8 + (seed % 2)}.${String(300 + seed * 11).slice(0, 3)}`, consistency: [72 + seed % 20, 62 + seed % 28, 78 + seed % 17, 66 + seed % 25, 82 + seed % 12], positions: [Math.max(1, row.position + 2), Math.max(1, row.position + 1), row.position, Math.max(1, row.position - 1), row.position], speed: `${(41 + (seed % 18) / 10).toFixed(1)} km/h` };
  });
}
function makeTicker(rows: EnrichedResult[], race: Race | null, upcoming: Race[]): TickerItem[] { const now = new Date(); const time = (mins: number) => new Date(now.getTime() - mins * 60000).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }); return [{ id: "race", time: time(0), icon: "🏁", type: `VUELTA ${CURRENT_LAP}`, message: `${rows[0]?.athlete_name ?? "La carrera"} lidera ${race?.race_name ?? "la prueba actual"}`, tone: "cyan" }, { id: "sprint", time: time(4), icon: "⚡", type: "SPRINT INTERMEDIO", message: `${rows[0]?.athlete_name ?? "El líder"} marca ${rows[0]?.lastLap ?? "1:07.999"} (NEW PB!)`, tone: "warning" }, { id: "attack", time: time(7), icon: "🚀", type: "ATAQUE", message: rows[1] ? `${rows[1].athlete_name} cambia el ritmo del grupo perseguidor` : "Cambio de ritmo en cabeza", tone: "success" }, { id: "fall", time: time(11), icon: "🔴", type: "CAÍDA", message: rows[2] ? `${rows[2].athlete_name} pierde contacto en curva 3` : "Incidencia en curva 3", tone: "danger" }, ...upcoming.slice(0, 4).map((item, index) => ({ id: item.id, time: time(15 + index * 3), icon: "📅", type: "PRÓXIMA", message: `${item.race_name} · ${formatRaceTime(item.scheduled_time)}`, tone: "cyan" as const }))]; }
function makeStats(rows: EnrichedResult[]) { return { bestLap: rows[0]?.seasonBest ?? "1:07.234", avgSpeed: rows[0]?.speed ?? "42.5 km/h", maxSpeed: "48.2 km/h", leadChanges: String(Math.max(1, Math.min(7, rows.length - 1))), incidents: rows.some((row) => row.statusTone === "alert") ? "1" : "0" }; }
function sortValue(row: EnrichedResult, key: SortKey) { if (key === "position") return row.position; if (key === "gap") return parseFloat(row.gap?.replace("+", "") || "0"); return parseFloat((key === "time" ? row.time : row.lastLap)?.replace(":", "") || "0"); }
function flagFor(country?: string | null) { if (!country) return "🏳️"; return COUNTRY_FLAGS[country.toUpperCase()] ?? "🏳️"; }
function medal(position: number) { if (position === 1) return "🥇"; if (position === 2) return "🥈"; if (position === 3) return "🥉"; return ""; }
function formatRaceTime(iso: string) { return new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
