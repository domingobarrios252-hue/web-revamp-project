import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Eye, Calendar, User as UserIcon, ArrowRight, Trophy, Mic, MapPin, BookOpen, Heart, ExternalLink, UsersRound } from "lucide-react";
import { Ticker } from "@/components/site/Ticker";
import { supabase } from "@/integrations/supabase/client";

type RankingPreview = {
  id: string;
  full_name: string;
  slug: string;
  photo_url: string | null;
  total_points: number;
  clubs: { name: string; logo_url: string | null } | null;
  regions: { name: string; code: string; flag_url: string | null } | null;
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
      .limit(7)
      .then(({ data }) => {
        if (!cancelled) setNews((data as unknown as News[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = news?.find((n) => n.featured) ?? news?.[0];
  const rest = news?.filter((n) => n.id !== featured?.id) ?? [];

  return (
    <>
      {/* HERO */}
      <section className="relative h-[480px] overflow-hidden bg-surface md:h-[560px]">
        <div className="hero-grid-bg absolute inset-0" />
        {featured?.image_url && (
          <img
            src={featured.image_url}
            alt={featured.title}
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        )}
        <div className="font-display pointer-events-none absolute right-[3%] top-1/2 -translate-y-1/2 select-none text-[clamp(140px,18vw,280px)] leading-none tracking-tighter text-gold/[.07]">
          01
        </div>
        <div className="relative z-10 flex h-full max-w-[700px] flex-col justify-end p-6 md:p-10">
          <div className="live-tag font-condensed mb-4 inline-flex w-fit items-center gap-2 bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-[2px] text-background">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-background" />
            En Vivo · Abril 2026
          </div>
          <h1 className="font-display text-[clamp(36px,6vw,72px)] uppercase leading-none tracking-wider text-foreground">
            {featured?.title ?? "RollerZone"}
          </h1>
          <p className="font-condensed mt-3 text-sm uppercase tracking-wider text-muted-foreground">
            {featured?.news_categories?.name ?? "Patinaje de velocidad"} ·{" "}
            <span className="text-gold">{featured?.author}</span>
          </p>
          <p className="mt-3 max-w-md text-sm text-foreground/75 md:text-base">
            {featured?.excerpt ?? "El medio del patinaje de velocidad."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {featured && (
              <Link
                to="/noticias/articulo/$slug"
                params={{ slug: featured.slug }}
                className="font-condensed inline-flex items-center gap-2 bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-gold-dark"
              >
                Leer noticia <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
            <Link
              to="/noticias"
              className="font-condensed inline-flex items-center gap-2 border border-border bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold/10"
            >
              Ver todas
            </Link>
          </div>
        </div>
      </section>

      <Ticker />

      {/* NOTICIAS */}
      <section id="noticias" className="mx-auto max-w-7xl px-6 py-12">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-64 animate-pulse bg-surface" />
            ))}
          </div>
        ) : rest.length === 0 ? (
          <p className="text-muted-foreground">No hay noticias publicadas aún.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rest.slice(0, 6).map((n) => (
              <NewsCard key={n.id} news={n} />
            ))}
          </div>
        )}
      </section>

      <RankingPreviewSection />
      <InterviewsPreviewSection />
      <EventsPreviewSection />
      <MagazinePreviewSection />
      <SponsorsCarouselSection />
      <TeamSection />
    </>
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
  const [top, setTop] = useState<RankingPreview[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("skaters")
      .select(
        "id, full_name, slug, photo_url, total_points, clubs(name, logo_url), regions(name, code, flag_url)"
      )
      .eq("active", true)
      .order("total_points", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (!cancelled) setTop((data as unknown as RankingPreview[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="ranking" className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="font-display flex items-center gap-2 text-2xl tracking-widest md:text-3xl">
          <Trophy className="h-6 w-6 text-gold" />
          Top <span className="text-gold">ranking</span>
        </h2>
        <Link
          to="/ranking"
          className="font-condensed text-xs font-bold uppercase tracking-widest text-gold hover:text-gold-dark"
        >
          Ver completo →
        </Link>
      </div>

      {top === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse bg-surface" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no hay patinadores en el ranking. Pide al admin que los añada desde el panel.
        </p>
      ) : (
        <div className="overflow-hidden border border-border">
          {top.map((s, i) => (
            <Link
              key={s.id}
              to="/ranking/$slug"
              params={{ slug: s.slug }}
              className="flex items-center gap-3 border-b border-border/60 bg-surface px-4 py-3 transition-colors last:border-0 hover:bg-surface/60"
            >
              <span
                className={`font-display w-8 text-2xl ${
                  i === 0 ? "text-gold" : i < 3 ? "text-gold/70" : "text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <div className="h-10 w-10 shrink-0 overflow-hidden border border-border bg-surface-2">
                {s.photo_url ? (
                  <img src={s.photo_url} alt={s.full_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="font-display flex h-full w-full items-center justify-center text-xs text-gold/40">
                    RZ
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display truncate text-sm uppercase tracking-wider">
                  {s.full_name}
                </div>
                <div className="font-condensed flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                  {s.clubs?.logo_url && (
                    <img src={s.clubs.logo_url} alt="" className="h-3 w-3 object-contain" />
                  )}
                  <span className="truncate">{s.clubs?.name ?? "Sin club"}</span>
                  {s.regions && (
                    <>
                      <span>·</span>
                      <span>{s.regions.code}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="font-display text-xl text-gold">
                {Number(s.total_points).toLocaleString("es-ES")}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
