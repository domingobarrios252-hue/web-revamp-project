import { useState } from "react";
import type { NewsBlock } from "@/lib/newsBlocks";
import { renderMarkdown } from "@/lib/markdown";
import { Lightbox } from "@/components/site/Lightbox";
import { NewsVideoPlayer } from "@/components/site/NewsVideoPlayer";

type Props = {
  blocks: NewsBlock[];
  /** Título de la noticia, usado como alt de respaldo. */
  title: string;
};

/**
 * Render público de los bloques de contenido, respetando exactamente el
 * orden definido en el panel de administración.
 */
export function NewsContentBlocks({ blocks, title }: Props) {
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  if (blocks.length === 0) return null;

  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden">
      {blocks.map((block) => {
        switch (block.type) {
          case "text":
            return (
              <div
                key={block.id}
                className="prose prose-invert max-w-none text-[16px] leading-relaxed text-foreground/90"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(block.text) }}
              />
            );

          case "heading":
            return block.level === 3 ? (
              <h3
                key={block.id}
                className="font-display mt-6 text-lg uppercase tracking-widest text-foreground md:text-xl"
              >
                {block.text}
              </h3>
            ) : (
              <h2
                key={block.id}
                className="font-display mt-8 text-xl uppercase tracking-widest text-gold md:text-2xl"
              >
                {block.text}
              </h2>
            );

          case "image": {
            const alt = block.alt?.trim() || block.caption?.trim() || title;
            return (
              <figure
                key={block.id}
                className={
                  block.width === "full"
                    ? "-mx-6 w-[calc(100%+3rem)] max-w-[calc(100%+3rem)] md:mx-0 md:w-full md:max-w-none"
                    : "w-full max-w-full"
                }
              >
                <button
                  type="button"
                  onClick={() => setLightbox({ images: [block.url], index: 0 })}
                  className="block w-full max-w-full cursor-zoom-in overflow-hidden border border-border bg-black"
                  aria-label={`Ampliar imagen: ${alt}`}
                >
                  <img
                    src={block.url}
                    alt={alt}
                    title={alt}
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full max-w-full object-contain"
                  />
                </button>
                {block.caption?.trim() && (
                  <figcaption className="mt-2 px-6 text-xs leading-relaxed text-muted-foreground md:px-0">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          case "gallery":
            return (
              <figure key={block.id} className="w-full max-w-full">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {block.images.map((src, i) => (
                    <button
                      type="button"
                      key={`${block.id}-${i}`}
                      onClick={() => setLightbox({ images: block.images, index: i })}
                      className="group block aspect-square overflow-hidden border border-border bg-black"
                      aria-label={`Abrir foto ${i + 1}`}
                    >
                      <img
                        src={src}
                        alt={`${title} — foto ${i + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
                {block.caption?.trim() && (
                  <figcaption className="mt-2 text-xs text-muted-foreground">{block.caption}</figcaption>
                )}
              </figure>
            );

          case "video":
            return (
              <figure key={block.id} className="w-full max-w-full overflow-hidden">
                <NewsVideoPlayer
                  fileUrl={block.fileUrl || null}
                  embedUrl={block.embedUrl || null}
                  posterUrl={block.posterUrl || null}
                  title={block.caption || title}
                />
                {block.caption?.trim() && (
                  <figcaption className="mt-2 text-xs text-muted-foreground">{block.caption}</figcaption>
                )}
              </figure>
            );

          case "quote":
            return (
              <blockquote
                key={block.id}
                className="border-l-2 border-gold bg-surface/50 px-5 py-4 text-lg italic leading-relaxed text-foreground md:text-xl"
              >
                “{block.text}”
                {block.author?.trim() && (
                  <cite className="font-condensed mt-2 block text-[11px] font-bold uppercase not-italic tracking-widest text-gold">
                    {block.author}
                  </cite>
                )}
              </blockquote>
            );

          case "divider":
            return <hr key={block.id} className="my-8 border-border" />;
        }
      })}

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          startIndex={lightbox.index}
          alt={title}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
