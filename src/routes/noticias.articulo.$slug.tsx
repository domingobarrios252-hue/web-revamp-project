import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { NewsArticleView, type ArticleViewData } from "@/components/site/NewsArticleView";
import { parseBlocks, blocksPlainText } from "@/lib/newsBlocks";

const ARTICLE_SELECT =
  "id, title, slug, excerpt, content, content_blocks, author, writer_id, writers(id, full_name, published), legacy_tag, image_url, image_crops, hero_display_mode, gallery, video_url, video_embed_url, video_poster_url, read_minutes, views_count, published_at, updated_at, country_code, news_categories(id, name, slug, scope)";

export const Route = createFileRoute("/noticias/articulo/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("news")
      .select(ARTICLE_SELECT)
      .eq("slug", params.slug)
      .maybeSingle();
    if (!data) throw notFound();

    // Enlace hreflang: solo si existe una versión inglesa aprobada.
    const { data: tr } = await supabase
      .from("news_translations")
      .select("id")
      .eq("news_id", (data as { id: string }).id)
      .eq("lang", "en")
      .maybeSingle();

    return { article: data as unknown as ArticleViewData, hasEn: Boolean(tr) };
  },

  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Noticia — RollerZone" }] };
    const a = loaderData.article;
    const canonical = `https://rollerzone.es/noticias/articulo/${params.slug}`;
    const enUrl = `https://rollerzone.es/en/news/${params.slug}`;
    const desc = (a.excerpt ?? a.title).slice(0, 160);
    const author = a.writers?.full_name ?? a.author ?? "RollerZone Spain";
    const publishedIso = a.published_at ? new Date(a.published_at).toISOString() : undefined;
    const modifiedIso = a.updated_at ? new Date(a.updated_at).toISOString() : publishedIso;
    const FALLBACK_OG = "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/96e18c62-051f-45d8-b718-d61cb204c1d5";
    // The cover photo always wins so replacing it updates the share preview.
    const rawImage = a.image_url || a.video_poster_url || null;
    const toAbsolute = (u: string | null): string => {
      if (!u) return FALLBACK_OG;
      if (/^https?:\/\//i.test(u)) return u;
      if (u.startsWith("//")) return `https:${u}`;
      if (u.startsWith("/")) return `https://rollerzone.es${u}`;
      return FALLBACK_OG;
    };
    const baseImage = toAbsolute(rawImage);
    // Version by last edit so crawlers never reuse a cached image URL.
    const version = a.updated_at ? new Date(a.updated_at).getTime() : null;
    const image =
      rawImage && version
        ? `${baseImage}${baseImage.includes("?") ? "&" : "?"}v=${version}`
        : baseImage;
    const blocksText = blocksPlainText(parseBlocks(a.content_blocks));
    const plain = (blocksText || a.content || "").replace(/\s+/g, " ").trim();
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
      image: [image],
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
      links: [
        { rel: "canonical", href: canonical },
        { rel: "alternate", hrefLang: "es", href: canonical },
        ...(loaderData.hasEn ? [{ rel: "alternate", hrefLang: "en", href: enUrl }] : []),
        { rel: "alternate", hrefLang: "x-default", href: canonical },
      ],
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
  return (
    <NewsArticleView article={article} locale="es" backTo={{ to: "/noticias", label: "Noticias" }} />
  );
}
