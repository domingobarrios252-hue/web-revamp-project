import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, User as UserIcon, Clock, Star } from "lucide-react";
import { cropObjectPosition, type ImageCrops } from "@/lib/imageCrops";
import { SectionHeading } from "./SectionHeading";

export type CoverNews = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  author: string;
  image_url: string | null;
  image_crops: ImageCrops | null;
  read_minutes: number | null;
  published_at: string;
  news_categories: { name: string; slug: string; scope: string } | null;
};

export function EditorialCover({ news }: { news: CoverNews[] }) {
  if (!news || news.length === 0) return null;
  const main = news[0];
  const sides = news.slice(1, 4);

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 md:px-6 md:py-16">
      <SectionHeading
        kicker="Portada · Lo más importante"
        title="La portada de"
        accent="RollerZone"
        action={{ to: "/noticias", label: "Ver todas" }}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* PIEZA PRINCIPAL */}
        <Link
          to="/noticias/articulo/$slug"
          params={{ slug: main.slug }}
          className="group relative block overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)] ring-1 ring-gold/10 transition-all hover:border-gold hover:ring-gold/40 lg:col-span-2 lg:row-span-3"
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-surface-2 lg:aspect-[5/4]">
            {main.image_url ? (
              <img
                src={main.image_url}
                alt={main.title}
                style={{ objectPosition: cropObjectPosition(main.image_crops, "hero") }}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                loading="eager"
              />
            ) : (
              <div className="hero-grid-bg h-full w-full" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

            {/* Etiqueta noticia principal */}
            <div className="absolute left-5 top-5 z-10 flex items-center gap-2 md:left-7 md:top-7">
              <span className="font-condensed inline-flex items-center gap-1.5 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background shadow-lg">
                <Star className="h-3 w-3" /> Noticia principal
              </span>
              {main.news_categories?.name && (
                <span className="font-condensed inline-flex items-center border border-gold/60 bg-black/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-gold backdrop-blur-sm">
                  {main.news_categories.name}
                </span>
              )}
            </div>

            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 lg:p-10">
              <div className="font-condensed mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[3px] text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {new Date(main.published_at).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {main.author && (
                  <span className="inline-flex items-center gap-1">
                    <UserIcon className="h-3 w-3" /> {main.author}
                  </span>
                )}
                {main.read_minutes && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {main.read_minutes} min
                  </span>
                )}
              </div>
              <h3 className="font-display text-2xl uppercase leading-[1.02] tracking-wider text-foreground drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)] transition-colors group-hover:text-gold md:text-4xl lg:text-[2.85rem]">
                {main.title}
              </h3>
              <div className="mt-4 h-[3px] w-16 bg-gold" aria-hidden="true" />
              {main.excerpt && (
                <p className="clamp-2 mt-4 max-w-2xl text-sm leading-relaxed text-foreground/90 md:text-base">
                  {main.excerpt}
                </p>
              )}
              <span className="font-condensed mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gold transition-transform group-hover:translate-x-1">
                Leer reportaje completo <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </Link>

        {/* PIEZAS SECUNDARIAS */}
        {sides.map((n, i) => (
          <Link
            key={n.id}
            to="/noticias/articulo/$slug"
            params={{ slug: n.slug }}
            className="group flex gap-4 overflow-hidden rounded-xl border border-border bg-surface p-3 shadow-md transition-all hover:border-gold hover:shadow-lg lg:flex-col lg:p-0"
          >
            <div className="relative h-24 w-32 shrink-0 overflow-hidden bg-surface-2 lg:h-44 lg:w-full">
              {n.image_url ? (
                <img
                  src={n.image_url}
                  alt={n.title}
                  style={{ objectPosition: cropObjectPosition(n.image_crops, "card") }}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="hero-grid-bg h-full w-full" />
              )}
              <span className="font-display absolute left-2 top-2 inline-flex h-7 w-7 items-center justify-center bg-black/70 text-xs text-gold backdrop-blur-sm">
                {String(i + 2).padStart(2, "0")}
              </span>
            </div>
            <div className="min-w-0 flex-1 lg:p-4">
              {n.news_categories?.name && (
                <span className="font-condensed mb-1 inline-block text-[10px] font-bold uppercase tracking-[2.5px] text-gold">
                  {n.news_categories.name}
                </span>
              )}
              <h4 className="font-display clamp-3 text-sm uppercase leading-snug tracking-wider text-foreground transition-colors group-hover:text-gold md:text-base">
                {n.title}
              </h4>
              <div className="font-condensed mt-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(n.published_at).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                })}
                {n.author && (
                  <>
                    <span className="text-border">·</span>
                    <span className="truncate">{n.author}</span>
                  </>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
