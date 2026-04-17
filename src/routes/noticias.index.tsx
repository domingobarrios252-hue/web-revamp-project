import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Eye, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

  const nacional = categories.filter((c) => c.scope === "Nacional");
  const internacional = categories.filter((c) => c.scope === "Internacional");

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8">
        <p className="font-condensed text-xs uppercase tracking-widest text-gold">Sección</p>
        <h1 className="font-display text-4xl tracking-widest md:text-5xl">
          Todas las <span className="text-gold">noticias</span>
        </h1>
      </header>

      <div className="mb-8 grid gap-4 border border-border bg-surface p-4 md:grid-cols-2">
        <CategoryGroup title="Nacional" categories={nacional} />
        <CategoryGroup title="Internacional" categories={internacional} />
      </div>

      {news === null ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-64 animate-pulse bg-surface" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <p className="text-muted-foreground">No hay noticias publicadas aún.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {news.map((n) => (
            <NewsListCard key={n.id} news={n} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryGroup({ title, categories }: { title: string; categories: Category[] }) {
  return (
    <div>
      <h3 className="font-display mb-2 text-sm tracking-widest text-gold">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link
            key={c.id}
            to="/noticias/$slug"
            params={{ slug: c.slug }}
            className="font-condensed border border-border bg-background px-3 py-1.5 text-xs uppercase tracking-wider text-foreground hover:border-gold hover:text-gold"
          >
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

function NewsListCard({ news }: { news: News }) {
  return (
    <Link
      to="/noticias/articulo/$slug"
      params={{ slug: news.slug }}
      className="group block overflow-hidden border border-border bg-surface transition-colors hover:border-gold"
    >
      <div className="aspect-[16/10] overflow-hidden bg-surface-2">
        {news.image_url ? (
          <img src={news.image_url} alt={news.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
        <p className="clamp-2 mt-2 text-sm text-muted-foreground">{news.excerpt}</p>
        <div className="font-condensed mt-3 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-1"><UserIcon className="h-3 w-3" /> {news.author}</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {news.views_count}</span>
          <span className="ml-auto flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(news.published_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
          </span>
        </div>
      </div>
    </Link>
  );
}
