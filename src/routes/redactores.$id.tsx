import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PenLine, Calendar, Eye, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Writer = {
  id: string;
  full_name: string;
  bio: string | null;
  photo_url: string | null;
};

type WriterNews = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string;
  views_count: number;
};

export const Route = createFileRoute("/redactores/$id")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("writers")
      .select("id, full_name, bio, photo_url, published")
      .eq("id", params.id)
      .maybeSingle();
    if (!data || !(data as { published: boolean }).published) throw notFound();
    return { writer: data as unknown as Writer };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.writer.full_name} — Redactores RollerZone` },
          {
            name: "description",
            content:
              loaderData.writer.bio ??
              `Artículos publicados por ${loaderData.writer.full_name} en RollerZone.`,
          },
          { property: "og:title", content: `${loaderData.writer.full_name} — RollerZone` },
          { property: "og:description", content: loaderData.writer.bio ?? "" },
          ...(loaderData.writer.photo_url
            ? [
                { property: "og:image", content: loaderData.writer.photo_url },
                { name: "twitter:image", content: loaderData.writer.photo_url },
              ]
            : []),
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="font-display text-4xl tracking-widest">Redactor no encontrado</h1>
      <Link to="/redactores" className="mt-6 inline-block text-gold hover:underline">
        ← Volver a redactores
      </Link>
    </div>
  ),
  errorComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <p className="text-muted-foreground">No se pudo cargar el redactor.</p>
    </div>
  ),
  component: WriterDetailPage,
});

function WriterDetailPage() {
  const { writer } = Route.useLoaderData();
  const [news, setNews] = useState<WriterNews[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("news")
      .select("id, title, slug, excerpt, image_url, published_at, views_count")
      .eq("writer_id", writer.id)
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(60)
      .then(({ data }) => {
        if (!cancelled) setNews((data as WriterNews[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [writer.id]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <Link
        to="/redactores"
        className="font-condensed inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Redactores
      </Link>

      <header className="mt-6 grid gap-6 border border-border bg-surface p-5 md:grid-cols-[200px_1fr] md:p-8">
        <div className="aspect-square overflow-hidden border border-border bg-background">
          {writer.photo_url ? (
            <img loading="lazy" decoding="async"
              src={writer.photo_url}
              alt={writer.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gold/30">
              <PenLine className="h-12 w-12" />
            </div>
          )}
        </div>
        <div>
          <div className="font-condensed inline-flex items-center gap-2 border border-gold/40 bg-gold/5 px-2.5 py-1 text-[10px] uppercase tracking-widest text-gold">
            <PenLine className="h-3 w-3" /> Redactor
          </div>
          <h1 className="font-display mt-3 text-3xl tracking-widest md:text-5xl">
            {writer.full_name}
          </h1>
          {writer.bio && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/80 md:text-base">
              {writer.bio}
            </p>
          )}
        </div>
      </header>

      <section className="mt-10">
        <h2 className="font-display mb-5 text-xl uppercase tracking-widest">
          Artículos <span className="text-gold">publicados</span>
        </h2>
        {news === null ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-64 animate-pulse bg-surface" />
            ))}
          </div>
        ) : news.length === 0 ? (
          <p className="border border-border bg-surface p-8 text-center text-muted-foreground">
            Este redactor aún no tiene artículos publicados.
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => (
              <Link
                key={n.id}
                to="/noticias/articulo/$slug"
                params={{ slug: n.slug }}
                className="group block overflow-hidden border border-border bg-surface transition-colors hover:border-gold"
              >
                <div className="aspect-[16/10] overflow-hidden bg-surface-2">
                  {n.image_url ? (
                    <img
                      src={n.image_url}
                      alt={n.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="hero-grid-bg flex h-full w-full items-center justify-center">
                      <span className="font-display text-4xl tracking-widest text-gold/30">RZ</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display clamp-2 text-base leading-tight tracking-wide group-hover:text-gold">
                    {n.title}
                  </h3>
                  {n.excerpt && (
                    <p className="clamp-2 mt-2 text-sm text-muted-foreground">{n.excerpt}</p>
                  )}
                  <div className="font-condensed mt-3 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(n.published_at).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    {n.views_count > 0 && (
                      <span className="ml-auto flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {n.views_count}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
