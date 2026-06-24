import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/i18n/format";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type RelatedNews = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string;
  competition_tag: string | null;
  news_categories: { name: string; slug: string } | null;
};

/**
 * Muestra noticias relacionadas con la selección española y/o el Europeo 2026.
 * Criterios (cualquiera):
 *  - competition_tag = 'europeo-2026' | 'camino-al-europeo-2026' | 'seleccion-espanola'
 *  - categoría con slug 'seleccion-espanola'
 *  - legacy_tag con palabras clave
 */
export function RelatedSelectionNews({ limit = 8 }: { limit?: number }) {
  const { lang } = useLanguage();
  const [items, setItems] = useState<RelatedNews[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tags = ["europeo-2026", "camino-al-europeo-2026", "seleccion-espanola"];
    supabase
      .from("news")
      .select(
        "id, title, slug, excerpt, image_url, published_at, competition_tag, legacy_tag, news_categories(name, slug)"
      )
      .eq("published", true)
      .or(
        [
          `competition_tag.in.(${tags.join(",")})`,
          `legacy_tag.ilike.%europeo%`,
          `legacy_tag.ilike.%selecci%`,
        ].join(",")
      )
      .order("published_at", { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        if (cancelled) return;
        setItems((data as unknown as RelatedNews[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return (
    <section className="bg-surface/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
              Bloque vivo
            </div>
            <h2 className="font-display mt-2 text-3xl uppercase tracking-wider text-foreground md:text-4xl">
              Actualidad de la selección española
            </h2>
            <div className="mt-3 h-[3px] w-24 bg-gold" />
          </div>
          <Link
            to="/noticias"
            className="font-condensed inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[2.5px] text-gold hover:text-gold-light"
          >
            Ver todas las noticias <ArrowRight className="h-3 w-3" />
          </Link>
        </header>

        {items === null ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface">
                <div className="aspect-[16/9] animate-pulse bg-surface-2" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 animate-pulse bg-surface-2" />
                  <div className="h-3 w-1/2 animate-pulse bg-surface-2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Aún no hay noticias publicadas en este bloque. Las noticias que se
              etiqueten con <code className="text-gold">europeo-2026</code> o se
              asignen a la selección española aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((n) => (
              <Link
                key={n.id}
                to="/noticias/articulo/$slug"
                params={{ slug: n.slug }}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lg transition-all hover:-translate-y-1 hover:border-gold hover:shadow-[0_15px_40px_-10px_rgba(212,160,23,0.35)]"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
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
                  {n.news_categories?.name && (
                    <span className="font-condensed absolute left-3 top-3 inline-block bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-background shadow-md">
                      {n.news_categories.name}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display clamp-2 text-base uppercase leading-snug tracking-wider text-foreground transition-colors group-hover:text-gold">
                    {n.title}
                  </h3>
                  {n.excerpt && (
                    <p className="clamp-2 mt-2 text-sm text-muted-foreground">{n.excerpt}</p>
                  )}
                  <div className="font-condensed mt-4 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(n.published_at, lang)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
