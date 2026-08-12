import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, FileText, Handshake, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import specialFallback from "@/assets/special-fallback.svg";
import { Lightbox } from "@/components/site/Lightbox";
import { renderMarkdown } from "@/lib/markdown";
import { toJsonLd } from "@/lib/jsonLd";
import {
  categoryLabel,
  normalizeCollaboration,
  typeLabel,
  type Collaboration,
} from "@/lib/colaboraciones";
import { toEmbedUrl } from "@/lib/videoEmbed";

type RelatedNews = { id: string; slug: string; title: string; cover_url: string | null };

export const Route = createFileRoute("/colaboraciones/$slug")({
  loader: async ({ params }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data } = await sb
      .from("collaborations")
      .select("*")
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!data) throw notFound();
    const item = normalizeCollaboration(data as Record<string, unknown>);
    return { item };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Colaboración no disponible | RollerZone" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { item } = loaderData;
    const title = item.seo_title?.trim() || `${item.title} | RollerZone`;
    const description = item.seo_description?.trim() || item.short_description;
    const url = `https://rollerzone.es/colaboraciones/${params.slug}`;
    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (item.cover_url?.startsWith("https://")) {
      meta.push({ property: "og:image", content: item.cover_url });
      meta.push({ name: "twitter:image", content: item.cover_url });
    }
    return { meta, links: [{ rel: "canonical", href: url }] };
  },
  component: CollaborationDetail,
  notFoundComponent: CollaborationNotFound,
});

function CollaborationDetail() {
  const { item } = Route.useLoaderData();
  const [news, setNews] = useState<RelatedNews[]>([]);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (item.related_news.length === 0) {
      setNews([]);
      return;
    }
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("news")
        .select("id, slug, title, cover_url")
        .in("id", item.related_news)
        .eq("status", "published");
      setNews((data ?? []) as RelatedNews[]);
    })();
  }, [item.related_news]);

  const embed = item.video_url?.trim() ? toEmbedUrl(item.video_url) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: item.title,
    description: item.short_description,
    datePublished: item.published_at ?? String(item.year),
    url: `https://rollerzone.es/colaboraciones/${item.slug}`,
    image: item.cover_url || undefined,
    sponsor: item.entity ? { "@type": "Organization", name: item.entity } : undefined,
    publisher: { "@type": "Organization", name: "RollerZone" },
  };

  return (
    <main className="min-w-0 bg-background pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }} />

      <div className="mx-auto max-w-5xl px-4 pt-8 md:px-6">
        <Link
          to="/colaboraciones"
          className="font-condensed inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[2px] text-muted-foreground hover:text-gold"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Colaboraciones y convenios
        </Link>

        <header className="mt-5 border-b border-border pb-7">
          <div className="font-condensed flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[2.5px]">
            <span className="bg-gold px-2.5 py-1 text-background">
              {typeLabel(item.type)} · {item.year}
            </span>
            <span className="border border-border px-2.5 py-1 text-muted-foreground">
              {categoryLabel(item.category)}
            </span>
          </div>
          <div className="font-condensed mt-3 text-xs font-bold uppercase tracking-[2px] text-gold">
            {item.entity}
          </div>
          <h1 className="font-display mt-2 text-[clamp(1.6rem,5.5vw,2.9rem)] uppercase leading-[1.08] tracking-wider text-foreground">
            {item.title}
          </h1>
          <div className="mt-4 flex items-center gap-4">
            <span className="font-condensed inline-flex items-center gap-2 border border-gold/50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[2px] text-gold">
              <Handshake className="h-3.5 w-3.5" /> RollerZone
            </span>
            {item.entity_logo_url?.trim() ? (
              <img
                src={item.entity_logo_url}
                alt={item.entity}
                className="h-10 w-auto max-w-[140px] object-contain"
              />
            ) : null}
          </div>
        </header>

        <div className="mt-6 aspect-[16/9] w-full max-w-full overflow-hidden border border-border bg-surface-2">
          <img
            src={item.cover_url?.trim() ? item.cover_url : (specialFallback as string)}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        </div>

        {item.short_description ? (
          <p className="mt-6 border-l-2 border-gold pl-4 text-base leading-relaxed text-foreground/90">
            {item.short_description}
          </p>
        ) : null}

        <Block title="El proyecto" md={item.project_md} />
        <Block title="Objetivo" md={item.objective_md} />
        <Block title="La colaboración" md={item.collaboration_md} />
        <Block title="Resultado" md={item.result_md} />
        <Block title="Más información" md={item.content_md} />

        {(item.flipbook_url?.trim() || item.pdf_url?.trim() || item.external_url?.trim()) && (
          <div className="mt-8 flex flex-wrap gap-3">
            {item.flipbook_url?.trim() ? (
              <ExternalButton href={item.flipbook_url} label="Ver flipbook" />
            ) : null}
            {item.pdf_url?.trim() ? (
              <ExternalButton href={item.pdf_url} label="Documento PDF" icon={<FileText className="h-3.5 w-3.5" />} />
            ) : null}
            {item.external_url?.trim() ? (
              <ExternalButton href={item.external_url} label="Enlace externo" />
            ) : null}
          </div>
        )}

        {embed ? (
          <section className="mt-10">
            <SectionTitle>Multimedia</SectionTitle>
            <div className="relative w-full max-w-full overflow-hidden border border-border bg-black aspect-video">
              <iframe
                src={embed}
                title={`Vídeo · ${item.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </section>
        ) : null}

        {item.gallery.length > 0 ? (
          <section className="mt-10">
            <SectionTitle>
              <ImageIcon className="mr-2 inline h-4 w-4 text-gold" /> Galería
            </SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {item.gallery.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setLightbox(i)}
                  className="group aspect-[4/3] overflow-hidden border border-border bg-surface-2"
                >
                  <img
                    src={src}
                    alt={`${item.title} — imagen ${i + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {news.length > 0 ? (
          <section className="mt-12">
            <SectionTitle>Noticias relacionadas</SectionTitle>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((n) => (
                <li key={n.id}>
                  <Link
                    to="/noticias/$slug"
                    params={{ slug: n.slug }}
                    className="group block overflow-hidden border border-border bg-surface transition-colors hover:border-gold"
                  >
                    <div className="aspect-[16/9] overflow-hidden bg-surface-2">
                      <img
                        src={n.cover_url?.trim() ? n.cover_url : (specialFallback as string)}
                        alt={n.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <h3 className="font-display p-4 text-sm uppercase leading-snug tracking-wider text-foreground group-hover:text-gold">
                      {n.title}
                    </h3>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-12 border-t border-border pt-6">
          <Link
            to="/colaboraciones"
            className="font-condensed inline-flex items-center gap-2 border border-gold px-4 py-2.5 text-[11px] font-bold uppercase tracking-[2px] text-gold hover:bg-gold hover:text-background"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a colaboraciones y convenios
          </Link>
        </div>
      </div>

      {lightbox !== null ? (
        <Lightbox
          images={item.gallery}
          startIndex={lightbox}
          alt={item.title}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </main>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display mb-4 text-xl uppercase tracking-wider text-foreground md:text-2xl">
      {children}
      <span className="mt-2 block h-[3px] w-16 bg-gold" />
    </h2>
  );
}

function Block({ title, md }: { title: string; md: string }) {
  if (!md?.trim()) return null;
  return (
    <section className="mt-10">
      <SectionTitle>{title}</SectionTitle>
      <div
        className="prose-rz text-[0.98rem] leading-relaxed text-muted-foreground [&_a]:text-gold [&_h3]:text-foreground [&_strong]:text-foreground"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(md) }}
      />
    </section>
  );
}

function ExternalButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-condensed inline-flex min-h-[44px] items-center gap-2 border border-border bg-surface px-4 py-2 text-[11px] font-bold uppercase tracking-[2px] text-foreground hover:border-gold hover:text-gold"
    >
      {icon ?? <ExternalLink className="h-3.5 w-3.5" />} {label}
    </a>
  );
}

function CollaborationNotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="font-display text-3xl uppercase tracking-widest text-foreground">
        Colaboración no encontrada
      </h1>
      <p className="mt-3 text-muted-foreground">
        Puede que el proyecto aún no esté publicado o haya cambiado de dirección.
      </p>
      <Link
        to="/colaboraciones"
        className="font-condensed mt-6 inline-flex items-center gap-2 border border-gold px-4 py-2.5 text-[11px] font-bold uppercase tracking-[2px] text-gold hover:bg-gold hover:text-background"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a colaboraciones
      </Link>
    </main>
  );
}
