import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Calendar, Eye, User as UserIcon, Instagram, Facebook, MessageCircle, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorHash } from "@/lib/visitor";
import { toast } from "sonner";
import { RelatedContent } from "@/components/site/RelatedContent";
import { AdBannerSmall } from "@/components/site/AdBannerSmall";
import { CroppedImage } from "@/components/site/CroppedImage";
import { Lightbox } from "@/components/site/Lightbox";
import { NewsVideoPlayer } from "@/components/site/NewsVideoPlayer";
import { NewsContentBlocks } from "@/components/site/NewsContentBlocks";
import { parseBlocks, type NewsBlock } from "@/lib/newsBlocks";

export type ArticleViewData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  content_blocks: unknown;
  author: string;
  writer_id: string | null;
  writers: { id: string; full_name: string; published: boolean } | null;
  legacy_tag: string | null;
  image_url: string | null;
  image_crops: import("@/lib/imageCrops").ImageCrops | null;
  hero_display_mode: "crop" | "full" | null;
  gallery: string[] | null;
  video_url: string | null;
  video_embed_url: string | null;
  video_poster_url: string | null;
  read_minutes: number | null;
  views_count: number;
  published_at: string;
  updated_at: string | null;
  country_code: string | null;
  news_categories: { id: string; name: string; slug: string; scope: string } | null;
};

type Props = {
  article: ArticleViewData;
  locale: "es" | "en";
  overrides?: { title?: string; subtitle?: string | null; excerpt?: string | null; blocks?: NewsBlock[]; content?: string | null };
  backTo: { to: string; label: string };
};

const T = {
  es: {
    news: "Noticias",
    updated: "Actualizado",
    visits: (n: number) => `${n} visita${n === 1 ? "" : "s"}`,
    readMin: (n: number) => `${n} min de lectura`,
    gallery: "Galería de fotos",
    galleryHint: "Toca una miniatura para verla completa",
    openPhoto: (i: number) => `Abrir foto ${i}`,
    share: "Compartir",
    copyLink: "Copiar enlace",
    linkCopied: "Enlace copiado al portapapeles",
    igCopied: "Enlace copiado",
    igHint: "Pégalo en tu historia o publicación de Instagram.",
    empty: "(Sin contenido — añade el cuerpo del artículo desde el panel de administración)",
    dateLocale: "es-ES",
  },
  en: {
    news: "News",
    updated: "Updated",
    visits: (n: number) => `${n} view${n === 1 ? "" : "s"}`,
    readMin: (n: number) => `${n} min read`,
    gallery: "Photo gallery",
    galleryHint: "Tap a thumbnail to view it full size",
    openPhoto: (i: number) => `Open photo ${i}`,
    share: "Share",
    copyLink: "Copy link",
    linkCopied: "Link copied to clipboard",
    igCopied: "Link copied",
    igHint: "Paste it in your Instagram story or post.",
    empty: "(No content yet)",
    dateLocale: "en-GB",
  },
} as const;

export function NewsArticleView({ article, locale, overrides, backTo }: Props) {
  const t = T[locale];
  const title = overrides?.title ?? article.title;
  const excerpt = overrides?.excerpt !== undefined ? overrides.excerpt : article.excerpt;
  const [views, setViews] = useState(article.views_count);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const url = typeof window !== "undefined" ? window.location.href : "";

  // Register a unique view per visitor
  useEffect(() => {
    const hash = getVisitorHash();
    supabase
      .rpc("register_news_view", { _news_id: article.id, _visitor_hash: hash })
      .then(({ data, error }) => {
        if (!error && typeof data === "number") setViews(data);
      });
  }, [article.id]);

  const shareInstagram = () => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success(t.igCopied, { description: t.igHint });
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    });
  };
  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  const shareWhatsapp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success(t.linkCopied);
  };

  const blocks = overrides?.blocks ?? parseBlocks(article.content_blocks);
  const paragraphs: string[] = (overrides?.content !== undefined ? overrides.content ?? "" : article.content ?? "")
    .split("\n")
    .map((p: string) => p.trim())
    .filter((p: string) => p.length > 0);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(t.dateLocale, { day: "2-digit", month: "long", year: "numeric" });

  return (
    <article
      className="mx-auto max-w-4xl px-6 py-10"
      itemScope
      itemType="https://schema.org/NewsArticle"
    >
      <nav className="font-condensed mb-3 text-xs uppercase tracking-widest text-muted-foreground">
        <Link to={backTo.to} className="hover:text-gold">{backTo.label}</Link>
        {article.news_categories && (
          <>
            <span className="mx-2 text-gold">/</span>
            <Link
              to="/noticias/$slug"
              params={{ slug: article.news_categories.slug }}
              className="hover:text-gold"
            >
              {article.news_categories.name}
            </Link>
          </>
        )}
      </nav>

      <header className="mb-6">
        <div className="font-condensed mb-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest">
          {article.news_categories && (
            <span className="bg-gold/15 px-2 py-1 font-bold text-gold">
              {article.news_categories.name}
            </span>
          )}
          {article.legacy_tag && (
            <span className="border border-border px-2 py-1 text-muted-foreground">
              {article.legacy_tag}
            </span>
          )}
        </div>
        <h1
          itemProp="headline"
          className="font-display text-3xl uppercase leading-tight tracking-wider md:text-5xl"
        >
          {title}
        </h1>
        {overrides?.subtitle && <p className="mt-2 text-lg leading-relaxed text-foreground/90">{overrides.subtitle}</p>}
        {excerpt && (
          <p itemProp="description" className="mt-3 text-base text-muted-foreground md:text-lg">
            {excerpt}
          </p>
        )}

        <div className="font-condensed mt-5 flex flex-wrap items-center gap-4 border-y border-border py-3 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <UserIcon className="h-3.5 w-3.5 text-gold" />
            {article.writers?.published && article.writer_id ? (
              <Link
                to="/redactores/$id"
                params={{ id: article.writer_id }}
                rel="author"
                className="text-foreground hover:text-gold hover:underline"
              >
                <span itemProp="author">{article.writers.full_name}</span>
              </Link>
            ) : (
              <span rel="author" itemProp="author" className="text-foreground">
                {article.author}
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gold" />
            <time dateTime={new Date(article.published_at).toISOString()} itemProp="datePublished">
              {fmtDate(article.published_at)}
            </time>
          </span>
          {article.updated_at && article.updated_at !== article.published_at && (
            <span className="text-muted-foreground/70">
              {t.updated}{" "}
              <time dateTime={new Date(article.updated_at).toISOString()} itemProp="dateModified">
                {fmtDate(article.updated_at)}
              </time>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-gold" />
            {t.visits(views)}
          </span>
          {article.read_minutes && (
            <span className="ml-auto text-muted-foreground/70">
              {t.readMin(article.read_minutes)}
            </span>
          )}
        </div>
      </header>

      {article.image_url && (() => {
        const catName = article.news_categories?.name;
        const heroAlt = catName
          ? `${title} — ${catName} · RollerZone`
          : `${title} · RollerZone`;
        return article.hero_display_mode === "crop" ? (
          <figure className="mb-8 overflow-hidden border border-border bg-black">
            <CroppedImage
              src={article.image_url}
              alt={heroAlt}
              crops={article.image_crops}
              ratio="hero"
              loading="eager"
            />
          </figure>
        ) : (
          <figure className="mb-8 flex max-h-[70vh] w-full items-center justify-center overflow-hidden border border-border bg-black">
            <img
              src={article.image_url}
              alt={heroAlt}
              title={heroAlt}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="max-h-[70vh] w-full object-contain"
            />
          </figure>
        );
      })()}

      <NewsVideoPlayer
        fileUrl={article.video_url}
        embedUrl={article.video_embed_url}
        posterUrl={article.video_poster_url ?? article.image_url}
        title={title}
      />

      {blocks.length > 0 ? (
        <NewsContentBlocks blocks={blocks} title={title} />
      ) : (
        <div className="prose prose-invert max-w-none space-y-4 text-[16px] leading-relaxed text-foreground/90">
          {paragraphs.length === 0 ? (
            <p className="italic text-muted-foreground">{t.empty}</p>
          ) : (
            paragraphs.map((p: string, i: number) => <p key={i}>{p}</p>)
          )}
        </div>
      )}

      {Array.isArray(article.gallery) && article.gallery.length > 0 && (
        <section className="mt-10">
          <h3 className="font-display mb-4 text-sm uppercase tracking-widest text-gold">
            {t.gallery}
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {article.gallery.map((src: string, i: number) => (
              <button
                type="button"
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="group block aspect-square overflow-hidden border border-border bg-black"
                aria-label={t.openPhoto(i + 1)}
              >
                <img
                  src={src}
                  alt={`${title} — photo ${i + 1}${article.news_categories?.name ? ` · ${article.news_categories.name}` : ""}`}
                  title={`${title} — photo ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
          <p className="font-condensed mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            {t.galleryHint}
          </p>
        </section>
      )}

      {lightboxIndex !== null && Array.isArray(article.gallery) && (
        <Lightbox
          images={article.gallery}
          startIndex={lightboxIndex}
          alt={title}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <RelatedContent countryCode={article.country_code} excludeId={article.id} />

      {/* Banner publicidad in-article */}
      <div className="mt-10">
        <AdBannerSmall placement="noticias_article" />
      </div>

      {/* Compartir */}
      <div className="mt-10 border-t border-border pt-6">
        <h3 className="font-display mb-3 text-sm tracking-widest text-gold">{t.share}</h3>
        <div className="flex flex-wrap gap-2">
          <ShareBtn label="Instagram" onClick={shareInstagram} icon={<Instagram className="h-4 w-4" />} />
          <ShareBtn label="Facebook" onClick={shareFacebook} icon={<Facebook className="h-4 w-4" />} />
          <ShareBtn label="WhatsApp" onClick={shareWhatsapp} icon={<MessageCircle className="h-4 w-4" />} />
          <ShareBtn label={t.copyLink} onClick={copyLink} icon={<LinkIcon className="h-4 w-4" />} />
        </div>
      </div>
    </article>
  );
}

function ShareBtn({ label, onClick, icon }: { label: string; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="font-condensed inline-flex items-center gap-2 border border-border bg-surface px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:border-gold hover:text-gold"
    >
      {icon} {label}
    </button>
  );
}
