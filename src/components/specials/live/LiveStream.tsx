import { useState } from "react";
import { Play } from "lucide-react";
import { safeEmbedUrl, type EventStream } from "@/lib/specials/liveEvent";

/** ¿Hay algo que mostrar en la sección de directo? (nunca un reproductor vacío) */
export function streamMode(s: EventStream | null | undefined): "player" | "upcoming" | "finished" | null {
  if (!s || !s.stream_active) return null;
  if (s.stream_status === "finished") return s.stream_cta_url || s.stream_url ? "finished" : null;
  if (s.stream_embed_url) return "player";
  if (s.stream_scheduled_at || s.stream_title) return "upcoming";
  return null;
}

function fmt(iso: string, tz: string) {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: tz, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export function LiveStream({ stream, city, tz }: { stream: EventStream | null; city: string; tz: string }) {
  const [loaded, setLoaded] = useState(false);
  const mode = streamMode(stream);
  if (!stream || !mode) return null;
  const s = stream;
  const live = s.stream_status === "live" && mode === "player";
  const poster = s.stream_poster_url?.trim() || "";
  const posterMobile = s.stream_poster_mobile_url?.trim() || poster;
  const cta = s.stream_cta_url?.trim() || (mode !== "player" ? s.stream_url?.trim() : "") || "";
  const heading = mode === "player" ? `En directo desde ${city || "la sede"}` : mode === "upcoming" ? "Próxima retransmisión" : "Retransmisión finalizada";

  const Poster = () =>
    poster ? (
      <picture>
        {posterMobile !== poster && <source media="(max-width: 767px)" srcSet={posterMobile} />}
        <img src={poster} alt={s.stream_poster_alt ?? ""} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      </picture>
    ) : null;

  return (
    <section id="directo" className="scroll-mt-14 bg-background py-8 md:py-12">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl uppercase tracking-wider text-foreground">{heading}</h2>
          {live && (
            <span className="font-condensed inline-flex items-center gap-1.5 bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px] text-destructive-foreground">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> En directo
            </span>
          )}
        </div>

        {mode === "player" ? (
          <div className="relative mt-4 aspect-video w-full overflow-hidden border border-border bg-surface">
            {loaded ? (
              <iframe
                src={safeEmbedUrl(s.stream_embed_url!, true)}
                title={s.stream_title || heading}
                className="absolute inset-0 h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
              />
            ) : (
              <button
                type="button"
                onClick={() => setLoaded(true)}
                className="group absolute inset-0 flex items-center justify-center"
                aria-label={`Reproducir: ${s.stream_title || heading}`}
              >
                <Poster />
                <span className="absolute inset-0 bg-background/40" aria-hidden="true" />
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gold text-background transition-transform group-hover:scale-105">
                  <Play className="ml-1 h-7 w-7" fill="currentColor" />
                </span>
              </button>
            )}
          </div>
        ) : (
          (poster || s.stream_scheduled_at) && (
            <div className="relative mt-4 grid overflow-hidden border border-border bg-surface md:grid-cols-[2fr_3fr]">
              {poster && (
                <div className="relative aspect-video md:aspect-auto">
                  <Poster />
                </div>
              )}
              <div className="p-4 md:p-6">
                {s.stream_scheduled_at && (
                  <p className="font-display text-xl uppercase text-gold">{fmt(s.stream_scheduled_at, tz)} · hora local</p>
                )}
                {s.stream_title && <p className="font-display mt-1 text-lg uppercase text-foreground">{s.stream_title}</p>}
              </div>
            </div>
          )
        )}

        {mode === "player" && s.stream_title && (
          <p className="font-display mt-3 text-lg uppercase tracking-wide text-foreground">{s.stream_title}</p>
        )}
        {s.stream_description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.stream_description}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {cta && (
            <a
              href={cta}
              target="_blank"
              rel="noopener noreferrer"
              className="font-condensed inline-flex min-h-11 items-center bg-gold px-4 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
            >
              {s.stream_cta_label?.trim() || "Ver emisión"}
            </a>
          )}
          {(s.stream_attribution || s.stream_provider) && (
            <p className="font-condensed text-[10px] uppercase tracking-[2px] text-muted-foreground">
              {s.stream_attribution || `Fuente: ${s.stream_provider}`}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
