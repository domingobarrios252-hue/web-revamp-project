import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Eye, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Category = { id: string; name: string; slug: string; scope: string; description: string | null };
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
};

export const Route = createFileRoute("/noticias/$slug")({
  loader: async ({ params }) => {
    const { data: cat } = await supabase
      .from("news_categories")
      .select("id, name, slug, scope, description")
      .eq("slug", params.slug)
      .maybeSingle();
    if (!cat) throw notFound();
    return { category: cat as Category };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `Noticias ${loaderData.category.name} — RollerZone` },
          {
            name: "description",
            content: `Últimas noticias del patinaje de velocidad en ${loaderData.category.name}.`,
          },
          {
            property: "og:title",
            content: `Noticias ${loaderData.category.name} — RollerZone`,
          },
          {
            property: "og:description",
            content: `Últimas noticias del patinaje de velocidad en ${loaderData.category.name}.`,
          },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="font-display text-4xl tracking-widest">Sección no encontrada</h1>
      <Link to="/noticias" className="mt-6 inline-block text-gold hover:underline">
        ← Ver todas las noticias
      </Link>
    </div>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const [news, setNews] = useState<News[] | null>(null);

  useEffect(() => {
    supabase
      .from("news")
      .select(
        "id, title, slug, excerpt, author, legacy_tag, image_url, views_count, published_at"
      )
      .eq("published", true)
      .eq("category_id", category.id)
      .order("published_at", { ascending: false })
      .then(({ data }) => setNews((data as News[]) ?? []));
  }, [category.id]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <nav className="font-condensed mb-3 text-xs uppercase tracking-widest text-muted-foreground">
        <Link to="/noticias" className="hover:text-gold">Noticias</Link>
        <span className="mx-2 text-gold">/</span>
        <span className="text-gold">{category.scope}</span>
        <span className="mx-2 text-gold">/</span>
        <span>{category.name}</span>
      </nav>
      <h1 className="font-display text-4xl tracking-widest md:text-5xl">
        {category.name}
      </h1>
      {category.description && (
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{category.description}</p>
      )}

      <div className="mt-8">
        {news === null ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-64 animate-pulse bg-surface" />
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="border border-border bg-surface p-10 text-center">
            <p className="text-muted-foreground">
              Aún no hay noticias publicadas en {category.name}.
            </p>
            <Link to="/noticias" className="font-condensed mt-4 inline-block text-xs uppercase tracking-widest text-gold hover:underline">
              ← Ver todas las noticias
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => (
              <Card key={n.id} news={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ news }: { news: News }) {
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
