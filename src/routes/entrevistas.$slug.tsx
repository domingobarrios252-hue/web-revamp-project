import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { supabase } from "@/integrations/supabase/client";
import { CroppedImage } from "@/components/site/CroppedImage";
import { Lightbox } from "@/components/site/Lightbox";
import type { ImageCrops } from "@/lib/imageCrops";

type Interview = {
  id: string;
  title: string;
  slug: string;
  interviewee_name: string;
  interviewee_bio: string | null;
  interview_date: string;
  cover_url: string | null;
  cover_crops: ImageCrops | null;
  cover_display_mode: "crop" | "full";
  photos: string[];
  content: string | null;
  excerpt: string | null;
};

export const Route = createFileRoute("/entrevistas/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("interviews")
      .select("title, slug, interviewee_name, interview_date, cover_url, excerpt, updated_at")
      .eq("slug", params.slug)
      .eq("published", true)
      .maybeSingle();
    return { seo: data };
  },
  head: ({ loaderData, params }) => {
    const s = loaderData?.seo;
    const canonical = `https://rollerzone.es/entrevistas/${params.slug}`;
    if (!s) {
      return {
        meta: [
          { title: "Entrevista — RollerZone" },
          { property: "og:type", content: "article" },
          { property: "og:url", content: canonical },
        ],
        links: [{ rel: "canonical", href: canonical }],
      };
    }
    const title = `${s.title} — Entrevista a ${s.interviewee_name}`;
    const desc = (s.excerpt ?? `Entrevista a ${s.interviewee_name} en RollerZone.`).slice(0, 160);
    const dateIso = s.interview_date ? new Date(s.interview_date).toISOString() : undefined;
    const modIso = s.updated_at ? new Date(s.updated_at).toISOString() : dateIso;
    const image = s.cover_url ?? undefined;

    const articleLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: s.title,
      description: desc,
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      url: canonical,
      ...(image ? { image: [image] } : {}),
      ...(dateIso ? { datePublished: dateIso } : {}),
      ...(modIso ? { dateModified: modIso } : {}),
      author: { "@type": "Organization", name: "RollerZone Spain" },
      about: { "@type": "Person", name: s.interviewee_name },
      publisher: {
        "@type": "Organization",
        name: "RollerZone",
        logo: { "@type": "ImageObject", url: "https://rollerzone.es/favicon.ico" },
      },
    };
    const crumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://rollerzone.es/" },
        { "@type": "ListItem", position: 2, name: "Entrevistas", item: "https://rollerzone.es/entrevistas" },
        { "@type": "ListItem", position: 3, name: s.interviewee_name, item: canonical },
      ],
    };

    return {
      meta: [
        { title: `${title} · RollerZone` },
        { name: "description", content: desc },
        { name: "author", content: "RollerZone Spain" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        { property: "og:site_name", content: "RollerZone" },
        { property: "og:locale", content: "es_ES" },
        ...(dateIso ? [{ property: "article:published_time", content: dateIso }] : []),
        { property: "article:author", content: "RollerZone Spain" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        ...(image
          ? [
              { property: "og:image", content: image },
              { property: "og:image:alt", content: s.interviewee_name },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(articleLd).replace(/</g, "\\u003c") },
        { type: "application/ld+json", children: JSON.stringify(crumbLd).replace(/</g, "\\u003c") },
      ],
    };
  },
  component: EntrevistaDetalle,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="font-display text-3xl tracking-widest">Entrevista no encontrada</h1>
      <Link to="/entrevistas" className="font-condensed mt-4 inline-block text-xs uppercase tracking-widest text-gold">
        ← Volver a entrevistas
      </Link>
    </div>
  ),
});

function EntrevistaDetalle() {
  const { slug } = Route.useParams();
  const [item, setItem] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("interviews")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (!data) {
        setMissing(true);
      } else {
        const photos = Array.isArray(data.photos) ? (data.photos as string[]) : [];
        setItem({ ...(data as unknown as Interview), photos });
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="px-6 py-10 text-muted-foreground">Cargando…</div>;
  if (missing || !item) throw notFound();

  // In 'crop' mode the cover is shown framed (Hero 16:9) above and the
  // carousel only carries the extra photos. In 'full' mode we keep the
  // legacy behaviour: cover prepended into the carousel.
  const showCoverAsHero = item.cover_display_mode === "crop" && !!item.cover_url;
  const carouselPhotos = showCoverAsHero
    ? item.photos
    : item.cover_url
      ? [item.cover_url, ...item.photos]
      : item.photos;
  const lightboxImages = item.cover_url ? [item.cover_url, ...item.photos] : item.photos;

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <Link
        to="/entrevistas"
        className="font-condensed mb-6 inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="h-3 w-3" /> Todas las entrevistas
      </Link>

      <header className="mb-6 border-b border-border pb-6">
        <div className="font-condensed mb-2 inline-block bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-background">
          Entrevista
        </div>
        <h1 className="font-display text-3xl leading-tight tracking-wider md:text-5xl">
          {item.title}
        </h1>
        <div className="font-condensed mt-3 flex flex-wrap items-center gap-4 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="text-gold">{item.interviewee_name}</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(item.interview_date).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </header>

      {showCoverAsHero && item.cover_url && (
        <CoverHero
          src={item.cover_url}
          alt={item.interviewee_name}
          crops={item.cover_crops}
          allImages={lightboxImages}
        />
      )}

      {carouselPhotos.length > 0 && (
        <PhotoCarousel
          photos={carouselPhotos}
          alt={item.interviewee_name}
          lightboxImages={lightboxImages}
          lightboxOffset={showCoverAsHero && item.cover_url ? 1 : 0}
        />
      )}

      {item.interviewee_bio && (
        <section className="my-8 border-l-2 border-gold bg-surface p-5">
          <div className="font-condensed mb-2 text-[11px] font-bold uppercase tracking-widest text-gold">
            Sobre {item.interviewee_name}
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{item.interviewee_bio}</p>
        </section>
      )}

      {item.excerpt && (
        <p className="font-display my-6 text-lg italic leading-relaxed text-foreground/80">
          “{item.excerpt}”
        </p>
      )}

      {item.content && (
        <div className="prose prose-invert max-w-none whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
          {item.content}
        </div>
      )}
    </article>
  );
}

function CoverHero({
  src,
  alt,
  crops,
  allImages,
}: {
  src: string;
  alt: string;
  crops: ImageCrops | null;
  allImages: string[];
}) {
  const [open, setOpen] = useState(false);
  const idx = allImages.indexOf(src);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group mb-6 block w-full overflow-hidden border border-border bg-black"
        aria-label="Ver portada completa"
      >
        <CroppedImage src={src} alt={alt} crops={crops} ratio="hero" loading="eager" />
      </button>
      {open && (
        <Lightbox
          images={allImages}
          startIndex={idx >= 0 ? idx : 0}
          alt={alt}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function PhotoCarousel({
  photos,
  alt,
  lightboxImages,
  lightboxOffset = 0,
}: {
  photos: string[];
  alt: string;
  lightboxImages?: string[];
  lightboxOffset?: number;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="relative">
      <div className="overflow-hidden border border-border bg-surface" ref={emblaRef}>
        <div className="flex">
          {photos.map((src, i) => (
            <div key={i} className="relative min-w-0 flex-[0_0_100%]">
              <button
                type="button"
                onClick={() => setLightbox(i)}
                className="flex max-h-[80vh] w-full items-center justify-center bg-background"
                aria-label={`Ver foto ${i + 1} completa`}
              >
                <img
                  src={src}
                  alt={`${alt} — foto ${i + 1}`}
                  className="h-auto max-h-[80vh] w-full object-contain"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {lightbox !== null && (
        <Lightbox
          images={lightboxImages ?? photos}
          startIndex={(lightboxImages ? lightboxOffset : 0) + lightbox}
          alt={alt}
          onClose={() => setLightbox(null)}
        />
      )}


      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 border border-border bg-background/80 p-2 text-foreground hover:bg-gold hover:text-background"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Foto siguiente"
            className="absolute right-2 top-1/2 -translate-y-1/2 border border-border bg-background/80 p-2 text-foreground hover:bg-gold hover:text-background"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="mt-3 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Ir a foto ${i + 1}`}
                className={`h-1.5 w-6 transition-colors ${i === selected ? "bg-gold" : "bg-border hover:bg-muted-foreground"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
