import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { supabase } from "@/integrations/supabase/client";

type Interview = {
  id: string;
  title: string;
  slug: string;
  interviewee_name: string;
  interviewee_bio: string | null;
  interview_date: string;
  cover_url: string | null;
  photos: string[];
  content: string | null;
  excerpt: string | null;
};

export const Route = createFileRoute("/entrevistas/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Entrevista — ${params.slug} · RollerZone` },
      { property: "og:type", content: "article" },
    ],
  }),
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

  const allPhotos = item.cover_url ? [item.cover_url, ...item.photos] : item.photos;

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

      {allPhotos.length > 0 && <PhotoCarousel photos={allPhotos} alt={item.interviewee_name} />}

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

function PhotoCarousel({ photos, alt }: { photos: string[]; alt: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);

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
              <div className="aspect-[16/10] w-full bg-background">
                <img
                  src={src}
                  alt={`${alt} — foto ${i + 1}`}
                  className="h-full w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

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
