import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Eye, Calendar, User as UserIcon, ArrowRight, Trophy, Mic, MapPin, BookOpen, Heart, ExternalLink, UsersRound, Clock, Flame, Instagram, Facebook, ChevronLeft, ChevronRight, Newspaper, CalendarDays, MonitorPlay } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Ticker } from "@/components/site/Ticker";
import { HomeDynamicZone } from "@/components/home/HomeDynamicZone";
import { HomeResultsSlider } from "@/components/home/HomeResultsSlider";
import { useHomeSectionVisibility } from "@/lib/home/useHomeSectionVisibility";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdBannerWithMagazine } from "@/components/site/AdBannerWithMagazine";
import { LiveCenter } from "@/components/site/LiveCenter";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate, formatShortDate } from "@/lib/i18n/format";

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

type HeroSettings = { live_active: boolean };
const HERO_DEFAULTS: HeroSettings = { live_active: false };

function HomePage() {
  const { t, lang } = useLanguage();
  const [news, setNews] = useState<News[] | null>(null);
  const [heroCfg, setHeroCfg] = useState<HeroSettings>(HERO_DEFAULTS);
  const { visibility } = useHomeSectionVisibility();

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("news")
      .select(
        "id, title, slug, excerpt, author, legacy_tag, image_url, read_minutes, featured, hero_order, views_count, published_at, news_categories(name, slug, scope)"
      )
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("hero_order", { ascending: true })
      .order("published_at", { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (!cancelled) setNews((data as unknown as News[]) ?? []);
      });

    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "home_hero")
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.value) setHeroCfg({ ...HERO_DEFAULTS, ...(data.value as Partial<HeroSettings>) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const heroSlides: News[] = (() => {
    if (!news || news.length === 0) return [];
    const featured = news.filter((n) => n.featured).slice(0, 5);
    if (featured.length > 0) return featured;
    return news.slice(0, 5);
  })();

  return (
    <>
      {/* HERO — carrusel cinematográfico premium */}
      <HeroCarousel slides={heroSlides} liveActive={heroCfg.live_active} t={t} lang={lang} />

      <Ticker />

      {/* ¿QUÉ ES ROLLERZONE? — presentación del medio */}
      <section className="mx-auto max-w-7xl px-5 py-14 md:px-6 md:py-20">
        <div className="mb-10 text-center md:mb-14">
          <h2 className="font-display text-3xl uppercase tracking-widest text-foreground md:text-4xl">
            ¿Qué es <span className="text-gold">RollerZone</span>?
          </h2>
          <div className="mx-auto mt-3 h-[2px] w-16 bg-gold md:mt-4 md:w-20" />
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            El medio de referencia del patinaje de velocidad. Noticias, eventos, resultados en directo y contenido exclusivo para la comunidad del patín.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <WhatIsCard
            icon={<Newspaper className="h-7 w-7" />}
            title="Noticias"
            description="Lo último del patinaje nacional e internacional."
            to="/noticias"
          />
          <WhatIsCard
            icon={<CalendarDays className="h-7 w-7" />}
            title="Eventos"
            description="Calendario de competiciones y actividades."
            to="/eventos"
          />
          <WhatIsCard
            icon={<BookOpen className="h-7 w-7" />}
            title="Revista Digital"
            description="Reportajes, entrevistas y análisis en profundidad."
            to="/revista"
          />
          <WhatIsCard
            icon={<MonitorPlay className="h-7 w-7" />}
            title="RollerZone TV"
            description="Streaming y vídeos exclusivos de competiciones."
            to="/tv"
          />
        </div>
      </section>

      <HomeDynamicZone />

      {visibility.podios && <HomeResultsSlider />}

      <AdBannerWithMagazine placement="home_top" />

      <div id="live-center"><LiveCenter /></div>

      {/* ÚLTIMAS NOTICIAS — grid 3/2/1 */}
      <section id="noticias" className="mx-auto max-w-7xl px-5 py-12 md:px-6">
        <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
          <h2 className="font-display text-2xl tracking-widest md:text-3xl">
            {t("home.latestNews")} <span className="text-gold">{t("home.latestNewsAccent")}</span>
          </h2>
          <Link
            to="/noticias"
            className="font-condensed text-xs font-bold uppercase tracking-widest text-gold hover:text-gold-light"
          >
            {t("common.viewAllArrow")}
          </Link>
        </div>

        {news === null ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <NewsSkeleton key={i} />)}
          </div>
        ) : news.length === 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <NewsSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {news.slice(0, 6).map((n) => <NewsGridCard key={n.id} news={n} />)}
          </div>
        )}
      </section>

      <MostReadAndSocialSection />

      {visibility.atletas && <FeaturedAthletesSection />}
      {visibility.ranking && <RankingPreviewSection />}
      {visibility.entrevistas && <InterviewsPreviewSection />}
      {visibility.eventos && <EventsPreviewSection />}
      {visibility.revista && <MagazinePreviewSection />}
      {visibility.patrocinadores && <SponsorsCarouselSection />}
      {visibility.equipo && <TeamSection />}
    </>
  );
}

/* ===================== HERO CARRUSEL PREMIUM ===================== */

function HeroCarousel({
  slides,
  liveActive,
  t,
  lang,
}: {
  slides: News[];
  liveActive: boolean;
  t: (k: string) => string;
  lang: "es" | "en";
}) {
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }));
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplay.current]);
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    setSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", () => {
      setSnaps(emblaApi.scrollSnapList());
      onSelect();
    });
    onSelect();
  }, [emblaApi]);

  if (slides.length === 0) {
    return (
      <section className="relative w-full overflow-hidden bg-background">
        <div className="relative flex h-[50vh] min-h-[340px] items-center justify-center">
          <div className="diagonal-lines-bg absolute inset-0" aria-hidden="true" />
          <h1 className="font-display relative text-5xl uppercase tracking-widest text-gold">RollerZone</h1>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden bg-background">
      <div className="relative" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, idx) => (
            <div key={slide.id} className="relative min-w-0 flex-[0_0_100%]">
              <HeroSlide slide={slide} liveActive={liveActive} active={idx === selected} t={t} lang={lang} />
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => emblaApi?.scrollPrev()}
              className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-foreground backdrop-blur-md transition-all hover:border-gold hover:bg-black/70 hover:text-gold md:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              onClick={() => emblaApi?.scrollNext()}
              className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-foreground backdrop-blur-md transition-all hover:border-gold hover:bg-black/70 hover:text-gold md:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {snaps.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-2">
            {snaps.map((_, i) => {
              const active = i === selected;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Ir al slide ${i + 1}`}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={
                    "h-1.5 rounded-full transition-all duration-300 " +
                    (active ? "w-8 bg-gold" : "w-4 bg-white/40 hover:bg-white/70")
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function HeroSlide({
  slide,
  liveActive,
  active,
  t,
  lang,
}: {
  slide: News;
  liveActive: boolean;
  active: boolean;
  t: (k: string) => string;
  lang: "es" | "en";
}) {
  return (
    <Link
      to="/noticias/articulo/$slug"
      params={{ slug: slide.slug }}
      className="group relative block h-[66vh] min-h-[420px] max-h-[570px] w-full md:h-[58vh] md:min-h-[400px]"
      aria-label={slide.title}
    >
      <div className="absolute inset-0 overflow-hidden">
        {slide.image_url ? (
          <img
            src={slide.image_url}
            alt={slide.title}
            loading="eager"
            className={
              "h-full w-full object-cover object-center transition-transform ease-out " +
              (active ? "scale-110 duration-[8000ms]" : "scale-100 duration-[1200ms]")
            }
          />
        ) : (
          <div className="hero-grid-bg h-full w-full" />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent md:from-black/80" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-4 pb-14 pt-16 sm:px-6 md:pb-20 md:pt-24">
        <div className="w-full max-w-2xl animate-fade-in">
          <div className="mb-3 flex flex-wrap items-center gap-2 md:mb-4">
            {liveActive && (
              <span className="live-red-tag font-condensed inline-flex items-center gap-2 rounded-sm bg-tv-red px-3 py-1.5 text-[11px] font-bold uppercase tracking-[3px] text-white shadow-lg">
                <span className="live-dot-fast inline-block h-1.5 w-1.5 rounded-full bg-white" />
                EN DIRECTO
              </span>
            )}
            <span className="font-condensed inline-flex items-center border border-gold/60 bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-gold backdrop-blur-sm md:px-3">
              {slide.news_categories?.name ?? t("home.featured")}
            </span>
            {slide.published_at && (
              <span className="font-condensed inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/70">
                <Calendar className="h-3 w-3" />
                {formatDate(slide.published_at, lang)}
              </span>
            )}
          </div>

          <h1 className="font-display text-[1.85rem] uppercase leading-[1.02] tracking-wider text-foreground drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] sm:text-4xl md:text-5xl lg:text-6xl">
            {slide.title}
          </h1>
          <div className="mt-3 h-[3px] w-16 bg-gold md:mt-4 md:w-24" aria-hidden="true" />
          {slide.excerpt && (
            <p className="clamp-2 mt-3 max-w-xl text-[0.95rem] leading-relaxed text-foreground/85 md:mt-4 md:text-base">
              {slide.excerpt}
            </p>
          )}

          <div className="mt-5 md:mt-6">
            <span className="inline-flex items-center justify-center gap-2 rounded-md bg-gold px-5 py-3 text-[13px] font-bold uppercase tracking-wider text-background shadow-lg gold-glow-soft transition-all group-hover:bg-gold-light group-hover:translate-x-1 md:px-6 md:text-sm">
              {t("common.readArticle")} <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true" />
    </Link>
  );
}

/* ===================== NEWS CARDS ===================== */

function NewsSkeleton() {
  return (
    <div className="border border-border bg-surface">
      <div className="aspect-[16/9] animate-pulse bg-surface-2" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-20 animate-pulse bg-surface-2" />
        <div className="h-4 w-full animate-pulse bg-surface-2" />
        <div className="h-4 w-3/4 animate-pulse bg-surface-2" />
        <div className="h-3 w-1/2 animate-pulse bg-surface-2" />
      </div>
    </div>
  );
}

function NewsGridCard({ news }: { news: News }) {
  return (
    <Link
      to="/noticias/articulo/$slug"
      params={{ slug: news.slug }}
      className="group block overflow-hidden rounded-2xl border border-border bg-surface shadow-lg transition-all duration-300 hover:scale-[1.03] hover:border-gold hover:shadow-xl"
    >
      <div className="aspect-[16/9] overflow-hidden bg-surface-2">
        {news.image_url ? (
          <img
            src={news.image_url}
            alt={news.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="hero-grid-bg flex h-full w-full items-center justify-center">
            <span className="font-display text-5xl tracking-widest text-gold/30">RZ</span>
          </div>
        )}
      </div>
      <div className="p-5">
        {news.news_categories?.name && (
          <span className="font-condensed mb-2 inline-block rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px] text-background">
            {news.news_categories.name}
          </span>
        )}
        <h3 className="clamp-2 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-gold md:text-lg">
          {news.title}
        </h3>
        <div className="font-condensed mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          {news.author && (
            <span className="flex items-center gap-1">
              <UserIcon className="h-3 w-3" /> {news.author}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(news.published_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
          </span>
          {news.views_count > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" /> {news.views_count}
            </span>
          )}
        </div>
        <div className="mt-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent transition-transform group-hover:translate-x-1">
            Leer <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
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


type PersonalRecord = { event?: string; time?: string; place?: string };

type FeaturedAthlete = {
  id: string;
  full_name: string;
  slug: string;
  photo_url: string | null;
  category: string | null;
  bio: string | null;
  personal_records: PersonalRecord[] | null;
  clubs: { name: string } | null;
  regions: { name: string; code: string; flag_url: string | null } | null;
};

function FeaturedAthletesSection() {
  const [items, setItems] = useState<FeaturedAthlete[] | null>(null);
  const [selected, setSelected] = useState<FeaturedAthlete | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("skaters")
      .select("id, full_name, slug, photo_url, category, bio, personal_records, clubs(name), regions(name, code, flag_url)")
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
    <section id="atletas-destacados" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex items-end justify-between border-b border-border pb-3 sm:mb-8 sm:pb-4">
        <div>
          <div className="font-condensed mb-2 text-[10px] font-bold uppercase tracking-[3px] text-gold sm:text-[11px]">
            <Trophy className="mr-1.5 inline h-3 w-3 sm:h-3.5 sm:w-3.5" /> Élite RollerZone
          </div>
          <h2 className="font-display text-xl uppercase tracking-widest sm:text-2xl md:text-4xl">
            Patinadores <span className="text-gold">destacados</span>
          </h2>
        </div>
      </div>

      {items === null ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[280px] animate-pulse rounded-xl bg-surface-2 sm:h-[360px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {items.map((a) => {
            const records = (a.personal_records ?? []).slice(0, 2);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelected(a)}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[0_15px_40px_-10px_rgba(212,160,23,0.4)]"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-surface-2 to-background">
                  {a.photo_url ? (
                    <img
                      src={a.photo_url}
                      alt={a.full_name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserIcon className="h-16 w-16 text-gold/30 sm:h-20 sm:w-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                  <div className="absolute left-2 right-2 top-2 flex items-start justify-between gap-2 sm:left-3 sm:right-3 sm:top-3">
                    {a.regions?.flag_url ? (
                      <img
                        src={a.regions.flag_url}
                        alt={a.regions.name}
                        className="h-4 w-6 rounded-sm object-cover shadow-md ring-1 ring-black/30 sm:h-5 sm:w-7"
                      />
                    ) : <span />}
                    {a.category && (
                      <span className="font-condensed rounded-sm bg-gold px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[1.5px] text-background shadow-md sm:px-2 sm:text-[9px] sm:tracking-[2px]">
                        {a.category}
                      </span>
                    )}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-4">
                    <h3 className="font-display text-sm uppercase leading-tight tracking-wider text-white drop-shadow-lg transition-colors group-hover:text-gold sm:text-base md:text-lg">
                      {a.full_name}
                    </h3>
                    {a.clubs?.name && (
                      <div className="font-condensed mt-1 line-clamp-1 text-[9px] uppercase tracking-[1.5px] text-white/80 sm:text-[10px] sm:tracking-[2px]">
                        {a.clubs.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-1 border-t border-border bg-background/60 p-2 sm:gap-1.5 sm:p-3">
                  <div className="font-condensed mb-0.5 text-[8px] font-bold uppercase tracking-[2px] text-gold/80 sm:text-[9px] sm:tracking-[2.5px]">
                    Marcas destacadas
                  </div>
                  {records.length === 0 ? (
                    <div className="text-[10px] italic text-muted-foreground sm:text-[11px]">Sin marcas</div>
                  ) : (
                    records.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-1.5 text-[10px] sm:gap-2 sm:text-[11px]">
                        <span className="font-condensed truncate uppercase tracking-wider text-foreground/90">
                          {r.event ?? "—"}
                        </span>
                        <span className="font-display shrink-0 text-xs font-bold text-gold tabular-nums sm:text-sm">
                          {r.time ?? "—"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border bg-background p-0">
          {selected && (
            <div>
              <div className="relative aspect-[16/10] overflow-hidden bg-surface-2 sm:aspect-[16/9]">
                {selected.photo_url ? (
                  <img src={selected.photo_url} alt={selected.full_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserIcon className="h-24 w-24 text-gold/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-2">
                  {selected.regions?.flag_url ? (
                    <img src={selected.regions.flag_url} alt={selected.regions.name} className="h-6 w-9 rounded-sm object-cover shadow-md ring-1 ring-black/30" />
                  ) : <span />}
                  {selected.category && (
                    <span className="font-condensed rounded-sm bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2px] text-background shadow-md">
                      {selected.category}
                    </span>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl uppercase leading-tight tracking-wider text-white drop-shadow-lg sm:text-3xl">
                      {selected.full_name}
                    </DialogTitle>
                  </DialogHeader>
                  {selected.clubs?.name && (
                    <div className="font-condensed mt-1 text-[11px] uppercase tracking-[2px] text-white/80">
                      {selected.clubs.name}
                      {selected.regions?.name && <span className="ml-2 text-gold/90">· {selected.regions.name}</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5 p-4 sm:p-6">
                {selected.bio && (
                  <div>
                    <div className="font-condensed mb-2 text-[10px] font-bold uppercase tracking-[2.5px] text-gold/80">
                      Resumen
                    </div>
                    <p className="line-clamp-4 text-sm leading-relaxed text-foreground/85">{selected.bio}</p>
                  </div>
                )}

                <div>
                  <div className="font-condensed mb-2 text-[10px] font-bold uppercase tracking-[2.5px] text-gold/80">
                    Marcas destacadas
                  </div>
                  {(selected.personal_records ?? []).length === 0 ? (
                    <div className="text-sm italic text-muted-foreground">Sin marcas registradas</div>
                  ) : (
                    <div className="divide-y divide-border/60 border border-border">
                      {(selected.personal_records ?? []).slice(0, 5).map((r, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 px-3 py-2">
                          <span className="font-condensed text-xs uppercase tracking-wider text-foreground/90">
                            {r.event ?? "—"}
                          </span>
                          <div className="flex items-center gap-3">
                            {r.place && <span className="text-[11px] text-muted-foreground">{r.place}</span>}
                            <span className="font-display text-base font-bold text-gold tabular-nums">{r.time ?? "—"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="font-condensed rounded-sm border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
                  >
                    Cerrar
                  </button>
                  <Link
                    to="/patinadores/$slug"
                    params={{ slug: selected.slug }}
                    onClick={() => setSelected(null)}
                    className="font-condensed inline-flex items-center justify-center gap-2 rounded-sm bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background transition hover:bg-gold-dark"
                  >
                    Ver perfil completo <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
      .limit(24)
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
        <Carousel
          opts={{ align: "start", loop: false }}
          className="relative"
        >
          <CarouselContent className="-ml-4">
            {items.map((e) => (
              <CarouselItem key={e.id} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                <Link
                  to="/eventos/$slug"
                  params={{ slug: e.slug }}
                  className="group flex h-full flex-col border border-border bg-surface transition-all hover:-translate-y-1 hover:border-gold hover:shadow-[0_10px_30px_-10px_hsl(var(--gold)/0.4)]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-background">
                    {e.cover_url ? (
                      <img
                        src={e.cover_url}
                        alt={e.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="hero-grid-bg flex h-full w-full items-center justify-center">
                        <Calendar className="h-10 w-10 text-gold/30" />
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex flex-col items-center bg-background/90 px-2.5 py-1.5 text-center backdrop-blur">
                      <span className="font-display text-lg leading-none text-gold">
                        {new Date(e.start_date).toLocaleDateString("es-ES", { day: "2-digit" })}
                      </span>
                      <span className="font-condensed text-[10px] uppercase tracking-widest text-foreground">
                        {new Date(e.start_date).toLocaleDateString("es-ES", { month: "short" })}
                      </span>
                    </div>
                    <span className="absolute right-3 top-3 bg-gold/90 px-2 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-widest text-background">
                      {e.scope}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-display line-clamp-2 text-lg leading-tight tracking-wider transition-colors group-hover:text-gold">
                      {e.name}
                    </h3>
                    {e.location && (
                      <div className="font-condensed mt-2 flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {e.location}
                      </div>
                    )}
                    {e.end_date && e.end_date !== e.start_date && (
                      <div className="font-condensed mt-1 flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Hasta {new Date(e.end_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
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
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4 border-border bg-surface text-foreground hover:bg-gold hover:text-background" />
          <CarouselNext className="hidden md:flex -right-4 border-border bg-surface text-foreground hover:bg-gold hover:text-background" />
        </Carousel>
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
              const showFollowers = s.followers && s.followers !== "0" && s.followers !== "—";
              return (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Síguenos en ${s.name}`}
                  className="group flex flex-col border border-border bg-surface p-4 transition-colors hover:border-gold sm:p-5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center border border-border transition-colors group-hover:border-gold sm:h-12 sm:w-12">
                      <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-gold sm:h-6 sm:w-6" />
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>

                  <div className="font-display text-sm uppercase tracking-widest text-foreground transition-colors group-hover:text-gold sm:text-base">
                    {s.name}
                  </div>
                  <div className="font-condensed mt-0.5 truncate text-[10px] uppercase tracking-widest text-muted-foreground sm:text-[11px]">
                    {s.handle}
                  </div>

                  {showFollowers && (
                    <div className="mt-3 flex items-baseline gap-1.5 border-t border-border pt-3">
                      <span className="font-display text-xl tracking-wider text-gold sm:text-2xl">{s.followers}</span>
                      <span className="font-condensed text-[9px] uppercase tracking-[2px] text-muted-foreground sm:text-[10px]">
                        seguidores
                      </span>
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

