import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  ExternalLink,
  Play,
  Radio,
  Trophy,
  MapPin,
  Flag,
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { youTubeEmbedUrl, youTubeThumbnail } from "@/lib/youtube";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatTime as fmtTime, formatShortDate } from "@/lib/i18n/format";

type StreamRow = {
  id: string;
  title: string;
  embed_url: string | null;
  is_active: boolean;
  autoplay: boolean;
};

type ScheduleRow = {
  id: string;
  event_name: string;
  category: string | null;
  location: string | null;
  scheduled_at: string;
  status: "programada" | "en_curso" | "finalizada";
};

type ResultRow = {
  id: string;
  event_name: string;
  event_slug: string | null;
  race: string | null;
  category: string | null;
  position: number;
  athlete_name: string;
  club: string | null;
  country: string | null;
  race_time: string | null;
  status: "en_vivo" | "finalizado" | "proxima";
  sort_order: number;
  updated_at: string;
};

type FeaturedEvent = {
  slug: string;
  name: string;
  country: string | null;
  banner_url: string | null;
  event_date: string | null;
};

type EventCard = {
  id: string;
  slug: string;
  name: string;
  cover_url: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  status: "live" | "upcoming" | "finished";
  scope: string;
};

const FALLBACK_TITLE = "RollerZone Live Center";

type LiveCenterSettings = { bg_url: string; blur: number; pos_x: number; pos_y: number; scale: number };
const LC_DEFAULTS: LiveCenterSettings = { bg_url: "", blur: 8, pos_x: 50, pos_y: 50, scale: 108 };

export function LiveCenter() {
  const { t, lang } = useLanguage();
  const [streams, setStreams] = useState<StreamRow[]>([]);
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [featured, setFeatured] = useState<FeaturedEvent | null>(null);
  const [events, setEvents] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [bgCfg, setBgCfg] = useState<LiveCenterSettings>(LC_DEFAULTS);

  const stream = useMemo(
    () => streams.find((s) => s.id === selectedStreamId) ?? streams[0] ?? null,
    [streams, selectedStreamId]
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: featuredEvents } = await supabase
        .from("result_events")
        .select("slug, name, country, banner_url, event_date")
        .eq("published", true)
        .eq("featured_in_live_center", true)
        .order("sort_order", { ascending: true })
        .limit(1);
      const feat = (featuredEvents?.[0] as FeaturedEvent | undefined) ?? null;

      let resultsQuery = supabase
        .from("live_results")
        .select("id, event_name, event_slug, race, category, position, athlete_name, club, country, race_time, status, sort_order, updated_at")
        .eq("published", true);
      if (feat?.slug) resultsQuery = resultsQuery.eq("event_slug", feat.slug);

      const [streamRes, scheduleRes, resultsRes, eventsRes] = await Promise.all([
        supabase
          .from("live_stream")
          .select("id, title, embed_url, is_active, autoplay")
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(20),
        supabase
          .from("schedule_items")
          .select("id, event_name, category, location, scheduled_at, status")
          .eq("published", true)
          .order("scheduled_at", { ascending: true })
          .limit(20),
        resultsQuery
          .order("sort_order", { ascending: true })
          .order("position", { ascending: true })
          .limit(80),
        supabase
          .from("events")
          .select("id, slug, name, cover_url, start_date, end_date, location, status, scope")
          .eq("published", true)
          .gte("start_date", new Date().toISOString().slice(0, 10))
          .order("start_date", { ascending: true })
          .limit(12),
      ]);
      if (cancelled) return;
      setStreams((streamRes.data as StreamRow[]) ?? []);
      setSchedule((scheduleRes.data as ScheduleRow[]) ?? []);
      setResults((resultsRes.data as ResultRow[]) ?? []);
      setFeatured(feat);
      setEvents((eventsRes.data as EventCard[]) ?? []);
      setLoading(false);
    };

    load();
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "live_center_bg")
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.value) setBgCfg({ ...LC_DEFAULTS, ...(data.value as Partial<LiveCenterSettings>) });
      });
    const channel = supabase
      .channel("rollerzone-live-center")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_results" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "schedule_items" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_stream" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "result_events" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, load)
      .subscribe();
    const interval = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Group results by race
  const featuredGroup = useMemo(() => {
    const map = new Map<string, { title: string; slug: string; rows: ResultRow[] }>();
    for (const row of results) {
      const key = `${row.event_name}::${row.race ?? "General"}::${row.category ?? ""}`;
      if (!map.has(key)) {
        map.set(key, {
          title: [row.race, row.category].filter(Boolean).join(" · ") || row.event_name,
          slug: row.event_slug || slugify(row.event_name),
          rows: [],
        });
      }
      map.get(key)!.rows.push(row);
    }
    return Array.from(map.values()).sort((a, b) => statusPriority(a.rows) - statusPriority(b.rows));
  }, [results]);

  const liveGroup = featuredGroup.find((g) => g.rows.some((r) => r.status === "en_vivo")) ?? featuredGroup[0];
  const podium = useMemo(
    () => (liveGroup?.rows ?? []).slice().sort((a, b) => a.position - b.position).slice(0, 3),
    [liveGroup]
  );
  const remainingRows = useMemo(
    () => (liveGroup?.rows ?? []).slice().sort((a, b) => a.position - b.position).slice(3, 10),
    [liveGroup]
  );

  // Build live timeline from schedule + recent results
  const timeline = useMemo(() => buildTimeline(schedule, results, lang), [schedule, results, lang]);

  const isLiveBroadcast = !!stream?.is_active;
  const hasLiveRace = (liveGroup?.rows ?? []).some((r) => r.status === "en_vivo");

  if (!loading && streams.length === 0 && schedule.length === 0 && results.length === 0 && events.length === 0 && !featured) {
    return null;
  }

  const embed = getEmbedUrl(stream?.embed_url, stream?.autoplay);
  const eventSlug = featured?.slug ?? liveGroup?.slug;
  const heroImage = featured?.banner_url ?? null;
  const heroTitle = featured?.name ?? liveGroup?.title ?? FALLBACK_TITLE;
  const currentRaceLabel = liveGroup ? liveGroup.title : null;

  return (
    <section
      id="en-directo"
      className="relative overflow-hidden border-b border-border"
      style={{ backgroundColor: "#0B0B0B" }}
    >
      {/* Background photo (configurable) */}
      {bgCfg.bg_url && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <img
            src={bgCfg.bg_url}
            alt=""
            className="h-full w-full object-cover opacity-60"
            style={{
              filter: `blur(${Math.max(0, Math.min(40, bgCfg.blur))}px)`,
              transform: `scale(${Math.max(1, Math.min(3, (bgCfg.scale ?? 108) / 100))})`,
              objectPosition: `${bgCfg.pos_x ?? 50}% ${bgCfg.pos_y ?? 50}%`,
            }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
        </div>
      )}
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true" />
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(212,160,23,0.22), transparent 70%)" }}
        aria-hidden
      />
      {/* Secondary warm glow bottom-right */}
      <div
        className="pointer-events-none absolute -bottom-40 right-0 h-[420px] w-[700px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(232,184,32,0.10), transparent 70%)" }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-16">
        {/* ─── HERO LIVE ─── */}
        <HeroLive
          t={t}
          lang={lang}
          image={heroImage}
          title={heroTitle}
          country={featured?.country}
          eventDate={featured?.event_date}
          currentRace={currentRaceLabel}
          isLive={hasLiveRace || isLiveBroadcast}
          eventSlug={eventSlug}
          loading={loading}
        />

        {/* ─── PODIUM RESULTS + TIMELINE ─── */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <PodiumBlock
            t={t}
            podium={podium}
            remaining={remainingRows}
            raceTitle={liveGroup?.title ?? null}
            isLive={hasLiveRace}
            loading={loading}
            eventSlug={eventSlug}
          />
          <TimelineBlock t={t} items={timeline} loading={loading} />
        </div>

        {/* ─── ROLLERZONE TV ─── */}
        <div className="mt-10">
          <SectionHeader
            tag={t("liveCenter.broadcast")}
            title="RollerZone TV"
            isLive={isLiveBroadcast}
            t={t}
          />
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <MainTvPlayer
              embed={embed}
              isLive={isLiveBroadcast}
              title={stream?.title}
              t={t}
            />
            <TvSidebar
              streams={streams}
              selectedId={stream?.id ?? null}
              onSelect={setSelectedStreamId}
              t={t}
            />
          </div>
        </div>

        {/* ─── EVENTS CAROUSEL ─── */}
        {events.length > 0 && (
          <div className="mt-12">
            <SectionHeader
              tag={t("liveCenter.eventsTitle")}
              title={t("liveCenter.eventsTitle")}
              t={t}
              cta={
                <Link
                  to="/eventos"
                  className="font-condensed inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[2.5px] text-gold transition-colors hover:text-gold-light"
                >
                  {t("liveCenter.eventsAll")} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <EventsCarousel events={events} lang={lang} t={t} />
          </div>
        )}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   HERO LIVE
   ════════════════════════════════════════════════════════════════ */
function HeroLive({
  t,
  lang,
  image,
  title,
  country,
  eventDate,
  currentRace,
  isLive,
  eventSlug,
  loading,
}: {
  t: (k: string) => string;
  lang: "es" | "en";
  image: string | null;
  title: string;
  country?: string | null;
  eventDate?: string | null;
  currentRace?: string | null;
  isLive: boolean;
  eventSlug?: string | null;
  loading: boolean;
}) {
  if (loading) {
    return <div className="h-[360px] animate-pulse rounded-2xl border border-border bg-surface md:h-[440px]" />;
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border shadow-2xl">
      {/* Background image */}
      <div className="absolute inset-0">
        {image ? (
          <img
            src={image}
            alt={title}
            className="hero-zoom h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-surface via-background to-surface-2 hero-grid-bg" />
        )}
      </div>

      {/* Premium overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[360px] flex-col justify-end gap-4 p-6 md:min-h-[440px] md:p-10">
        <div className="flex flex-wrap items-center gap-2">
          {isLive ? (
            <span className="live-red-tag font-condensed inline-flex items-center gap-2 rounded-sm bg-tv-red px-3 py-1.5 text-[11px] font-bold uppercase tracking-[3px] text-white shadow-lg">
              <span className="live-dot-fast inline-block h-1.5 w-1.5 rounded-full bg-white" />
              {t("liveCenter.liveNow")}
            </span>
          ) : (
            <span className="font-condensed inline-flex items-center gap-2 rounded-sm border border-gold/50 bg-black/40 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[3px] text-gold backdrop-blur">
              <Activity className="h-3 w-3" />
              {t("liveCenter.featuredEvent")}
            </span>
          )}
          <span className="font-condensed text-[10px] uppercase tracking-[3px] text-foreground/60">
            {t("liveCenter.heroTagline")}
          </span>
        </div>

        <h2 className="font-display text-3xl uppercase leading-[0.95] tracking-wide text-foreground drop-shadow-lg sm:text-4xl md:text-6xl">
          {title}
        </h2>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-foreground/85">
          {country && (
            <span className="font-condensed inline-flex items-center gap-1.5 uppercase tracking-widest">
              <Flag className="h-3.5 w-3.5 text-gold" /> {country}
            </span>
          )}
          {eventDate && (
            <span className="font-condensed inline-flex items-center gap-1.5 uppercase tracking-widest">
              <CalendarClock className="h-3.5 w-3.5 text-gold" /> {formatShortDate(eventDate, lang)}
            </span>
          )}
          {currentRace && (
            <span className="font-condensed inline-flex items-center gap-1.5 uppercase tracking-widest">
              <Zap className="h-3.5 w-3.5 text-gold" /> {currentRace}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-3">
          {eventSlug && (
            <Link
              to="/resultados/$evento"
              params={{ evento: eventSlug }}
              className="font-condensed inline-flex items-center gap-2 rounded-md bg-gold px-5 py-3 text-xs font-bold uppercase tracking-[2.5px] text-background shadow-lg transition-all hover:bg-gold-light hover:shadow-[0_0_30px_rgba(212,160,23,0.4)]"
            >
              <Trophy className="h-4 w-4" /> {t("liveCenter.watchResults")}
            </Link>
          )}
          <a
            href="#rollerzone-tv"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("rollerzone-tv")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="font-condensed inline-flex items-center gap-2 rounded-md border border-foreground/30 bg-black/40 px-5 py-3 text-xs font-bold uppercase tracking-[2.5px] text-foreground backdrop-blur transition-all hover:border-tv-red hover:text-tv-red"
          >
            <Play className="h-4 w-4" /> {t("liveCenter.watchStreaming")}
          </a>
        </div>
      </div>

      {/* Decorative bottom accent */}
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PODIUM
   ════════════════════════════════════════════════════════════════ */
function PodiumBlock({
  t,
  podium,
  remaining,
  raceTitle,
  isLive,
  loading,
  eventSlug,
}: {
  t: (k: string) => string;
  podium: ResultRow[];
  remaining: ResultRow[];
  raceTitle: string | null;
  isLive: boolean;
  loading: boolean;
  eventSlug?: string | null;
}) {
  return (
    <div>
      <SectionHeader
        tag={t("liveCenter.podium")}
        title={raceTitle ?? t("liveCenter.podium")}
        t={t}
        isLive={isLive}
        cta={
          eventSlug && (
            <Link
              to="/resultados/$evento"
              params={{ evento: eventSlug }}
              className="font-condensed inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[2.5px] text-gold transition-colors hover:text-gold-light"
            >
              {t("liveCenter.fullResults")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )
        }
      />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
          ))}
        </div>
      ) : podium.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface/50 p-10 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-gold/60" />
          <p className="font-display text-lg uppercase tracking-widest">{t("liveCenter.noResults")}</p>
          <p className="font-condensed mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            {t("liveCenter.noResultsDesc")}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {podium.map((row) => (
              <PodiumCard key={row.id} row={row} t={t} />
            ))}
          </div>

          {remaining.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface/60 backdrop-blur">
              <ul className="divide-y divide-border">
                {remaining.map((row) => (
                  <li
                    key={row.id}
                    className="grid grid-cols-[40px_1fr_auto] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gold/5"
                  >
                    <span className="font-mono text-sm font-bold text-foreground/60">
                      {row.position}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {row.athlete_name}
                      </div>
                      {(row.club || row.country) && (
                        <div className="font-condensed truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                          {[row.country, row.club].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-xs text-foreground/80">
                      {row.race_time || "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PodiumCard({ row, t }: { row: ResultRow; t: (k: string) => string }) {
  const medal = ["🥇", "🥈", "🥉"][row.position - 1] ?? "🏅";
  const accent =
    row.position === 1
      ? "from-gold/40 via-gold/10 to-transparent border-gold"
      : row.position === 2
      ? "from-foreground/20 via-foreground/5 to-transparent border-foreground/40"
      : "from-amber-700/30 via-amber-700/5 to-transparent border-amber-700/50";
  const heightCls = row.position === 1 ? "sm:translate-y-0" : "sm:translate-y-3";
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-gradient-to-b p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(212,160,23,0.35)] ${accent} ${heightCls}`}
    >
      {row.status === "en_vivo" && (
        <span className="live-red-tag font-condensed absolute right-3 top-3 inline-flex items-center gap-1 rounded-sm bg-tv-red px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[2px] text-white">
          <span className="live-dot-fast h-1 w-1 rounded-full bg-white" /> Live
        </span>
      )}
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-display text-4xl leading-none text-foreground">#{row.position}</span>
        <span className="text-2xl">{medal}</span>
      </div>
      <h3 className="font-display truncate text-lg uppercase tracking-wide text-foreground">
        {row.athlete_name}
      </h3>
      {(row.club || row.country) && (
        <p className="font-condensed mt-0.5 truncate text-[11px] uppercase tracking-widest text-muted-foreground">
          {[row.country, row.club].filter(Boolean).join(" · ")}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2">
        <span className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">
          {t("liveCenter.raceTime")}
        </span>
        <span className="font-mono text-base font-bold text-gold">{row.race_time || "—"}</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TIMELINE
   ════════════════════════════════════════════════════════════════ */
type TimelineItem = {
  id: string;
  time: string;
  title: string;
  subtitle?: string;
  kind: "live" | "result" | "schedule" | "info";
};

function buildTimeline(schedule: ScheduleRow[], results: ResultRow[], lang: "es" | "en"): TimelineItem[] {
  const items: TimelineItem[] = [];

  // Live races from schedule
  schedule
    .filter((s) => s.status === "en_curso")
    .forEach((s) =>
      items.push({
        id: `s-${s.id}`,
        time: fmtTime(s.scheduled_at, lang),
        title: s.event_name,
        subtitle: [s.category, s.location].filter(Boolean).join(" · ") || undefined,
        kind: "live",
      })
    );

  // Recent winners
  results
    .filter((r) => r.position === 1 && r.status === "finalizado")
    .slice(0, 5)
    .forEach((r) =>
      items.push({
        id: `w-${r.id}`,
        time: lang === "es" ? "Final" : "Final",
        title:
          lang === "es"
            ? `🏆 Victoria de ${r.athlete_name}`
            : `🏆 ${r.athlete_name} wins`,
        subtitle: [r.race, r.category].filter(Boolean).join(" · ") || r.event_name,
        kind: "result",
      })
    );

  // Upcoming
  schedule
    .filter((s) => s.status === "programada")
    .slice(0, 5)
    .forEach((s) =>
      items.push({
        id: `u-${s.id}`,
        time: fmtTime(s.scheduled_at, lang),
        title: s.event_name,
        subtitle: [s.category, s.location].filter(Boolean).join(" · ") || undefined,
        kind: "schedule",
      })
    );

  return items.slice(0, 10);
}

function TimelineBlock({
  t,
  items,
  loading,
}: {
  t: (k: string) => string;
  items: TimelineItem[];
  loading: boolean;
}) {
  return (
    <div>
      <SectionHeader tag={t("liveCenter.timeline")} title={t("liveCenter.timeline")} t={t} compact />
      <div className="rounded-xl border border-border bg-surface/60 p-4 backdrop-blur">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-surface-2" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="font-condensed py-10 text-center text-[11px] uppercase tracking-widest text-muted-foreground">
            {t("liveCenter.timelineEmpty")}
          </p>
        ) : (
          <ul className="relative space-y-1 before:absolute before:left-[18px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
            {items.map((item) => (
              <TimelineEntry key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TimelineEntry({ item }: { item: TimelineItem }) {
  const dotClass =
    item.kind === "live"
      ? "bg-tv-red live-dot-fast shadow-[0_0_12px_rgba(255,0,0,0.6)]"
      : item.kind === "result"
      ? "bg-gold shadow-[0_0_10px_rgba(212,160,23,0.5)]"
      : item.kind === "schedule"
      ? "bg-foreground/40"
      : "bg-muted-foreground";
  return (
    <li className="relative flex gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gold/5">
      <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
          <span className="font-mono text-[10px] uppercase tracking-widest text-gold">
            {item.time}
          </span>
        </div>
        {item.subtitle && (
          <p className="font-condensed truncate text-[10px] uppercase tracking-widest text-muted-foreground">
            {item.subtitle}
          </p>
        )}
      </div>
    </li>
  );
}

/* ════════════════════════════════════════════════════════════════
   ROLLERZONE TV
   ════════════════════════════════════════════════════════════════ */
function MainTvPlayer({
  embed,
  isLive,
  title,
  t,
}: {
  embed: ReturnType<typeof getEmbedUrl>;
  isLive: boolean;
  title?: string;
  t: (k: string) => string;
}) {
  return (
    <div
      id="rollerzone-tv"
      className="group relative overflow-hidden rounded-xl border border-border bg-black shadow-2xl"
    >
      {isLive && (
        <div className="pointer-events-none absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-sm bg-tv-red px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-white live-red-tag shadow-lg">
          <span className="live-dot-fast h-1.5 w-1.5 rounded-full bg-white" /> LIVE
        </div>
      )}
      {title && (
        <div className="pointer-events-none absolute right-3 top-3 z-20 max-w-[60%] truncate rounded-sm border border-gold/40 bg-black/60 px-2 py-1 text-[10px] font-condensed uppercase tracking-widest text-gold backdrop-blur">
          {title}
        </div>
      )}
      <div className="relative aspect-video">
        {embed?.type === "iframe" ? (
          <iframe
            src={embed.src}
            title="RollerZone TV"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        ) : embed?.type === "link" ? (
          <a
            href={embed.href}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex h-full flex-col items-center justify-center gap-3 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gold text-background play-pulse transition-transform group-hover:scale-110">
              <Play className="h-9 w-9 fill-background" />
            </div>
            <span className="font-condensed relative z-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
              <ExternalLink className="h-4 w-4" /> {t("liveCenter.openExternal")}
            </span>
          </a>
        ) : (
          <div className="relative flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="absolute inset-0 hero-grid-bg opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold/60 bg-black/60 text-gold backdrop-blur play-pulse">
              <Play className="h-9 w-9" />
            </div>
            <p className="font-condensed relative z-10 text-xs font-bold uppercase tracking-widest text-foreground">
              {t("liveCenter.noBroadcast")}
            </p>
            <p className="relative z-10 max-w-xs text-xs text-foreground/60">
              {t("liveCenter.noBroadcastDesc")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TvSidebar({
  streams,
  selectedId,
  onSelect,
  t,
}: {
  streams: StreamRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  t: (k: string) => string;
}) {
  if (streams.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-surface/60 p-8 text-center backdrop-blur">
        <div>
          <Radio className="mx-auto mb-3 h-8 w-8 text-gold/60" />
          <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
            {t("liveCenter.noBroadcastDesc")}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {streams.slice(0, 4).map((s) => {
        const thumb = youTubeThumbnail(s.embed_url);
        const active = s.id === selectedId;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={`group relative flex w-full gap-3 overflow-hidden rounded-lg border bg-surface/60 p-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${
              active ? "border-gold gold-glow-soft" : "border-border hover:border-gold/60"
            }`}
          >
            <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded bg-black">
              {thumb ? (
                <img
                  src={thumb}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-surface-2 to-background" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <Play className="h-6 w-6 fill-white text-white" />
              </div>
              {s.is_active && (
                <span className="live-red-tag absolute left-1 top-1 inline-flex items-center gap-1 rounded-sm bg-tv-red px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                  <span className="live-dot-fast h-1 w-1 rounded-full bg-white" /> Live
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 py-0.5">
              <h4 className="font-display line-clamp-2 text-sm uppercase leading-tight tracking-wide text-foreground group-hover:text-gold">
                {s.title}
              </h4>
              <p className="font-condensed mt-1 text-[9px] uppercase tracking-widest text-muted-foreground">
                {s.is_active ? t("common.live") : t("common.upcoming")}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   EVENTS CAROUSEL
   ════════════════════════════════════════════════════════════════ */
function EventsCarousel({
  events,
  lang,
  t,
}: {
  events: EventCard[];
  lang: "es" | "en";
  t: (k: string) => string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const update = () => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  const scroll = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="Anterior"
        className={`absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition-all hover:border-gold hover:text-gold sm:flex ${
          canPrev ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label="Siguiente"
        className={`absolute right-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition-all hover:border-gold hover:text-gold sm:flex ${
          canNext ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <div
        ref={(el) => {
          ref.current = el;
          if (el) requestAnimationFrame(update);
        }}
        onScroll={update}
        className="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6"
      >
        {events.map((ev) => (
          <EventPosterCard key={ev.id} event={ev} lang={lang} t={t} />
        ))}
      </div>
    </div>
  );
}

function EventPosterCard({
  event,
  lang,
  t,
}: {
  event: EventCard;
  lang: "es" | "en";
  t: (k: string) => string;
}) {
  const statusInfo =
    event.status === "live"
      ? { label: t("common.live"), cls: "bg-tv-red text-white live-red-tag" }
      : event.status === "finished"
      ? { label: t("liveCenter.finalLabel"), cls: "bg-foreground/20 text-foreground/70 border border-border" }
      : { label: t("liveCenter.upcomingLabel"), cls: "bg-gold/15 text-gold border border-gold/40" };

  return (
    <Link
      to="/eventos/$slug"
      params={{ slug: event.slug }}
      className="group relative w-[260px] shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-surface shadow-lg transition-all hover:-translate-y-1 hover:border-gold hover:shadow-[0_25px_50px_-20px_rgba(212,160,23,0.4)] sm:w-[300px]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-black">
        {event.cover_url ? (
          <img
            src={event.cover_url}
            alt={event.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-surface-2 to-background hero-grid-bg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

        <div className={`font-condensed absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-[2.5px] ${statusInfo.cls}`}>
          {event.status === "live" && (
            <span className="live-dot-fast h-1.5 w-1.5 rounded-full bg-white" />
          )}
          {statusInfo.label}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-display line-clamp-2 text-lg uppercase leading-tight tracking-wide text-foreground drop-shadow-md">
            {event.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-foreground/85">
            <span className="font-condensed inline-flex items-center gap-1 uppercase tracking-widest">
              <Clock className="h-3 w-3 text-gold" />
              {formatShortDate(event.start_date, lang)}
            </span>
            {event.location && (
              <span className="font-condensed inline-flex items-center gap-1 uppercase tracking-widest">
                <MapPin className="h-3 w-3 text-gold" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHARED HEADER
   ════════════════════════════════════════════════════════════════ */
function SectionHeader({
  tag,
  title,
  t,
  isLive,
  cta,
  compact,
}: {
  tag: string;
  title: string;
  t: (k: string) => string;
  isLive?: boolean;
  cta?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3 ${compact ? "" : ""}`}>
      <div>
        <div className="font-condensed inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[3px] text-gold">
          <span className="h-px w-6 bg-gold" />
          {tag}
          {isLive && (
            <span className="live-red-tag inline-flex items-center gap-1 rounded-sm bg-tv-red px-1.5 py-0.5 text-[9px] tracking-wider text-white">
              <span className="live-dot-fast h-1 w-1 rounded-full bg-white" /> LIVE
            </span>
          )}
        </div>
        <h3 className={`font-display mt-1 uppercase tracking-wide text-foreground ${compact ? "text-xl" : "text-2xl md:text-3xl"}`}>
          {title}
        </h3>
      </div>
      {cta}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════ */
function getEmbedUrl(
  value: string | null | undefined,
  autoplay?: boolean,
): { type: "iframe"; src: string } | { type: "link"; href: string } | null {
  if (!value?.trim()) return null;
  const raw = value.trim();
  const iframeSrc = raw.match(/src=["']([^"']+)["']/i)?.[1];
  const source = iframeSrc || raw;
  const youtube = youTubeEmbedUrl(source, { autoplay });
  if (youtube) return { type: "iframe", src: youtube };
  try {
    const url = new URL(source);
    if (url.hostname.includes("twitch.tv")) {
      const path = url.pathname.split("/").filter(Boolean);
      const parent =
        typeof window !== "undefined" ? window.location.hostname : "rollerzone.lovable.app";
      if (path[0] === "videos" && path[1])
        return { type: "iframe", src: `https://player.twitch.tv/?video=${path[1]}&parent=${parent}` };
      if (path[0])
        return { type: "iframe", src: `https://player.twitch.tv/?channel=${path[0]}&parent=${parent}` };
    }
    if (url.pathname.includes("/embed") || iframeSrc) return { type: "iframe", src: source };
    return { type: "link", href: source };
  } catch {
    return null;
  }
}

function statusPriority(rows: ResultRow[]) {
  if (rows.some((row) => row.status === "en_vivo")) return 0;
  if (rows.some((row) => row.status === "proxima")) return 1;
  return 2;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}
