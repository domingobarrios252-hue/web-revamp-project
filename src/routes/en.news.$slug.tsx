import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { NewsArticleView, type ArticleViewData } from "@/components/site/NewsArticleView";
import { parseBlocks, blocksPlainText } from "@/lib/newsBlocks";
import { translationIsCurrent, type NewsTranslation } from "@/lib/news/translations";

const ARTICLE_SELECT =
  "id, title, slug, excerpt, content, content_blocks, author, writer_id, writers(id, full_name, published), legacy_tag, image_url, image_crops, hero_display_mode, gallery, video_url, video_embed_url, video_poster_url, read_minutes, views_count, published_at, updated_at, country_code, news_categories(id, name, slug, scope)";

export const Route = createFileRoute("/en/news/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("news")
      .select(ARTICLE_SELECT)
      .eq("slug", params.slug)
      .eq("published", true)
      .maybeSingle();
    if (!data) throw notFound();

    const { data: tr } = await supabase
      .from("news_translations")
      .select("*")
      .eq("news_id", (data as { id: string }).id)
      .eq("lang", "en")
      .eq("status", "approved")
      .maybeSingle();

    // La política pública solo devuelve traducciones aprobadas; si no llega, no existe para el lector.
    return {
      article: data as unknown as ArticleViewData,
      translation: tr && translationIsCurrent(tr as NewsTranslation, data as unknown as ArticleViewData) ? tr as NewsTranslation : null,
    };
  },

  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "News — RollerZone" }] };
    const a = loaderData.article;
    const tr = loaderData.translation;
    const enCanonical = `https://rollerzone.es/en/news/${params.slug}`;
    const esCanonical = `https://rollerzone.es/noticias/articulo/${params.slug}`;

    const title = tr?.seo_title || tr?.title || a.title;
    const desc = (tr?.seo_description || tr?.excerpt || a.excerpt || a.title).slice(0, 160);
    const author = a.writers?.full_name ?? a.author ?? "RollerZone";
    const publishedIso = a.published_at ? new Date(a.published_at).toISOString() : undefined;
    const modifiedIso = a.updated_at ? new Date(a.updated_at).toISOString() : publishedIso;
    const FALLBACK_OG = "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/96e18c62-051f-45d8-b718-d61cb204c1d5";
    const rawImage = a.image_url || a.video_poster_url || null;
    const toAbsolute = (u: string | null): string => {
      if (!u) return FALLBACK_OG;
      if (/^https?:\/\//i.test(u)) return u;
      if (u.startsWith("//")) return `https:${u}`;
      if (u.startsWith("/")) return `https://rollerzone.es${u}`;
      return FALLBACK_OG;
    };
    const baseImage = toAbsolute(rawImage);
    const version = a.updated_at ? new Date(a.updated_at).getTime() : null;
    const image =
      rawImage && version
        ? `${baseImage}${baseImage.includes("?") ? "&" : "?"}v=${version}`
        : baseImage;

    const blocksText = blocksPlainText(parseBlocks(tr ? tr.content_blocks : a.content_blocks));
    const plain = (blocksText || (tr?.content ?? a.content) || "").replace(/\s+/g, " ").trim();
    const wordCount = plain ? plain.split(" ").filter(Boolean).length : undefined;

    const newsLd = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: (tr?.title ?? a.title).slice(0, 110),
      description: desc,
      mainEntityOfPage: { "@type": "WebPage", "@id": enCanonical },
      url: enCanonical,
      inLanguage: tr ? "en" : "es",
      isAccessibleForFree: true,
      image: [image],
      ...(publishedIso ? { datePublished: publishedIso } : {}),
      ...(modifiedIso ? { dateModified: modifiedIso } : {}),
      ...(wordCount ? { wordCount } : {}),
      author: [{ "@type": "Person", name: author }],
      publisher: {
        "@type": "Organization",
        name: "RollerZone",
        logo: { "@type": "ImageObject", url: "https://rollerzone.es/favicon.ico" },
      },
      ...(a.news_categories?.name ? { articleSection: a.news_categories.name } : {}),
    };

    return {
      meta: [
        { title: `${title} — RollerZone` },
        { name: "description", content: desc },
        { name: "author", content: author },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: enCanonical },
        { property: "og:site_name", content: "RollerZone" },
        { property: "og:locale", content: tr ? "en_US" : "es_ES" },
        ...(publishedIso ? [{ property: "article:published_time", content: publishedIso }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        ...(rawImage && /^https:\/\//.test(image) ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
        // Sin traducción aprobada, la página no se indexa.
        ...(tr ? [] : [{ name: "robots", content: "noindex, follow" }]),
      ],
      links: [
        { rel: "canonical", href: tr ? enCanonical : esCanonical },
        { rel: "alternate", hreflang: "es", href: esCanonical },
        ...(tr ? [{ rel: "alternate", hreflang: "en", href: enCanonical }] : []),
        { rel: "alternate", hreflang: "x-default", href: esCanonical },
      ],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(newsLd).replace(/</g, "\\u003c") },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="font-display text-4xl tracking-widest">Article not found</h1>
      <Link to="/noticias" className="mt-6 inline-block text-gold hover:underline">
        ← Back to news
      </Link>
    </div>
  ),
  component: EnArticlePage,
});

function EnArticlePage() {
  const { article, translation } = Route.useLoaderData();

  if (!translation) {
    return (
      <>
        <div className="border-b border-gold/30 bg-gold/10">
          <p className="font-condensed mx-auto max-w-4xl px-6 py-3 text-xs uppercase tracking-widest text-gold">
            This article is not available in English yet — showing the Spanish original.
          </p>
        </div>
        <NewsArticleView article={article} locale="es" backTo={{ to: "/noticias", label: "Noticias" }} />
      </>
    );
  }

  const blocks = parseBlocks(translation.content_blocks);
  return (
    <NewsArticleView
      article={article}
      locale="en"
      overrides={{
        title: translation.title || article.title,
        excerpt: translation.excerpt ?? article.excerpt,
        blocks,
        content: translation.content,
      }}
      backTo={{ to: "/en/news", label: "News" }}
    />
  );
}
