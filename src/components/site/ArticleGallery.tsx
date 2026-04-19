import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Props = {
  images: string[];
  title: string;
};

export function ArticleGallery({ images, title }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const close = useCallback(() => setOpenIdx(null), []);
  const next = useCallback(
    () => setOpenIdx((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length]
  );
  const prev = useCallback(
    () => setOpenIdx((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (openIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIdx, close, next, prev]);

  if (!images || images.length === 0) return null;

  return (
    <section className="mt-10 border-t border-border pt-6">
      <h3 className="font-display mb-4 text-sm tracking-widest text-gold">
        Galería ({images.length})
      </h3>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {images.map((src, i) => (
          <li key={`${src}-${i}`}>
            <button
              type="button"
              onClick={() => setOpenIdx(i)}
              className="group relative block w-full overflow-hidden border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-gold"
              aria-label={`Abrir imagen ${i + 1} de ${images.length}`}
            >
              <img
                src={src}
                alt={`${title} — foto ${i + 1}`}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {openIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Galería ampliada"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4 backdrop-blur"
          onClick={close}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="absolute right-4 top-4 z-10 border border-border bg-surface p-2 text-foreground transition-colors hover:border-gold hover:text-gold"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 border border-border bg-surface p-2 text-foreground transition-colors hover:border-gold hover:text-gold"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 border border-border bg-surface p-2 text-foreground transition-colors hover:border-gold hover:text-gold"
                aria-label="Imagen siguiente"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <figure
            className="flex max-h-full max-w-full flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[openIdx]}
              alt={`${title} — foto ${openIdx + 1}`}
              className="max-h-[85vh] max-w-full object-contain"
            />
            <figcaption className="font-condensed mt-3 text-xs uppercase tracking-widest text-muted-foreground">
              {openIdx + 1} / {images.length}
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
