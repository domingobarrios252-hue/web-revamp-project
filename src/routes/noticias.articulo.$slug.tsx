import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Eye, User as UserIcon, Instagram, Facebook, MessageCircle, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorHash } from "@/lib/visitor";
import { toast } from "sonner";
import { AdBannerSmall } from "@/components/site/AdBannerSmall";
import { CroppedImage } from "@/components/site/CroppedImage";
import { Lightbox } from "@/components/site/Lightbox";
import { NewsVideoPlayer } from "@/components/site/NewsVideoPlayer";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
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

export const Route = createFileRoute("/noticias/articulo/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("news")
      .select(
        "id, title, slug, excerpt, content, author, writer_id, writers(id, full_name, published), legacy_tag, image_url, image_crops, hero_display_mode, gallery, video_url, video_embed_url, video_poster_url, read_minutes, views_count, published_at, updated_at, country_code, news_categories(id, name, slug, scope)"
      )
      .eq("slug", params.slug)
      .maybeSingle();
    if (!data) throw notFound();
    return { article: data as unknown as Article };
  },

  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Noticia — RollerZone" }] };
    const a = loaderData.article;
    const canonical = `https://rollerzone.es/noticias/articulo/${params.slug}`;
    const desc = (a.excerpt ?? a.title).slice(0, 160);
    const author = a.writers?.full_name ?? a.author ?? "RollerZone Spain";
    const publishedIso = a.published_at ? new Date(a.published_at).toISOString() : undefined;
    const modifiedIso = a.updated_at ? new Date(a.updated_at).toISOString() : publishedIso;
    const FALLBACK_OG = "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/96e18c62-051f-45d8-b718-d61cb204c1d5";
    const rawImage = a.video_poster_url ?? a.image_url ?? null;
    const toAbsolute = (u: string | null): string => {
      if (!u) return FALLBACK_OG;
      if (/^https?:\/\//i.test(u)) return u;
      if (u.startsWith("//")) return `https:${u}`;
      if (u.startsWith("/")) return `https://rollerzone.es${u}`;
      return FALLBACK_OG;
    };
    const image = toAbsolute(rawImage);
    const plain = (a.content ?? "").replace(/\s+/g, " ").trim();
    const wordCount = plain ? plain.split(" ").filter(Boolean).length : undefined;
    const bodySnippet = plain ? plain.slice(0, 500) : undefined;
    const lang = a.country_code === "co" ? "es-CO" : "es-ES";
    const keywords = [a.news_categories?.name, a.legacy_tag]
      .filter((v): v is string => Boolean(v));

    const newsLd = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: a.title.slice(0, 110),
      description: desc,
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      url: canonical,
      inLanguage: lang,
      isAccessibleForFree: true,
      ...(image ? { image: [image] } : {}),
      ...(publishedIso ? { datePublished: publishedIso } : {}),
      ...(modifiedIso ? { dateModified: modifiedIso } : {}),
      ...(wordCount ? { wordCount } : {}),
      ...(bodySnippet ? { articleBody: bodySnippet } : {}),
      ...(keywords.length ? { keywords: keywords.join(", ") } : {}),
      author: [
        {
          "@type": "Person",
          name: author,
          ...(a.writers?.published && a.writer_id
            ? { url: `https://rollerzone.es/redactores/${a.writer_id}` }
            : {}),
        },
      ],
      publisher: {
        "@type": "Organization",
        name: "RollerZone",
        logo: {
          "@type": "ImageObject",
          url: "https://rollerzone.es/favicon.ico",
        },
      },
      ...(a.news_categories?.name ? { articleSection: a.news_categories.name } : {}),
    };

    const crumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://rollerzone.es/" },
        { "@type": "ListItem", position: 2, name: "Noticias", item: "https://rollerzone.es/noticias" },
        ...(a.news_categories
          ? [{
              "@type": "ListItem",
              position: 3,
              name: a.news_categories.name,
              item: `https://rollerzone.es/noticias/${a.news_categories.slug}`,
            }]
          : []),
        { "@type": "ListItem", position: a.news_categories ? 4 : 3, name: a.title, item: canonical },
      ],
    };

    return {
      meta: [
        { title: `${a.title} — RollerZone` },
        { name: "description", content: desc },
        { name: "author", content: author },
        { property: "og:title", content: a.title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        { property: "og:site_name", content: "RollerZone" },
        { property: "og:locale", content: "es_ES" },
        ...(publishedIso ? [{ property: "article:published_time", content: publishedIso }] : []),
        { property: "article:author", content: author },
        ...(a.news_categories ? [{ property: "article:section", content: a.news_categories.name }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: a.title },
        { name: "twitter:description", content: desc },
        { property: "og:image", content: image },
        { property: "og:image:secure_url", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: a.title },
        { name: "twitter:image", content: image },
        { name: "twitter:image:alt", content: a.title },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(newsLd).replace(/</g, "\\u003c") },
        { type: "application/ld+json", children: JSON.stringify(crumbLd).replace(/</g, "\\u003c") },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="font-display text-4xl tracking-widest">Noticia no encontrada</h1>
      <Link to="/noticias" className="mt-6 inline-block text-gold hover:underline">
        ← Volver a noticias
      </Link>
    </div>
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
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
    // Instagram doesn't support direct URL sharing; copy link as fallback
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Enlace copiado", {
        description: "Pégalo en tu historia o publicación de Instagram.",
      });
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    });
  };
  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };
  const shareWhatsapp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${article.title} ${url}`)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };
  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success("Enlace copiado al portapapeles");
  };

  const paragraphs: string[] = (article.content ?? "")
    .split("\n")
    .map((p: string) => p.trim())
    .filter((p: string) => p.length > 0);

  return (
    <article
      className="mx-auto max-w-4xl px-6 py-10"
      itemScope
      itemType="https://schema.org/NewsArticle"
    >
      <nav className="font-condensed mb-3 text-xs uppercase tracking-widest text-muted-foreground">
        <Link to="/noticias" className="hover:text-gold">Noticias</Link>
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
          {article.title}
        </h1>
        {article.excerpt && (
          <p itemProp="description" className="mt-3 text-base text-muted-foreground md:text-lg">
            {article.excerpt}
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
              {new Date(article.published_at).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </time>
          </span>
          {article.updated_at && article.updated_at !== article.published_at && (
            <span className="text-muted-foreground/70">
              Actualizado{" "}
              <time dateTime={new Date(article.updated_at).toISOString()} itemProp="dateModified">
                {new Date(article.updated_at).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-gold" />
            {views} visita{views === 1 ? "" : "s"}
          </span>
          {article.read_minutes && (
            <span className="ml-auto text-muted-foreground/70">
              {article.read_minutes} min de lectura
            </span>
          )}
        </div>
      </header>

      {article.image_url && (() => {
        const catName = article.news_categories?.name;
        const heroAlt = catName
          ? `${article.title} — ${catName} · RollerZone`
          : `${article.title} · RollerZone`;
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
        title={article.title}
      />



      <div className="prose prose-invert max-w-none space-y-4 text-[16px] leading-relaxed text-foreground/90">
        {paragraphs.length === 0 ? (
          <p className="italic text-muted-foreground">
            (Sin contenido — añade el cuerpo del artículo desde el panel de administración)
          </p>
        ) : (
          paragraphs.map((p: string, i: number) => <p key={i}>{p}</p>)
        )}
      </div>

      {Array.isArray(article.gallery) && article.gallery.length > 0 && (
        <section className="mt-10">
          <h3 className="font-display mb-4 text-sm uppercase tracking-widest text-gold">
            Galería de fotos
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {article.gallery.map((src: string, i: number) => (
              <button
                type="button"
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="group block aspect-square overflow-hidden border border-border bg-black"
                aria-label={`Abrir foto ${i + 1}`}
              >
                <img
                  src={src}
                  alt={`${article.title} — foto ${i + 1}${article.news_categories?.name ? ` · ${article.news_categories.name}` : ""}`}
                  title={`${article.title} — foto ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
          <p className="font-condensed mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            Toca una miniatura para verla completa
          </p>
        </section>
      )}

      {lightboxIndex !== null && Array.isArray(article.gallery) && (
        <Lightbox
          images={article.gallery}
          startIndex={lightboxIndex}
          alt={article.title}
          onClose={() => setLightboxIndex(null)}
        />
      )}


      {/* Banner publicidad in-article */}
      <div className="mt-10">
        <AdBannerSmall placement="noticias_article" />
      </div>

      {/* Compartir */}
      <div className="mt-10 border-t border-border pt-6">
        <h3 className="font-display mb-3 text-sm tracking-widest text-gold">Compartir</h3>
        <div className="flex flex-wrap gap-2">
          <ShareBtn label="Instagram" onClick={shareInstagram} icon={<Instagram className="h-4 w-4" />} />
          <ShareBtn label="Facebook" onClick={shareFacebook} icon={<Facebook className="h-4 w-4" />} />
          <ShareBtn label="WhatsApp" onClick={shareWhatsapp} icon={<MessageCircle className="h-4 w-4" />} />
          <ShareBtn label="Copiar enlace" onClick={copyLink} icon={<LinkIcon className="h-4 w-4" />} />
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
