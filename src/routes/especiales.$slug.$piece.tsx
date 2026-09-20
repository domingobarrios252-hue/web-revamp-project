import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { renderMarkdown } from "@/lib/markdown";
import { Lightbox } from "@/components/site/Lightbox";
import { PieceShareBar } from "@/components/specials/PieceShareBar";
import specialFallback from "@/assets/special-fallback.svg";

const SITE = "https://rollerzone.es";

type Piece = {
  slug: string;
  number: string | null;
  kicker: string | null;
  category: string | null;
  title: string;
  description: string | null;
  excerpt: string | null;
  content_md: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  external_url: string | null;
  status: string;
  visible: boolean;
  gallery?: string[] | null;
};

type SpecialLite = { slug: string; title: string };

const PUBLIC_STATUSES = ["published", "live"];

export const Route = createFileRoute("/especiales/$slug/$piece")({
  loader: async ({ params }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data: special } = await sb
      .from("special_editorials")
      .select("slug,title")
      .eq("slug", params.slug)
      .eq("status", "active")
      .maybeSingle();
    if (!special) throw notFound();

    const { data: piece } = await sb
      .from("special_pieces")
      .select("*")
      .eq("special_slug", params.slug)
      .eq("slug", params.piece)
      .in("status", PUBLIC_STATUSES)
      .eq("visible", true)
      .maybeSingle();
    if (!piece) throw notFound();

    const { data: siblings } = await sb
      .from("special_pieces")
      .select("slug,number,kicker,category,title,description,excerpt,image_url,thumbnail_url")
      .eq("special_slug", params.slug)
      .in("status", PUBLIC_STATUSES)
      .eq("visible", true)
      .neq("slug", params.piece)
      .order("sort_order", { ascending: true })
      .limit(3);

    return {
      special: special as SpecialLite,
      piece: piece as Piece,
      siblings: (siblings ?? []) as Piece[],
      url: `${SITE}/especiales/${params.slug}/${params.piece}`,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Pieza no disponible | Rollerzone" },
          { name: "robots", content: "noindex, follow" },
        ],
      };
    }
    const { piece, special, url } = loaderData;
    const title = `${piece.title} | Rollerzone`;
    const description =
      (piece.excerpt || piece.description || `${piece.title} · ${special.title}`).slice(0, 300);
    const image = piece.image_url?.trim() || piece.thumbnail_url?.trim() || "";
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ];
    if (image.startsWith("http")) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: piece.title,
            description,
            image: image || undefined,
            isPartOf: { "@type": "CreativeWork", name: special.title },
            url,
            publisher: {
              "@type": "Organization",
              name: "Rollerzone",
              url: SITE,
            },
          }),
        },
      ],
    };
  },
  component: PiecePage,
  notFoundComponent: PieceNotFound,
});

function PiecePage() {
  const { slug } = Route.useParams();
  const { special, piece, siblings, url } = Route.useLoaderData();
  const [lightbox, setLightbox] = useState<number | null>(null);

  const hero = piece.image_url?.trim() || piece.thumbnail_url?.trim() || (specialFallback as string);
  // El H1 de la página es el título de la pieza: los H1 del contenido bajan a H2.
  const html = renderMarkdown(piece.content_md ?? "")
    .replace(/<h1(\s|>)/g, "<h2$1")
    .replace(/<\/h1>/g, "</h2>");
  const gallery = Array.isArray(piece.gallery) ? piece.gallery.filter(Boolean) : [];
  const kicker = piece.kicker || piece.category || "";

  return (
    <>
      {/* Cabecera editorial (las migas de pan globales ya las pinta el layout) */}
      <header className="bg-background">
        <div className="mx-auto max-w-4xl px-4 pb-8 pt-6 md:px-6">
          <div className="flex flex-wrap items-center gap-3">
            {kicker && (
              <span className="font-condensed inline-block bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-background">
                {kicker}
              </span>
            )}
            {piece.number && <span className="font-display text-2xl text-gold">{piece.number}</span>}
          </div>
          <h1 className="font-display mt-4 break-words text-[1.75rem] uppercase leading-tight tracking-wider text-foreground sm:text-4xl md:text-5xl">
            {piece.title}
          </h1>
          <div className="mt-4 h-[3px] w-24 bg-gold" />
          {(piece.excerpt || piece.description) && (
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-xl">
              {piece.excerpt || piece.description}
            </p>
          )}
          <div className="mt-6">
            <PieceShareBar url={url} title={piece.title} />
          </div>
        </div>
      </header>

      {/* Imagen destacada a ancho completo */}
      <figure className="bg-background">
        <div className="mx-auto max-w-5xl px-0 md:px-6">
          <div className="aspect-[16/9] w-full overflow-hidden bg-surface-2 md:rounded-2xl md:border md:border-border">
            <img
              src={hero}
              alt={`${kicker ? kicker + " — " : ""}${piece.title} · ${special.title}`}
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </figure>

      {/* Contenido */}
      <article className="bg-background py-10 md:py-16">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          {html ? (
            <div
              className="prose prose-invert max-w-none break-words text-base leading-relaxed text-muted-foreground [&_a]:text-gold [&_h1]:font-display [&_h1]:uppercase [&_h1]:tracking-wider [&_h1]:text-foreground [&_h2]:font-display [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-foreground [&_h3]:font-display [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:text-foreground [&_img]:h-auto [&_img]:max-w-full [&_pre]:overflow-x-auto [&_strong]:text-foreground [&_table]:block [&_table]:overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-muted-foreground">
              {piece.description || "Contenido en preparación."}
            </p>
          )}
          {piece.external_url && (
            <a
              href={piece.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-condensed mt-8 inline-flex items-center gap-2 border border-gold px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gold hover:bg-gold hover:text-background"
            >
              Enlace externo <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Galería */}
        {gallery.length > 0 && (
          <div className="mx-auto mt-12 max-w-5xl px-4 md:px-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-[2px] w-10 bg-gold" />
              <h2 className="font-condensed text-[11px] font-bold uppercase tracking-[3px] text-gold">
                Galería del reportaje
              </h2>
            </div>
            {/* Móvil: carrusel táctil · Escritorio: mosaico */}
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0">
              {gallery.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setLightbox(i)}
                  className={
                    "w-[85%] shrink-0 snap-center overflow-hidden rounded-lg border border-border bg-surface sm:w-full " +
                    (i % 3 === 0 ? "sm:col-span-2" : "")
                  }
                >
                  <img
                    src={src}
                    alt={`${piece.title} — foto ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[16/10] h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Volver al especial */}
      <div className="bg-background pb-10">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <Link
            to="/especiales/$slug"
            params={{ slug }}
            className="font-condensed inline-flex items-center gap-2 rounded-md border border-gold/60 bg-black/20 px-5 py-3 text-xs font-bold uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-background"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al especial · {special.title}
          </Link>
        </div>
      </div>

      {/* Otras piezas */}
      {siblings.length > 0 && (
        <section className="bg-surface py-12">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <h2 className="font-display mb-6 text-xl uppercase tracking-wider text-foreground">
              Otras piezas del especial
            </h2>
            <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.map((s) => (
                <li key={s.slug}>
                  <Link
                    to="/especiales/$slug/$piece"
                    params={{ slug, piece: s.slug }}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all hover:-translate-y-1 hover:border-gold"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
                      <img
                        src={s.image_url?.trim() || s.thumbnail_url?.trim() || (specialFallback as string)}
                        alt={s.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {(s.kicker || s.category) && (
                        <span className="font-condensed absolute left-3 top-3 inline-block bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-background">
                          {s.kicker || s.category}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-display text-base uppercase leading-snug tracking-wider text-foreground group-hover:text-gold md:text-lg">
                        {s.title}
                      </h3>
                      {(s.excerpt || s.description) && (
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                          {s.excerpt || s.description}
                        </p>
                      )}
                      <div className="font-condensed mt-auto pt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2.5px] text-gold">
                        Leer pieza <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {lightbox !== null && gallery.length > 0 && (
        <Lightbox
          images={gallery}
          startIndex={lightbox}
          alt={piece.title}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

function PieceNotFound() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">
        Pieza no disponible
      </h1>
      <p className="mt-4 text-muted-foreground">
        Esta pieza no existe o ya no está publicada.
      </p>
      <Link
        to="/especiales/$slug"
        params={{ slug }}
        className="font-condensed mt-6 inline-block bg-gold px-5 py-3 text-xs font-bold uppercase tracking-widest text-background"
      >
        Volver al especial
      </Link>
    </div>
  );
}
