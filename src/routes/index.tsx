import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, Calendar, User as UserIcon, ArrowRight, Trophy } from "lucide-react";
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
      <PlaceholderSection
        id="entrevistas"
        title="Entrevistas"
        text="Próximamente: entrevistas con galería de fotos en carrusel."
      />
      <PlaceholderSection
        id="eventos"
        title="Eventos"
        text="Próximamente: eventos con categorías que pueden participar y enlaces a web/redes."
      />
      <PlaceholderSection
        id="revista"
        title="Revista"
        text="Próximamente: portadas con fecha de edición editables desde el panel."
      />
      <PlaceholderSection
        id="patrocinadores"
        title="Patrocinadores"
        text="Próximamente: logos en formato 500×200."
      />
      <PlaceholderSection
        id="equipo"
        title="Equipo"
        text="Próximamente: miembros del equipo editables desde el panel."
      />
    </>
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
