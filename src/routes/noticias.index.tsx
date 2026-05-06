import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Calendar, Eye, User as UserIcon, Newspaper, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdBannerSmall } from "@/components/site/AdBannerSmall";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/i18n/format";

type News = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  author: string;
  legacy_tag: string | null;
  image_url: string | null;
  views_count: number;
  published_at: string;
  news_categories: { name: string; slug: string; scope: string } | null;
};

type Category = { id: string; name: string; slug: string; scope: string };

export const Route = createFileRoute("/noticias/")({
  head: () => ({
    meta: [
      { title: "Noticias — RollerZone" },
      {
        name: "description",
        content:
          "Todas las noticias del patinaje de velocidad: nacionales, internacionales y reportajes.",
      },
      { property: "og:title", content: "Noticias — RollerZone" },
      {
        property: "og:description",
        content: "Todas las noticias del patinaje de velocidad.",
      },
    ],
  }),
  component: NoticiasIndexPage,
});

function NoticiasIndexPage() {
  const [news, setNews] = useState<News[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [scope, setScope] = useState<"all" | "Nacional" | "Internacional">("all");

  useEffect(() => {
    supabase
      .from("news")
      .select(
        "id, title, slug, excerpt, author, legacy_tag, image_url, views_count, published_at, news_categories(name, slug, scope)"
      )
      .eq("published", true)
      .order("published_at", { ascending: false })
      .then(({ data }) => setNews((data as unknown as News[]) ?? []));

    supabase
      .from("news_categories")
      .select("id, name, slug, scope")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setCategories((data as Category[]) ?? []));
  }, []);

  const filtered = useMemo(() => {
    if (!news) return null;
    if (scope === "all") return news;
    return news.filter((n) => n.news_categories?.scope === scope);
  }, [news, scope]);

  const tabs: { key: "all" | "Nacional" | "Internacional"; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "Nacional", label: "Nacional" },
    { key: "Internacional", label: "Internacional" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8">
        <p className="font-condensed text-xs uppercase tracking-widest text-gold">Sección</p>
        <h1 className="font-display text-5xl tracking-widest md:text-6xl">
          Todas las <span className="text-gold">noticias</span>
        </h1>
        <div className="mt-4 h-[2px] w-24 bg-gold" aria-hidden="true" />
      </header>

      {/* Filtros tabs */}
      <div
        role="tablist"
        aria-label="Filtrar noticias por ámbito"
        className="mb-6 flex flex-wrap gap-2"
      >
        {tabs.map((tab) => {
          const active = scope === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active}
              onClick={() => setScope(tab.key)}
              className={
                "font-condensed px-4 py-2 text-xs uppercase tracking-widest transition-colors " +
                (active
                  ? "border border-gold bg-gold text-background"
                  : "border border-border bg-transparent text-muted-foreground hover:border-gold hover:text-gold")
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Subcategorías rápidas */}
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {categories
            .filter((c) => scope === "all" || c.scope === scope)
            .map((c) => (
              <Link
                key={c.id}
                to="/noticias/$slug"
                params={{ slug: c.slug }}
                className="font-condensed border border-border bg-surface px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground hover:border-gold hover:text-gold"
              >
                {c.name}
              </Link>
            ))}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {filtered === null ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <NewsSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyNews />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((n) => (
                <NewsListCard key={n.id} news={n} />
              ))}
            </div>
          )}
        </div>
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <AdBannerSmall placement="noticias_side" />
        </aside>
      </div>
    </div>
  );
}

function NewsSkeleton() {
  return (
    <div className="overflow-hidden border border-border bg-surface">
      <div className="aspect-[16/10] animate-pulse bg-surface-2" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-24 animate-pulse bg-surface-2" />
        <div className="h-4 w-full animate-pulse bg-surface-2" />
        <div className="h-4 w-3/4 animate-pulse bg-surface-2" />
        <div className="h-3 w-1/2 animate-pulse bg-surface-2" />
      </div>
    </div>
  );
}

function EmptyNews() {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-border bg-surface px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-background">
        <Inbox className="h-7 w-7 text-gold" aria-hidden="true" />
      </div>
      <h2 className="font-display text-2xl tracking-widest text-foreground">
        Sin noticias por ahora
      </h2>
      <p className="font-condensed mt-2 max-w-sm text-sm uppercase tracking-wider text-muted-foreground">
        Aún no hay noticias publicadas en esta sección. Vuelve pronto o explora el resto del sitio.
      </p>
      <Link
        to="/"
        className="font-condensed mt-6 inline-flex items-center gap-2 border border-gold px-4 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold hover:text-background"
      >
        <Newspaper className="h-4 w-4" /> Volver al inicio
      </Link>
    </div>
  );
}

function NewsListCard({ news }: { news: News }) {
  return (
    <Link
      to="/noticias/articulo/$slug"
      params={{ slug: news.slug }}
      className="group block overflow-hidden border border-border bg-surface transition-colors hover:border-gold"
      aria-label={`Leer noticia: ${news.title}`}
    >
      <div className="aspect-[16/10] overflow-hidden bg-surface-2">
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
      <div className="p-4">
        <div className="font-condensed mb-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest">
          {news.news_categories && (
            <span className="bg-gold/15 px-2 py-0.5 font-bold text-gold">{news.news_categories.name}</span>
          )}
          {news.legacy_tag && <span className="text-muted-foreground">{news.legacy_tag}</span>}
        </div>
        <h3 className="font-display clamp-2 text-lg leading-tight tracking-wide group-hover:text-gold">
          {news.title}
        </h3>
        {news.excerpt && (
          <p className="clamp-2 mt-2 text-sm text-muted-foreground">{news.excerpt}</p>
        )}
        <div className="font-condensed mt-3 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-1"><UserIcon className="h-3 w-3" /> {news.author}</span>
          {news.views_count > 0 && (
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {news.views_count}</span>
          )}
          <span className="ml-auto flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(news.published_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
          </span>
        </div>
      </div>
    </Link>
  );
}
