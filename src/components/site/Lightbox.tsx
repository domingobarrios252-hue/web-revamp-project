import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Props = {
  images: string[];
  startIndex?: number;
  onClose: () => void;
  alt?: string;
};

/**
 * Full-screen lightbox. Always shows the image complete (object-contain) —
 * no aggressive cropping. Supports left/right keys and click outside to close.
 */
export function Lightbox({ images, startIndex = 0, onClose, alt = "" }: Props) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [images.length, onClose]);

  if (images.length === 0) return null;
  const src = images[index];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center border border-white/20 bg-black/60 text-white hover:border-gold hover:text-gold"
      >
        <X className="h-5 w-5" />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i - 1 + images.length) % images.length);
            }}
            className="absolute left-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/20 bg-black/60 text-white hover:border-gold hover:text-gold"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i + 1) % images.length);
            }}
            className="absolute right-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/20 bg-black/60 text-white hover:border-gold hover:text-gold"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="font-condensed absolute bottom-4 left-1/2 -translate-x-1/2 border border-white/20 bg-black/60 px-3 py-1 text-[11px] uppercase tracking-widest text-white">
            {index + 1} / {images.length}
          </div>
        </>
      )}

      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] max-w-[94vw] object-contain"
      />
    </div>
  );
}
