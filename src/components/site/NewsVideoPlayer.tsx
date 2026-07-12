import { useMemo } from "react";
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
  const embedSrc = useMemo(
    () => (embedUrl ? videoEmbedUrl(embedUrl, { autoplay: false }) : null),
    [embedUrl],
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
          <iframe
            src={embedSrc}
            title={title ?? "Vídeo"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 h-full w-full"
          />
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
