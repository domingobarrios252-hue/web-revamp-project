import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Eye, Calendar, User as UserIcon, ArrowRight, Trophy, Mic, MapPin, BookOpen, Heart, ExternalLink, UsersRound, Radio, Play, Clock, Medal, Flame, Instagram, Facebook } from "lucide-react";
import { youTubeEmbedUrl } from "@/lib/youtube";
import { Ticker } from "@/components/site/Ticker";
import { AdBannerWithMagazine } from "@/components/site/AdBannerWithMagazine";
import { LiveResultsTable } from "@/components/site/LiveResultsTable";
import { supabase } from "@/integrations/supabase/client";

type MvpPreview = {
  id: string;
  full_name: string;
  photo_url: string | null;
  club: string | null;
  region: string | null;
  tier: "elite" | "estrella" | "promesa";
  gender: "masculino" | "femenino";
  position: number;
};

type News = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  author: string;
  legacy_tag: string | null;
  image_url: string | null;
  read_minutes: number | null;
  featured: boolean;
  views_count: number;
  published_at: string;
  news_categories: { name: string; slug: string; scope: string } | null;
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RollerZone — Patinaje de Velocidad" },
      {
        name: "description",
        content:
          "Inicio de RollerZone: lo último del patinaje de velocidad — noticias, eventos, ranking, entrevistas y revista.",
      },
      { property: "og:title", content: "RollerZone — Patinaje de Velocidad" },
      {
        property: "og:description",
        content:
          "Inicio de RollerZone: lo último del patinaje de velocidad — noticias, eventos, ranking, entrevistas y revista.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [news, setNews] = useState<News[] | null>(null);
  const [liveActive, setLiveActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("news")
      .select(
        "id, title, slug, excerpt, author, legacy_tag, image_url, read_minutes, featured, views_count, published_at, news_categories(name, slug, scope)"
      )
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (!cancelled) setNews((data as unknown as News[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Determinar si hay directo activo para mostrar/ocultar el botón "Seguir en directo"
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: tvData }, { data: lrData }] = await Promise.all([
        supabase
          .from("tv_settings")
          .select("live_stream_url, live_starts_at, live_ends_at")
          .limit(1)
          .maybeSingle(),
        supabase
          .from("live_results")
          .select("id")
          .eq("published", true)
          .eq("status", "en_vivo")
          .limit(1),
      ]);
      if (cancelled) return;
      const now = Date.now();
      const hasStreamUrl = !!tvData?.live_stream_url?.trim();
      const startsAt = tvData?.live_starts_at ? new Date(tvData.live_starts_at).getTime() : null;
      const endsAt = tvData?.live_ends_at ? new Date(tvData.live_ends_at).getTime() : null;
      const isStreamLive =
        hasStreamUrl &&
        (startsAt === null || now >= startsAt) &&
        (endsAt === null || now <= endsAt);
      const hasLiveResults = (lrData?.length ?? 0) > 0;
      setLiveActive(isStreamLive || hasLiveResults);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = news?.find((n) => n.featured) ?? news?.[0];
  const rest = news?.filter((n) => n.id !== featured?.id) ?? [];
  const bigSecondary = rest[0];
  const smallList = rest.slice(1, 5);

  return (
    <>
      {/* HERO — full bleed, sport TV style (compacto, ~50% más bajo) */}
      <section className="relative w-full overflow-hidden bg-background">
        {featured?.image_url ? (
          <img
            src={featured.image_url}
            alt={featured.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="hero-grid-bg absolute inset-0" />
        )}
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        <div className="font-display pointer-events-none absolute right-[3%] top-1/2 hidden -translate-y-1/2 select-none text-[clamp(110px,12vw,180px)] leading-none tracking-tighter text-gold/[.06] md:block">
          01
        </div>

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-end px-5 pb-5 pt-10 md:px-10 md:pb-6 md:pt-14">
          <div className="max-w-3xl">
            {featured?.featured && (
              <div className="live-red-tag font-condensed mb-2.5 inline-flex w-fit items-center gap-2 bg-tv-red px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-white">
                <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
                En Vivo · Destacada
              </div>
            )}
            {featured?.news_categories?.name && (
              <div className="font-condensed mb-1.5 text-[11px] uppercase tracking-[4px] text-gold">
                {featured.news_categories.name}
              </div>
            )}
            <h1 className="font-display text-[clamp(26px,4.2vw,48px)] uppercase leading-[1] tracking-wider text-foreground">
              {featured?.title ?? "RollerZone"}
            </h1>
            {featured?.excerpt && (
              <p className="clamp-2 mt-2.5 max-w-2xl text-sm text-foreground/80 md:text-[15px]">
                {featured.excerpt}
              </p>
            )}
            <div className="font-condensed mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              {featured?.author && (
                <span className="flex items-center gap-1.5">
                  <UserIcon className="h-3 w-3" /> {featured.author}
                </span>
              )}
              {featured?.published_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {new Date(featured.published_at).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
              {typeof featured?.views_count === "number" && (
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3 w-3" /> {featured.views_count}
                </span>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              {featured && (
                <Link
                  to="/noticias/articulo/$slug"
                  params={{ slug: featured.slug }}
                  className="font-condensed inline-flex items-center justify-center gap-2 bg-gold px-5 py-2.5 text-[11px] font-bold uppercase tracking-[2.5px] text-background transition-colors hover:bg-gold-dark"
                >
                  Leer cobertura completa <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
              {liveActive && (
                <Link
                  to="/tv"
                  className="font-condensed inline-flex items-center justify-center gap-2 border border-foreground/30 bg-background/40 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[2.5px] text-foreground backdrop-blur-sm transition-colors hover:border-gold hover:text-gold"
                >
                  <Radio className="h-3.5 w-3.5" /> Seguir en directo
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <Ticker />

      <AdBannerWithMagazine placement="home_top" />

      <LiveNowSection />


      {/* ÚLTIMAS NOTICIAS — ESPN style */}
      <section id="noticias" className="mx-auto max-w-7xl px-5 py-12 md:px-6">
        <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
          <h2 className="font-display text-2xl tracking-widest md:text-3xl">
            Últimas <span className="text-gold">noticias</span>
          </h2>
          <Link
            to="/noticias"
            className="font-condensed text-xs font-bold uppercase tracking-widest text-gold hover:text-gold-dark"
          >
            Ver todas →
          </Link>
        </div>

        {news === null ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-[420px] animate-pulse bg-surface" />
            <div className="grid grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[200px] animate-pulse bg-surface" />
              ))}
            </div>
          </div>
        ) : rest.length === 0 ? (
          <p className="text-muted-foreground">No hay noticias publicadas aún.</p>
        ) : (
          <>
            <div className="hidden gap-5 lg:grid lg:grid-cols-2">
              {bigSecondary && <BigNewsCard news={bigSecondary} />}
              <div className="grid grid-cols-2 gap-4">
                {smallList.map((n) => (
                  <SmallNewsCard key={n.id} news={n} />
                ))}
              </div>
            </div>

            <div className="hide-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 pb-2 lg:hidden">
              {rest.slice(0, 6).map((n) => (
                <div key={n.id} className="w-[78%] shrink-0 sm:w-[48%]">
                  <SmallNewsCard news={n} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <MostReadAndSocialSection />

      <FeaturedAthletesSection />
      <RankingPreviewSection />
      <InterviewsPreviewSection />
      <EventsPreviewSection />
      <MagazinePreviewSection />
      <SponsorsCarouselSection />
      <TeamSection />
    </>
  );
}

/* ===================== LIVE NOW ===================== */

type TvSettings = {
  live_title: string;
  live_subtitle: string | null;
  live_stream_url: string | null;
  live_starts_at: string | null;
  live_ends_at: string | null;
};

type LiveResult = {
  id: string;
  event_name: string;
  category: string | null;
  status: "en_vivo" | "finalizado";
  sort_order: number;
  updated_at: string;
};

type ScheduleItem = {
  id: string;
  event_name: string;
  category: string | null;
  location: string | null;
  scheduled_at: string;
  status: "programada" | "en_curso" | "finalizada";
  sort_order: number;
};

type MedalRow = {
  id: string;
  country_name: string;
  country_code: string | null;
  flag_url: string | null;
  gold: number;
  silver: number;
  bronze: number;
  sort_order: number;
};

function LiveNowSection() {
  const [tv, setTv] = useState<TvSettings | null>(null);
  const [results, setResults] = useState<LiveResult[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [medals, setMedals] = useState<MedalRow[]>([]);
  const [showMedals, setShowMedals] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: tvData }, { data: lrData }, { data: schedData }, { data: medalData }, { data: settingData }] = await Promise.all([
        supabase
          .from("tv_settings")
          .select("live_title, live_subtitle, live_stream_url, live_starts_at, live_ends_at")
          .limit(1)
          .maybeSingle(),
        supabase
          .from("live_results")
          .select("id, event_name, category, status, sort_order, updated_at")
          .eq("published", true)
          .order("sort_order", { ascending: true })
          .order("updated_at", { ascending: false })
          .limit(8),
        supabase
          .from("schedule_items")
          .select("id, event_name, category, location, scheduled_at, status, sort_order")
          .eq("published", true)
          .neq("status", "finalizada")
          .order("scheduled_at", { ascending: true })
          .limit(6),
        supabase
          .from("medal_standings")
          .select("id, country_name, country_code, flag_url, gold, silver, bronze, sort_order")
          .eq("published", true)
          .order("gold", { ascending: false })
          .order("silver", { ascending: false })
          .order("bronze", { ascending: false })
          .limit(6),
        supabase
          .from("site_settings")
          .select("value")
          .eq("key", "home_medals_enabled")
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setTv((tvData as TvSettings) ?? null);
      setResults((lrData as LiveResult[]) ?? []);
      setSchedule((schedData as ScheduleItem[]) ?? []);
      setMedals((medalData as MedalRow[]) ?? []);
      const settingValue = settingData?.value as { enabled?: boolean } | null;
      if (settingValue && typeof settingValue.enabled === "boolean") {
        setShowMedals(settingValue.enabled);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) return null;

  const now = Date.now();
  const hasStreamUrl = !!tv?.live_stream_url?.trim();
  const startsAt = tv?.live_starts_at ? new Date(tv.live_starts_at).getTime() : null;
  const endsAt = tv?.live_ends_at ? new Date(tv.live_ends_at).getTime() : null;
  const isStreamLive =
    hasStreamUrl &&
    (startsAt === null || now >= startsAt) &&
    (endsAt === null || now <= endsAt);

  const liveResults = results.filter((r) => r.status === "en_vivo");
  const embedUrl = hasStreamUrl ? youTubeEmbedUrl(tv!.live_stream_url!) : null;

  const medalsVisible = showMedals && medals.length > 0;

  // Ocultar bloque solo si no hay nada que mostrar
  if (!hasStreamUrl && liveResults.length === 0 && schedule.length === 0 && !medalsVisible) {
    return null;
  }

  return (
    <section className="border-y-2 border-tv-red/40 bg-gradient-to-br from-background via-surface to-background">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-6 md:py-14">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <div className="live-red-tag font-condensed inline-flex items-center gap-2 bg-tv-red px-3 py-1.5 text-[11px] font-bold uppercase tracking-[3px] text-white">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
              En directo ahora
            </div>
            <h2 className="font-display text-2xl uppercase tracking-widest md:text-3xl">
              {tv?.live_title ?? "Cobertura en vivo"}
            </h2>
          </div>
          <Link
            to="/tv"
            className="font-condensed text-xs font-bold uppercase tracking-widest text-gold hover:text-gold-dark"
          >
            Ir a RollerZone TV →
          </Link>
        </div>

        {/* 3-col grid: TV (4) | Próximas pruebas (4) | Resultados en vivo (4) — misma altura y tipografía */}
        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {/* COL 1 — TV embed + descripción */}
          <div className="flex h-full min-w-0 flex-col">
            <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-display text-sm uppercase tracking-widest text-foreground">
                RollerZone TV
              </h3>
              <Radio className="h-3.5 w-3.5 text-tv-red" />
            </div>
            <div className="relative aspect-video w-full overflow-hidden border border-border bg-black">
              {isStreamLive && embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={tv?.live_title ?? "Directo"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              ) : (
                <div className="hero-grid-bg absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Radio className="mx-auto h-9 w-9 text-tv-red/60" />
                    <p className="font-condensed mt-2 text-[11px] uppercase tracking-[3px] text-muted-foreground">
                      {hasStreamUrl
                        ? startsAt && now < startsAt
                          ? "Próxima emisión programada"
                          : "Sin emisión activa"
                        : "Sin emisión activa"}
                    </p>
                  </div>
                </div>
              )}
              {isStreamLive && (
                <span className="live-red-tag font-condensed absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1.5 bg-tv-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2.5px] text-white shadow-lg">
                  <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
                  Live
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-1 flex-col">
              <div className="font-display text-sm uppercase leading-tight tracking-wider text-foreground">
                {tv?.live_title ?? "Cobertura en vivo"}
              </div>
              {tv?.live_subtitle && (
                <p className="font-condensed mt-1 line-clamp-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                  {tv.live_subtitle}
                </p>
              )}
              {tv?.live_starts_at && (
                <div className="font-condensed mt-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gold">
                  <Calendar className="h-3 w-3" />
                  {new Date(tv.live_starts_at).toLocaleString("es-ES", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
              {liveResults.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {liveResults.slice(0, 3).map((r) => (
                    <span
                      key={r.id}
                      className="font-condensed inline-flex items-center gap-1 border border-tv-red/40 bg-tv-red/10 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-foreground"
                    >
                      <span className="live-dot inline-block h-1 w-1 rounded-full bg-tv-red" />
                      {r.event_name}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-3">
                {isStreamLive ? (
                  <Link
                    to="/tv"
                    className="font-condensed inline-flex w-full items-center justify-center gap-2 bg-tv-red px-4 py-2.5 text-[11px] font-bold uppercase tracking-[2.5px] text-white transition-colors hover:bg-tv-red-dark"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" /> Ver en directo
                  </Link>
                ) : hasStreamUrl ? (
                  <Link
                    to="/tv"
                    className="font-condensed inline-flex w-full items-center justify-center gap-2 border border-tv-red/60 bg-transparent px-4 py-2.5 text-[11px] font-bold uppercase tracking-[2.5px] text-tv-red transition-colors hover:bg-tv-red hover:text-white"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {startsAt && now < startsAt ? "Próxima emisión" : "Ver últimas emisiones"}
                  </Link>
                ) : (
                  <Link
                    to="/tv"
                    className="font-condensed inline-flex w-full items-center justify-center gap-2 border border-border bg-transparent px-4 py-2.5 text-[11px] font-bold uppercase tracking-[2.5px] text-muted-foreground transition-colors hover:border-gold hover:text-gold"
                  >
                    Ir a RollerZone TV
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* COL 2 — Próximas pruebas */}
          <div className="flex h-full min-w-0 flex-col">
            <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-display text-sm uppercase tracking-widest text-foreground">
                Próximas pruebas
              </h3>
              <Clock className="h-3.5 w-3.5 text-gold" />
            </div>
            {schedule.length === 0 ? (
              <div className="flex flex-1 items-center justify-center border border-border bg-background/50 p-4">
                <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                  Sin pruebas programadas
                </p>
              </div>
            ) : (
              <div className="flex flex-1 flex-col border border-border bg-background/50">
                <ul className="flex-1 divide-y divide-border">
                  {schedule.slice(0, 4).map((s) => {
                    const dt = new Date(s.scheduled_at);
                    const isLive = s.status === "en_curso";
                    return (
                      <li
                        key={s.id}
                        className="font-condensed flex items-start gap-2.5 px-2.5 py-2.5"
                      >
                        <div className="flex shrink-0 flex-col items-center justify-center border border-border bg-surface px-1.5 py-1 leading-none">
                          <span className="font-display text-[9px] uppercase tracking-widest text-muted-foreground">
                            {dt.toLocaleDateString("es-ES", { month: "short" }).replace(".", "")}
                          </span>
                          <span className="font-display text-sm text-gold">
                            {dt.toLocaleDateString("es-ES", { day: "2-digit" })}
                          </span>
                          <span className="font-display text-[9px] uppercase tracking-widest text-muted-foreground">
                            {dt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-display flex items-center gap-1.5 text-[12px] uppercase leading-tight tracking-wider text-foreground">
                            {isLive && (
                              <span className="live-dot inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-tv-red" />
                            )}
                            <span className="break-words">{s.event_name}</span>
                          </div>
                          <div className="font-condensed mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                            {s.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-2.5 w-2.5" /> {s.location}
                              </span>
                            )}
                            {s.category && (
                              <span className="text-foreground/70">{s.category}</span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* COL 3 — Resultados en vivo (mini-carrusel compacto) */}
          <div className="flex h-full min-w-0 flex-col">
            <LiveResultsTable compact />
          </div>
        </div>

        {/* Medallero países (debajo, ancho completo si está activo) */}
        {medalsVisible && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-display text-sm uppercase tracking-widest text-foreground">
                Medallero países
              </h3>
              <Medal className="h-3.5 w-3.5 text-gold" />
            </div>
            <div className="border border-border bg-background/50">
              <div className="font-condensed grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 border-b border-border bg-surface px-2.5 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground sm:grid-cols-[2fr_auto_auto_auto_auto]">
                <span>País</span>
                <span title="Oro" className="w-6 text-center text-gold">🥇</span>
                <span title="Plata" className="w-6 text-center">🥈</span>
                <span title="Bronce" className="w-6 text-center">🥉</span>
                <span className="w-7 text-right text-foreground">Σ</span>
              </div>
              <ul className="divide-y divide-border">
                {medals.slice(0, 6).map((m, i) => {
                  const total = m.gold + m.silver + m.bronze;
                  return (
                    <li
                      key={m.id}
                      className="font-condensed grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 px-2.5 py-2 text-xs sm:grid-cols-[2fr_auto_auto_auto_auto]"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="font-display w-4 text-[11px] text-muted-foreground">
                          {i + 1}
                        </span>
                        {m.flag_url ? (
                          <img
                            src={m.flag_url}
                            alt={m.country_name}
                            className="h-3.5 w-5 shrink-0 object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="font-display w-5 shrink-0 text-[10px] uppercase tracking-widest text-muted-foreground">
                            {m.country_code ?? "—"}
                          </span>
                        )}
                        <span className="break-words uppercase leading-tight tracking-wider">
                          {m.country_name}
                        </span>
                      </div>
                      <span className="w-6 text-center font-bold text-gold">{m.gold}</span>
                      <span className="w-6 text-center text-foreground/80">{m.silver}</span>
                      <span className="w-6 text-center text-foreground/60">{m.bronze}</span>
                      <span className="font-display w-7 text-right text-sm">{total}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ===================== NEWS CARDS (sport TV) ===================== */

function BigNewsCard({ news }: { news: News }) {
  return (
    <Link
      to="/noticias/articulo/$slug"
      params={{ slug: news.slug }}
      className="group relative block aspect-[4/5] overflow-hidden border border-border bg-surface lg:aspect-auto lg:h-full lg:min-h-[420px]"
    >
      {news.image_url ? (
        <img
          src={news.image_url}
          alt={news.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="hero-grid-bg absolute inset-0" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
        {news.news_categories?.name && (
          <span className="font-condensed mb-3 inline-block bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-background">
            {news.news_categories.name}
          </span>
        )}
        <h3 className="font-display clamp-3 text-2xl uppercase leading-tight tracking-wider text-foreground transition-colors group-hover:text-gold md:text-3xl">
          {news.title}
        </h3>
        <div className="font-condensed mt-3 flex items-center gap-3 text-[11px] uppercase tracking-widest text-foreground/70">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(news.published_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" /> {news.views_count}
          </span>
        </div>
      </div>
    </Link>
  );
}

function SmallNewsCard({ news }: { news: News }) {
  return (
    <Link
      to="/noticias/articulo/$slug"
      params={{ slug: news.slug }}
      className="group relative block aspect-[4/5] overflow-hidden border border-border bg-surface sm:aspect-[5/6]"
    >
      {news.image_url ? (
        <img
          src={news.image_url}
          alt={news.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
      ) : (
        <div className="hero-grid-bg absolute inset-0" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
        {news.news_categories?.name && (
          <span className="font-condensed mb-2 inline-block bg-gold/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[2px] text-background">
            {news.news_categories.name}
          </span>
        )}
        <h3 className="font-display clamp-3 text-sm uppercase leading-tight tracking-wider text-foreground transition-colors group-hover:text-gold md:text-base">
          {news.title}
        </h3>
        <div className="font-condensed mt-2 flex items-center gap-1 text-[10px] uppercase tracking-widest text-foreground/60">
          <Clock className="h-3 w-3" />
          {new Date(news.published_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
        </div>
      </div>
    </Link>
  );
}


type FeaturedAthlete = {
  id: string;
  full_name: string;
  slug: string;
  photo_url: string | null;
  clubs: { name: string } | null;
  regions: { name: string; code: string; flag_url: string | null } | null;
};

function FeaturedAthletesSection() {
  const [items, setItems] = useState<FeaturedAthlete[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("skaters")
      .select("id, full_name, slug, photo_url, clubs(name), regions(name, code, flag_url)")
      .eq("active", true)
      .eq("featured", true)
      .order("total_points", { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (!cancelled) setItems((data as unknown as FeaturedAthlete[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (items !== null && items.length === 0) return null;

  return (
    <section id="atletas-destacados" className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="font-display flex items-center gap-2 text-2xl tracking-widest md:text-3xl">
          <Trophy className="h-6 w-6 text-gold" />
          Atletas <span className="text-gold">destacados</span>
        </h2>
      </div>

      {items === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse bg-surface" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((a) => (
            <article
              key={a.id}
              className="group flex flex-col overflow-hidden border border-border bg-surface transition-colors hover:border-gold"
            >
              <div className="aspect-[4/5] overflow-hidden bg-background">
                {a.photo_url ? (
                  <img
                    src={a.photo_url}
                    alt={a.full_name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="hero-grid-bg flex h-full w-full items-center justify-center">
                    <UserIcon className="h-12 w-12 text-gold/30" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col items-center p-4 text-center">
                <h3 className="font-display text-base uppercase leading-tight tracking-wider">
                  {a.full_name}
                </h3>
                {a.clubs?.name && (
                  <div className="font-condensed mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                    {a.clubs.name}
                  </div>
                )}
                {a.regions && (
                  <div className="font-condensed mt-2 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-gold">
                    {a.regions.flag_url ? (
                      <img
                        src={a.regions.flag_url}
                        alt={a.regions.code}
                        className="h-3 w-auto"
                      />
                    ) : (
                      <MapPin className="h-3 w-3" />
                    )}
                    {a.regions.code}
                  </div>
                )}
                <Link
                  to="/patinadores/$slug"
                  params={{ slug: a.slug }}
                  className="font-condensed mt-4 inline-flex w-full items-center justify-center gap-1 border border-gold px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-background"
                >
                  Ver perfil
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

type InterviewPreview = {
  id: string;
  title: string;
  slug: string;
  interviewee_name: string;
  interview_date: string;
  cover_url: string | null;
  excerpt: string | null;
};

function InterviewsPreviewSection() {
  const [items, setItems] = useState<InterviewPreview[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("interviews")
      .select("id,title,slug,interviewee_name,interview_date,cover_url,excerpt")
      .eq("published", true)
      .order("interview_date", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (!cancelled) setItems((data as InterviewPreview[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="entrevistas" className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="font-display flex items-center gap-2 text-2xl tracking-widest md:text-3xl">
          <Mic className="h-6 w-6 text-gold" />
          Últimas <span className="text-gold">entrevistas</span>
        </h2>
        <Link to="/entrevistas" className="font-condensed text-xs font-bold uppercase tracking-widest text-gold hover:text-gold-dark">
          Ver todas →
        </Link>
      </div>
      {items === null ? (
        <div className="grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse bg-surface" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay entrevistas publicadas.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((it) => (
            <Link
              key={it.id}
              to="/entrevistas/$slug"
              params={{ slug: it.slug }}
              className="group block border border-border bg-surface transition-colors hover:border-gold"
            >
              <div className="aspect-[4/3] overflow-hidden bg-background">
                {it.cover_url ? (
                  <img src={it.cover_url} alt={it.interviewee_name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="hero-grid-bg flex h-full w-full items-center justify-center">
                    <Mic className="h-10 w-10 text-gold/30" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="font-condensed flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(it.interview_date).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
                <h3 className="font-display mt-2 text-lg leading-tight tracking-wider group-hover:text-gold">{it.title}</h3>
                <div className="font-condensed mt-1 text-xs uppercase tracking-wider text-gold">{it.interviewee_name}</div>
                {it.excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{it.excerpt}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

type EventPreview = {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  scope: string;
  cover_url: string | null;
  categories: string[];
};

function EventsPreviewSection() {
  const [items, setItems] = useState<EventPreview[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("events")
      .select("id,name,slug,start_date,end_date,location,scope,cover_url,categories")
      .eq("published", true)
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .limit(3)
      .then(({ data }) => {
        if (!cancelled) setItems((data as EventPreview[]) ?? []);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="eventos" className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="font-display flex items-center gap-2 text-2xl tracking-widest md:text-3xl">
          <Calendar className="h-6 w-6 text-gold" />
          Próximos <span className="text-gold">eventos</span>
        </h2>
        <Link to="/eventos" className="font-condensed text-xs font-bold uppercase tracking-widest text-gold hover:text-gold-dark">
          Ver todos →
        </Link>
      </div>
      {items === null ? (
        <div className="grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-56 animate-pulse bg-surface" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay eventos próximos programados.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((e) => (
            <article key={e.id} className="border border-border bg-surface transition-colors hover:border-gold">
              {e.cover_url && (
                <div className="aspect-[16/9] overflow-hidden bg-background">
                  <img src={e.cover_url} alt={e.name} className="h-full w-full object-cover" loading="lazy" />
                </div>
              )}
              <div className="p-4">
                <div className="font-condensed mb-2 flex items-center gap-2 text-[11px] uppercase tracking-widest">
                  <span className="bg-gold/15 px-2 py-0.5 font-bold text-gold">{e.scope}</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(e.start_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                    {e.end_date && e.end_date !== e.start_date && (
                      <> – {new Date(e.end_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</>
                    )}
                  </span>
                </div>
                <h3 className="font-display text-lg leading-tight tracking-wider">{e.name}</h3>
                {e.location && (
                  <div className="font-condensed mt-1 flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {e.location}
                  </div>
                )}
                {e.categories?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {e.categories.slice(0, 4).map((c) => (
                      <span key={c} className="font-condensed border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">{c}</span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

type MagazinePreview = {
  id: string;
  title: string;
  slug: string;
  issue_number: string | null;
  edition_date: string;
  cover_url: string | null;
  description: string | null;
  read_url: string | null;
  pdf_url: string | null;
};

function MagazinePreviewSection() {
  const [item, setItem] = useState<MagazinePreview | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("magazines")
      .select("id,title,slug,issue_number,edition_date,cover_url,description,read_url,pdf_url")
      .eq("published", true)
      .order("edition_date", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setItem((data as MagazinePreview) ?? null);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="revista" className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="font-display flex items-center gap-2 text-2xl tracking-widest md:text-3xl">
          <BookOpen className="h-6 w-6 text-gold" />
          Última <span className="text-gold">edición</span>
        </h2>
        <Link to="/revista" className="font-condensed text-xs font-bold uppercase tracking-widest text-gold hover:text-gold-dark">
          Hemeroteca →
        </Link>
      </div>
      {item === undefined ? (
        <div className="h-72 animate-pulse bg-surface" />
      ) : item === null ? (
        <p className="text-sm text-muted-foreground">Aún no hay ediciones publicadas.</p>
      ) : (
        <div className="grid gap-6 border border-border bg-surface md:grid-cols-[260px_1fr]">
          <div className="aspect-[3/4] overflow-hidden bg-background md:aspect-auto">
            {item.cover_url ? (
              <img src={item.cover_url} alt={item.title} className="h-full w-full object-cover" />
            ) : (
              <div className="hero-grid-bg flex h-full w-full items-center justify-center">
                <BookOpen className="h-12 w-12 text-gold/30" />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center p-6">
            {item.issue_number && (
              <div className="font-condensed text-xs uppercase tracking-widest text-gold">Nº {item.issue_number}</div>
            )}
            <h3 className="font-display mt-1 text-2xl leading-tight tracking-wider md:text-3xl">{item.title}</h3>
            <div className="font-condensed mt-2 flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(item.edition_date).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
            </div>
            {item.description && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{item.description}</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              {item.read_url && (
                <a href={item.read_url} target="_blank" rel="noopener noreferrer" className="font-condensed inline-flex items-center gap-2 bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark">
                  Leer online <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {item.pdf_url && (
                <a href={item.pdf_url} target="_blank" rel="noopener noreferrer" className="font-condensed inline-flex items-center gap-2 border border-border px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold/10">
                  Descargar PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

type SponsorPreview = {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  tier: string;
};

function SponsorsCarouselSection() {
  const [items, setItems] = useState<SponsorPreview[] | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("sponsors")
      .select("id,name,logo_url,website_url,tier")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setItems((data as SponsorPreview[]) ?? []);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !items || items.length === 0) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      el.scrollLeft += (dt / 1000) * 40;
      if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [items]);

  return (
    <section id="patrocinadores" className="border-y border-border bg-surface/40 py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
          <h2 className="font-display flex items-center gap-2 text-2xl tracking-widest md:text-3xl">
            <Heart className="h-6 w-6 text-gold" />
            Nuestros <span className="text-gold">patrocinadores</span>
          </h2>
          <Link to="/patrocinadores" className="font-condensed text-xs font-bold uppercase tracking-widest text-gold hover:text-gold-dark">
            Ver todos →
          </Link>
        </div>
        {items === null ? (
          <div className="h-24 animate-pulse bg-surface" />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay patrocinadores publicados.</p>
        ) : (
          <div ref={trackRef} className="flex gap-8 overflow-x-hidden" aria-label="Carrusel de patrocinadores">
            {[...items, ...items].map((s, idx) => {
              const inner = (
                <div className="flex h-24 w-[250px] shrink-0 items-center justify-center border border-border bg-background p-3 grayscale transition hover:grayscale-0">
                  {s.logo_url ? (
                    <img src={s.logo_url} alt={s.name} className="max-h-full max-w-full object-contain" loading="lazy" />
                  ) : (
                    <span className="font-display text-sm uppercase tracking-widest text-muted-foreground">{s.name}</span>
                  )}
                </div>
              );
              return s.website_url ? (
                <a key={`${s.id}-${idx}`} href={s.website_url} target="_blank" rel="noopener noreferrer" aria-label={s.name}>
                  {inner}
                </a>
              ) : (
                <div key={`${s.id}-${idx}`} aria-label={s.name}>{inner}</div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function NewsCard({ news }: { news: News }) {
  return (
    <Link
      to="/noticias/articulo/$slug"
      params={{ slug: news.slug }}
      className="group block overflow-hidden border border-border bg-surface transition-colors hover:border-gold"
    >
      <div className="aspect-[16/10] overflow-hidden bg-surface-2">
        {news.image_url ? (
          <img
            src={news.image_url}
            alt={news.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="hero-grid-bg flex h-full w-full items-center justify-center">
            <span className="font-display text-5xl tracking-widest text-gold/30">RZ</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="font-condensed mb-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest">
          {news.news_categories && (
            <span className="bg-gold/15 px-2 py-0.5 font-bold text-gold">
              {news.news_categories.name}
            </span>
          )}
          {news.legacy_tag && (
            <span className="text-muted-foreground">{news.legacy_tag}</span>
          )}
        </div>
        <h3 className="font-display clamp-2 text-lg leading-tight tracking-wide group-hover:text-gold">
          {news.title}
        </h3>
        <p className="clamp-2 mt-2 text-sm text-muted-foreground">{news.excerpt}</p>
        <div className="font-condensed mt-3 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-1">
            <UserIcon className="h-3 w-3" /> {news.author}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" /> {news.views_count}
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(news.published_at).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}

function PlaceholderSection({ id, title, text }: { id: string; title: string; text: string }) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-4 flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="font-display text-2xl tracking-widest md:text-3xl">
          {title}
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </section>
  );
}

function RankingPreviewSection() {
  const [top, setTop] = useState<MvpPreview[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: season } = await supabase
        .from("mvp_seasons")
        .select("id")
        .eq("is_current", true)
        .maybeSingle();
      if (!season) {
        if (!cancelled) setTop([]);
        return;
      }
      const { data } = await supabase
        .from("mvp_awards")
        .select("id, full_name, photo_url, club, region, tier, gender, position")
        .eq("season_id", season.id)
        .eq("published", true)
        .eq("position", 1)
        .order("tier", { ascending: true });
      if (!cancelled) setTop((data as MvpPreview[]) ?? []);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="premios-mvp" className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="font-display flex items-center gap-2 text-2xl tracking-widest md:text-3xl">
          <Trophy className="h-6 w-6 text-gold" />
          Premios <span className="text-gold">MVP</span>
        </h2>
        <Link
          to="/premios-mvp"
          className="font-condensed text-xs font-bold uppercase tracking-widest text-gold hover:text-gold-dark"
        >
          Ver todos →
        </Link>
      </div>

      {top === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse bg-surface" />)}
        </div>
      ) : top.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no hay premios MVP publicados. El admin puede añadirlos desde el panel.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((s) => (
            <Link
              key={s.id}
              to="/premios-mvp"
              className="flex items-center gap-4 border border-border bg-surface p-4 transition-colors hover:border-gold"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden border border-border bg-surface-2">
                {s.photo_url ? (
                  <img src={s.photo_url} alt={s.full_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="font-display flex h-full w-full items-center justify-center text-xs text-gold/40">RZ</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-condensed text-[10px] uppercase tracking-widest text-gold">
                  {s.tier === "elite" ? "Élite" : s.tier === "estrella" ? "Estrella" : "Promesa"} · {s.gender}
                </div>
                <div className="font-display mt-0.5 truncate text-sm uppercase tracking-wider">{s.full_name}</div>
                <div className="font-condensed mt-0.5 truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                  {[s.club, s.region].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="font-display text-2xl text-gold">1º</div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

type TeamMember = {
  id: string;
  full_name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
};

function TeamSection() {
  const [items, setItems] = useState<TeamMember[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("team_members")
      .select("id,full_name,role,bio,photo_url")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("full_name", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setItems((data as TeamMember[]) ?? []);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="equipo" className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="font-display flex items-center gap-2 text-2xl tracking-widest md:text-3xl">
          <UsersRound className="h-6 w-6 text-gold" />
          Nuestro <span className="text-gold">equipo</span>
        </h2>
      </div>
      {items === null ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-72 animate-pulse bg-surface" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay miembros del equipo publicados.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((m) => (
            <article key={m.id} className="border border-border bg-surface p-5 text-center transition-colors hover:border-gold">
              <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full border border-border bg-background">
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.full_name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="hero-grid-bg flex h-full w-full items-center justify-center">
                    <UsersRound className="h-10 w-10 text-gold/30" />
                  </div>
                )}
              </div>
              <h3 className="font-display text-base uppercase tracking-wider">{m.full_name}</h3>
              <div className="font-condensed mt-1 text-[11px] uppercase tracking-widest text-gold">{m.role}</div>
              {m.bio && <p className="mt-3 line-clamp-4 text-sm text-muted-foreground">{m.bio}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

/* ===================== MOST READ + FOLLOW US ===================== */

type MostReadNews = {
  id: string;
  title: string;
  slug: string;
  views_count: number;
  image_url: string | null;
  news_categories: { name: string } | null;
};

type SocialNetwork = {
  name: string;
  handle: string;
  url: string;
  followers: string;
  Icon: typeof Instagram;
  gradient: string;
  hoverColor: string;
};

const SOCIAL_NETWORKS: SocialNetwork[] = [
  {
    name: "Instagram",
    handle: "@rollerzone_spain",
    url: "https://instagram.com/rollerzone_spain",
    followers: "—",
    Icon: Instagram,
    gradient: "from-[#feda75] via-[#d62976] to-[#4f5bd5]",
    hoverColor: "group-hover:text-[#d62976]",
  },
  {
    name: "Facebook",
    handle: "@rollerzone.spain",
    url: "https://facebook.com/rollerzone.spain",
    followers: "—",
    Icon: Facebook,
    gradient: "from-[#1877f2] to-[#0a5dc2]",
    hoverColor: "group-hover:text-[#1877f2]",
  },
];

function MostReadAndSocialSection() {
  const [items, setItems] = useState<MostReadNews[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("news")
      .select("id, title, slug, views_count, image_url, news_categories(name)")
      .eq("published", true)
      .order("views_count", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (!cancelled) setItems((data as unknown as MostReadNews[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 md:px-6">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* MÁS LEÍDAS */}
        <div>
          <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
            <h2 className="font-display flex items-center gap-2 text-2xl tracking-widest md:text-3xl">
              <Flame className="h-6 w-6 text-gold" />
              Más <span className="text-gold">leídas</span>
            </h2>
            <Link
              to="/noticias"
              className="font-condensed text-xs font-bold uppercase tracking-widest text-gold hover:text-gold-dark"
            >
              Ver todas →
            </Link>
          </div>

          {items === null ? (
            <ul className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <li key={i} className="h-20 animate-pulse bg-surface" />
              ))}
            </ul>
          ) : items.length === 0 ? (
            <p className="font-condensed text-xs uppercase tracking-widest text-muted-foreground">
              Aún no hay noticias.
            </p>
          ) : (
            <ol className="divide-y divide-border border-y border-border">
              {items.map((n, i) => (
                <li key={n.id}>
                  <Link
                    to="/noticias/articulo/$slug"
                    params={{ slug: n.slug }}
                    className="group flex items-center gap-4 px-1 py-4 transition-all hover:translate-x-1 hover:bg-surface/50"
                  >
                    {/* Ranking number */}
                    <span
                      className={`font-display w-12 shrink-0 text-center text-4xl leading-none tracking-tighter transition-colors md:text-5xl ${
                        i === 0
                          ? "text-gold"
                          : "text-foreground/20 group-hover:text-gold/70"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    {/* Content */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      {n.news_categories?.name && (
                        <span className="font-condensed mb-1 text-[10px] font-bold uppercase tracking-[2px] text-gold">
                          {n.news_categories.name}
                        </span>
                      )}
                      <h3 className="font-display clamp-2 text-sm uppercase leading-tight tracking-wider text-foreground transition-colors group-hover:text-gold md:text-base">
                        {n.title}
                      </h3>
                      <div className="font-condensed mt-1 flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                        <Eye className="h-3 w-3" /> {n.views_count.toLocaleString("es-ES")} lecturas
                      </div>
                    </div>

                    <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-gold sm:block" />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* SÍGUENOS */}
        <div>
          <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
            <h2 className="font-display flex items-center gap-2 text-2xl tracking-widest md:text-3xl">
              <Heart className="h-6 w-6 text-gold" />
              Sí<span className="text-gold">guenos</span>
            </h2>
            <span className="font-condensed text-xs uppercase tracking-widest text-muted-foreground">
              Únete a la comunidad
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {SOCIAL_NETWORKS.map((s) => {
              const Icon = s.Icon;
              return (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Síguenos en ${s.name}`}
                  className="group relative flex flex-col overflow-hidden border border-border bg-surface p-4 transition-all hover:-translate-y-1 hover:border-gold hover:shadow-[0_8px_24px_-8px_hsl(var(--gold)/0.4)] sm:p-5"
                >
                  {/* Animated gradient accent on hover */}
                  <div
                    className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${s.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />

                  <div className="mb-3 flex items-center justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center bg-background/50 transition-all group-hover:scale-110 sm:h-12 sm:w-12`}
                    >
                      <Icon className={`h-5 w-5 text-foreground transition-colors ${s.hoverColor} sm:h-6 sm:w-6`} />
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 -translate-x-1" />
                  </div>

                  <div className="font-display text-sm uppercase tracking-widest text-foreground transition-colors group-hover:text-gold sm:text-base">
                    {s.name}
                  </div>
                  <div className="font-condensed mt-0.5 truncate text-[10px] uppercase tracking-widest text-muted-foreground sm:text-[11px]">
                    {s.handle}
                  </div>

                  <div className="mt-3 flex items-baseline gap-1.5 border-t border-border pt-3">
                    <span className="font-display text-xl tracking-wider text-gold sm:text-2xl">
                      {s.followers}
                    </span>
                    <span className="font-condensed text-[9px] uppercase tracking-[2px] text-muted-foreground sm:text-[10px]">
                      seguidores
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

