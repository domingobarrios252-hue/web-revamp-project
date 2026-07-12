import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { videoEmbedUrl, detectVideoPlatform } from "@/lib/videoEmbed";

type Props = {
  /** Direct file URL (mp4/webm/mov) uploaded to storage. */
  fileUrl?: string | null;
  /** External URL or iframe embed code (YouTube, Vimeo, Facebook, Twitch…). */
  embedUrl?: string | null;
  /** Optional poster shown before playback. */
  posterUrl?: string | null;
  /** Accessibility label. */
  title?: string;
};

export function NewsVideoPlayer({ fileUrl, embedUrl, posterUrl, title }: Props) {
  const [activated, setActivated] = useState(false);

  const embedSrc = useMemo(
    () => (embedUrl ? videoEmbedUrl(embedUrl, { autoplay: activated }) : null),
    [embedUrl, activated],
  );

  if (!fileUrl && !embedUrl) return null;

  // Uploaded file wins if both are present
  if (fileUrl) {
    return (
      <figure className="mb-8 overflow-hidden border border-border bg-black">
        <video
          src={fileUrl}
          poster={posterUrl ?? undefined}
          controls
          preload="metadata"
          playsInline
          controlsList="nodownload"
          className="aspect-video w-full"
          aria-label={title}
        >
          <track kind="captions" />
          Tu navegador no puede reproducir este vídeo.
        </video>
      </figure>
    );
  }

  if (embedSrc) {
    return (
      <figure className="mb-8 overflow-hidden border border-border bg-black">
        <div className="relative aspect-video w-full">
          {activated ? (
            <iframe
              src={embedSrc}
              title={title ?? "Vídeo"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setActivated(true)}
              className="group absolute inset-0 flex h-full w-full items-center justify-center bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              aria-label={`Reproducir ${title ?? "vídeo"}`}
            >
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                />
              ) : null}
              <span className="relative z-10 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold text-background shadow-xl transition-transform group-hover:scale-110">
                <Play className="h-7 w-7 translate-x-[2px]" fill="currentColor" />
              </span>
            </button>
          )}
        </div>
      </figure>
    );
  }

  // Unsupported embed URL — offer external link.
  const platform = detectVideoPlatform(embedUrl ?? "");
  return (
    <figure className="mb-8 border border-border bg-surface p-4 text-sm text-muted-foreground">
      Este vídeo no se puede insertar aquí.{" "}
      <a
        href={embedUrl ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gold underline"
      >
        Abrir en {platform ?? "la fuente original"}
      </a>
      .
    </figure>
  );
}
