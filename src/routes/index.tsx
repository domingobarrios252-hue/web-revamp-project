import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Eye, Calendar, User as UserIcon, ArrowRight, MapPin, BookOpen, ExternalLink,
  ChevronLeft, ChevronRight, Newspaper, UsersRound,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Ticker } from "@/components/site/Ticker";
import { HomeDynamicZone } from "@/components/home/HomeDynamicZone";
import { HomeResultsSlider } from "@/components/home/HomeResultsSlider";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { AdBanner } from "@/components/site/AdBanner";
import { supabase } from "@/integrations/supabase/client";
import { cropObjectPosition } from "@/lib/imageCrops";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/i18n/format";

import { EditorialCover, type CoverNews } from "@/components/home/EditorialCover";
import { SpecialCoverageBanner } from "@/components/home/SpecialCoverageBanner";
import { RollerZoneTVHome } from "@/components/home/RollerZoneTVHome";
import { UniverseGrid } from "@/components/home/UniverseGrid";
import { JoinContributorsBlock } from "@/components/home/JoinContributorsBlock";
import { useHomeSectionVisibility } from "@/lib/home/useHomeSectionVisibility";

function RedactoresGate() {
  const { visibility, loading } = useHomeSectionVisibility();
  if (loading) return null;
  if (!visibility.redactores) return null;
  return <JoinContributorsBlock />;
}

import { NewsletterBand } from "@/components/home/NewsletterBand";
import { SectionHeading } from "@/components/home/SectionHeading";

type News = CoverNews & {
  legacy_tag: string | null;
  featured: boolean;
  views_count: number;
  live_active: boolean | null;
  live_event_id: string | null;
  live_start_at: string | null;
  live_end_at: string | null;
};

type HeroBadge = "live" | "new" | null;
function computeHeroBadge(slide: News, now: number = Date.now()): HeroBadge {
  if (slide.live_active) {
    const start = slide.live_start_at ? new Date(slide.live_start_at).getTime() : null;
    const end = slide.live_end_at ? new Date(slide.live_end_at).getTime() : null;
    const afterStart = start === null || now >= start;
    const beforeEnd = end === null || now <= end;
    if (afterStart && beforeEnd) return "live";
  }
  if (slide.published_at) {
    const pub = new Date(slide.published_at).getTime();
    if (!Number.isNaN(pub) && now - pub <= 72 * 60 * 60 * 1000) return "new";
  }
  return null;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RollerZone — El medio del patinaje de velocidad" },
      {
        name: "description",
        content:
          "RollerZone: noticias, resultados, eventos, entrevistas, selección española, clubes y la revista de referencia del patinaje sobre ruedas.",
      },
      { property: "og:title", content: "RollerZone — El medio del patinaje de velocidad" },
      {
        property: "og:description",
        content:
          "Noticias, resultados, eventos, entrevistas y revista del patinaje de velocidad. La casa del patinaje sobre ruedas.",
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

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("news")
      .select(
        "id, title, slug, excerpt, author, legacy_tag, image_url, image_crops, read_minutes, featured, hero_order, views_count, published_at, news_categories(name, slug, scope)"
      )
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("hero_order", { ascending: true })
      .order("published_at", { ascending: false })
      .limit(40)
      .then(async ({ data }) => {
        if (cancelled) return;
        const rows = (data as unknown as (News & { id: string })[]) ?? [];
        if (rows.length === 0) {
          setNews([]);
          return;
        }
        const { data: visData } = await supabase
          .from("news_visibility")
          .select("news_id, channel")
          .in("channel", ["global_home", "country"])
          .in("news_id", rows.map((r) => r.id));
        const withAnyRow = new Set<string>();
        const onHome = new Set<string>();
        for (const v of (visData ?? []) as { news_id: string; channel: string }[]) {
          withAnyRow.add(v.news_id);
          if (v.channel === "global_home") onHome.add(v.news_id);
        }
        const visible = rows.filter((r) => onHome.has(r.id) || !withAnyRow.has(r.id)).slice(0, 14);
        if (!cancelled) setNews(visible);
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

  const coverNews = news?.slice(0, 4) ?? [];
  const latestNews = news
    ? [...news]
        .sort(
          (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
        )
        .slice(0, 6)
    : [];

  return (
    <>
      {/* 1. HERO CARRUSEL */}
      <HeroCarousel slides={heroSlides} liveActive={heroCfg.live_active} t={t} lang={lang} />

      {/* 2. TICKER */}
      <Ticker />

      {/* BANNER PUBLICITARIO */}
      <AdBanner placement="home_top" />

      {/* 3. PORTADA EDITORIAL */}
      {coverNews.length > 0 && <EditorialCover news={coverNews} />}

      {/* 4. ESPECIAL DEL MOMENTO */}
      <SpecialCoverageBanner />

      {/* 5. ACTUALIDAD ROLLERZONE */}
      <LatestNewsGrid news={news === null ? null : latestNews} />

      {/* 6. RESULTADOS / LIVE CENTER */}
      <HomeDynamicZone />
      <HomeResultsSlider />

      {/* 7. PRÓXIMOS EVENTOS */}
      <EventsPreviewSection />

      {/* 8. ROLLERZONE TV */}
      <RollerZoneTVHome />

      {/* 9. REVISTA */}
      <MagazinePreviewSection />

      {/* 10. UNIVERSO ROLLERZONE */}
      <UniverseGrid />

      {/* 11. CAPTACIÓN DE REDACTORES */}
      <RedactoresGate />


      {/* 12. NEWSLETTER */}
      <NewsletterBand />
    </>
  );
}

/* ===================== HERO CARRUSEL ===================== */

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
  const autoplay = useRef(Autoplay({ delay: 5500, stopOnInteraction: false, stopOnMouseEnter: true }));
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
              <HeroSlide
                slide={slide}
                liveActive={liveActive}
                active={idx === selected}
                t={t}
                lang={lang}
                index={idx}
                total={slides.length}
              />
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
  index,
  total,
}: {
  slide: News;
  liveActive: boolean;
  active: boolean;
  t: (k: string) => string;
  lang: "es" | "en";
  index: number;
  total: number;
}) {
  const todayLabel = new Date().toLocaleDateString(lang === "en" ? "en-GB" : "es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return (
    <div className="relative block h-[78vh] min-h-[520px] max-h-[720px] w-full md:h-[72vh] md:min-h-[520px]">
      <div className="absolute inset-0 overflow-hidden">
        {slide.image_url ? (
          <img
            src={slide.image_url}
            alt={slide.title}
            loading="eager"
            style={{ objectPosition: cropObjectPosition(slide.image_crops, "hero") }}
            className={
              "h-full w-full object-cover transition-transform ease-out " +
              (active ? "scale-110 duration-[8000ms]" : "scale-100 duration-[1200ms]")
            }
          />
        ) : (
          <div className="hero-grid-bg h-full w-full" />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/50 to-transparent md:from-black/90" aria-hidden="true" />

      {/* Tira editorial superior */}
      <div className="absolute inset-x-0 top-0 z-10 border-b border-white/10 bg-black/45 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div className="font-condensed flex items-center gap-3 text-[10px] uppercase tracking-[3px] text-white/70">
            <span className="text-gold">Portada</span>
            <span className="hidden sm:inline text-white/30">·</span>
            <span className="hidden sm:inline capitalize">{todayLabel}</span>
          </div>
          <div className="font-condensed flex items-center gap-2 text-[10px] uppercase tracking-[3px] text-white/70">
            <span className="text-gold">{String(index + 1).padStart(2, "0")}</span>
            <span className="text-white/30">/</span>
            <span>{String(total).padStart(2, "0")}</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-4 pb-20 pt-20 sm:px-6 md:pb-28 md:pt-28">
        <div className="w-full max-w-3xl animate-fade-in">
          {/* Kicker de marca */}
          <div className="font-condensed mb-4 inline-flex items-center gap-2 bg-gold px-3 py-1.5 text-[10px] font-bold uppercase tracking-[3.5px] text-background shadow-lg md:text-[11px]">
            <Newspaper className="h-3 w-3" /> El medio del patinaje de velocidad
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
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

          <Link
            to="/noticias/articulo/$slug"
            params={{ slug: slide.slug }}
            className="block group"
          >
            <h1 className="font-display text-[2rem] uppercase leading-[1.02] tracking-wider text-foreground drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] transition-colors group-hover:text-gold sm:text-4xl md:text-5xl lg:text-6xl">
              {slide.title}
            </h1>
          </Link>
          <div className="mt-3 h-[3px] w-16 bg-gold md:mt-4 md:w-24" aria-hidden="true" />
          {slide.excerpt && (
            <p className="clamp-2 mt-3 max-w-xl text-[0.95rem] leading-relaxed text-foreground/85 md:mt-4 md:text-base">
              {slide.excerpt}
            </p>
          )}

          {/* CTAs duales */}
          <div className="mt-6 flex flex-wrap items-center gap-3 md:mt-8">
            <Link
              to="/noticias/articulo/$slug"
              params={{ slug: slide.slug }}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-gold px-6 py-3 text-[13px] font-bold uppercase tracking-wider text-background shadow-lg gold-glow-soft transition-all hover:bg-gold-light hover:translate-x-1 md:text-sm"
            >
              Leer actualidad <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#colaborar"
              className="font-condensed inline-flex items-center justify-center gap-2 rounded-md border border-white/30 bg-black/30 px-6 py-3 text-[13px] font-bold uppercase tracking-wider text-foreground backdrop-blur-sm transition-all hover:border-gold hover:bg-black/50 hover:text-gold md:text-sm"
            >
              <UsersRound className="h-4 w-4" /> Únete a RollerZone
            </a>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true" />
    </div>
  );
}

/* ===================== NEWS GRID ===================== */

function NewsSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface">
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
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-[0_15px_40px_-10px_rgba(212,160,23,0.35)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
        {news.image_url ? (
          <img
            src={news.image_url}
            alt={news.title}
            loading="lazy"
            style={{ objectPosition: cropObjectPosition(news.image_crops, "card") }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="hero-grid-bg flex h-full w-full items-center justify-center">
            <span className="font-display text-5xl tracking-widest text-gold/30">RZ</span>
          </div>
        )}
        {news.news_categories?.name && (
          <span className="font-condensed absolute left-3 top-3 inline-block bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-background shadow-md">
            {news.news_categories.name}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display clamp-2 text-lg uppercase leading-snug tracking-wider text-foreground transition-colors group-hover:text-gold md:text-xl">
          {news.title}
        </h3>
        {news.excerpt && (
          <p className="clamp-2 mt-2 text-sm leading-relaxed text-muted-foreground">{news.excerpt}</p>
        )}
        <div className="font-condensed mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-widest text-muted-foreground">
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
          <span className="font-condensed inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gold transition-transform group-hover:translate-x-1">
            Leer <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function LatestNewsGrid({ news }: { news: News[] | null }) {
  return (
    <section id="noticias" className="mx-auto max-w-7xl px-5 py-12 md:px-6">
      <SectionHeading
        kicker="Actualidad RollerZone"
        title="Últimas"
        accent="noticias"
        action={{ to: "/noticias", label: "Ver todas" }}
      />

      {news === null ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <NewsSkeleton key={i} />)}
        </div>
      ) : news.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay más noticias publicadas.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((n) => <NewsGridCard key={n.id} news={n} />)}
        </div>
      )}
    </section>
  );
}

/* ===================== EVENTOS ===================== */

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
    <section id="eventos" className="mx-auto max-w-7xl px-5 py-12 md:px-6">
      <SectionHeading
        kicker="Agenda competitiva"
        title="Próximos"
        accent="eventos"
        action={{ to: "/eventos", label: "Ver todos" }}
      />

      {items === null ? (
        <div className="grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-surface" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay eventos próximos programados.</p>
      ) : (
        <Carousel opts={{ align: "start", loop: false }} className="relative">
          <CarouselContent className="-ml-4">
            {items.map((e) => (
              <CarouselItem key={e.id} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                <Link
                  to="/eventos/$slug"
                  params={{ slug: e.slug }}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lg transition-all hover:-translate-y-1 hover:border-gold hover:shadow-[0_15px_40px_-10px_rgba(212,160,23,0.35)]"
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
                    <div className="absolute left-3 top-3 flex flex-col items-center rounded-md bg-background/90 px-2.5 py-1.5 text-center backdrop-blur">
                      <span className="font-display text-lg leading-none text-gold">
                        {new Date(e.start_date).toLocaleDateString("es-ES", { day: "2-digit" })}
                      </span>
                      <span className="font-condensed text-[10px] uppercase tracking-widest text-foreground">
                        {new Date(e.start_date).toLocaleDateString("es-ES", { month: "short" })}
                      </span>
                    </div>
                    <span className="font-condensed absolute right-3 top-3 rounded-sm bg-gold/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-background">
                      {e.scope}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-display clamp-2 text-lg uppercase leading-tight tracking-wider transition-colors group-hover:text-gold">
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
                          <span key={c} className="font-condensed rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">{c}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 font-condensed inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gold transition-transform group-hover:translate-x-1">
                      Ver evento <ArrowRight className="h-3.5 w-3.5" />
                    </div>
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

/* ===================== REVISTA ===================== */

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
    <section id="revista" className="mx-auto max-w-7xl px-5 py-12 md:px-6">
      <SectionHeading
        kicker="Revista RollerZone"
        title="Última"
        accent="edición"
        action={{ to: "/revista", label: "Hemeroteca" }}
      />

      {item === undefined ? (
        <div className="h-72 animate-pulse rounded-2xl bg-surface" />
      ) : item === null ? (
        <p className="text-sm text-muted-foreground">Aún no hay ediciones publicadas.</p>
      ) : (
        <div className="grid gap-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl md:grid-cols-[320px_1fr]">
          <div className="relative aspect-[3/4] overflow-hidden bg-background md:aspect-auto">
            {item.cover_url ? (
              <img src={item.cover_url} alt={item.title} className="h-full w-full object-cover" />
            ) : (
              <div className="hero-grid-bg flex h-full w-full items-center justify-center">
                <BookOpen className="h-12 w-12 text-gold/30" />
              </div>
            )}
            <span className="font-condensed absolute left-4 top-4 rounded-md bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-background shadow-lg">
              Ya disponible
            </span>
          </div>
          <div className="flex flex-col justify-center p-6 md:p-8">
            {item.issue_number && (
              <div className="font-condensed text-xs uppercase tracking-widest text-gold">Nº {item.issue_number}</div>
            )}
            <h3 className="font-display mt-1 text-3xl uppercase leading-tight tracking-wider text-foreground md:text-4xl">{item.title}</h3>
            <div className="mt-3 h-[3px] w-16 bg-gold" aria-hidden="true" />
            <div className="font-condensed mt-3 flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(item.edition_date).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
            </div>
            {item.description && <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground md:text-base">{item.description}</p>}
            <div className="mt-6 flex flex-wrap gap-2">
              {item.read_url && (
                <a href={item.read_url} target="_blank" rel="noopener noreferrer" className="font-condensed inline-flex items-center gap-2 rounded-md bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-background shadow-lg transition-all hover:bg-gold-light hover:translate-x-1">
                  Leer online <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {item.pdf_url && (
                <a href={item.pdf_url} target="_blank" rel="noopener noreferrer" className="font-condensed inline-flex items-center gap-2 rounded-md border border-gold/60 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gold transition-all hover:bg-gold/10">
                  Descargar PDF
                </a>
              )}
              <Link to="/revista" className="font-condensed inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground transition-all hover:border-gold hover:text-gold">
                Ver todas las ediciones
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

