import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Play, Radio, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { youTubeEmbedUrl, youTubeThumbnail } from "@/lib/youtube";

export const Route = createFileRoute("/tv")({
  head: () => ({
    meta: [
      { title: "RollerZone TV — Patinaje de velocidad en directo" },
      {
        name: "description",
        content:
          "Disfruta del patinaje de velocidad en directo. Próximas emisiones, highlights y momentos imborrables del deporte.",
      },
      { property: "og:title", content: "RollerZone TV — Patinaje en directo" },
      {
        property: "og:description",
        content: "Directos, próximas carreras y los mejores highlights.",
      },
    ],
  }),
  component: TvPage,
});

type Settings = {
  live_stream_url: string | null;
  live_title: string;
  live_subtitle: string | null;
  live_starts_at: string | null;
  live_ends_at: string | null;
  next_event_title: string | null;
  next_event_at: string | null;
};

type Broadcast = {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  stream_url: string | null;
  cover_url: string | null;
  platform: string;
  location: string | null;
};

type Highlight = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  category: string | null;
  duration: string | null;
  featured: boolean;
};

function TvPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[] | null>(null);
  const [highlights, setHighlights] = useState<Highlight[] | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [activeHighlight, setActiveHighlight] = useState<Highlight | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    supabase
      .from("tv_settings")
      .select(
        "live_stream_url, live_title, live_subtitle, live_starts_at, live_ends_at, next_event_title, next_event_at"
      )
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setSettings((data as Settings) ?? null));

    supabase
      .from("tv_broadcasts")
      .select("id, title, description, scheduled_at, stream_url, cover_url, platform, location")
      .eq("published", true)
      .gte("scheduled_at", new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(20)
      .then(({ data }) => setBroadcasts((data as Broadcast[]) ?? []));

    supabase
      .from("tv_highlights")
      .select("id, title, description, video_url, thumbnail_url, category, duration, featured")
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => setHighlights((data as Highlight[]) ?? []));
  }, []);

  const isLive = useMemo(() => {
    if (!settings?.live_starts_at) return false;
    const start = new Date(settings.live_starts_at).getTime();
    const end = settings.live_ends_at ? new Date(settings.live_ends_at).getTime() : start + 1000 * 60 * 60 * 4;
    const t = now.getTime();
    return t >= start && t <= end;
  }, [settings, now]);

  const embedUrl = youTubeEmbedUrl(settings?.live_stream_url, { autoplay: false });

  const msUntilStart = useMemo(() => {
    if (!settings?.live_starts_at) return null;
    const start = new Date(settings.live_starts_at).getTime();
    const diff = start - now.getTime();
    return diff > 0 ? diff : null;
  }, [settings, now]);

  const showCountdown = !isLive && msUntilStart !== null;

  return (
    <div className="bg-background">
      {/* HERO PLAYER */}
      <section className="relative border-b border-tv-red/40 bg-black">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1.5fr_1fr] lg:px-8 lg:py-12">
          {/* Player */}
          <div className="relative">
            <div className="relative aspect-video w-full overflow-hidden border border-tv-red/30 bg-black shadow-[0_0_40px_rgba(229,9,20,0.25)]">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={settings?.live_title ?? "RollerZone TV"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-center text-muted-foreground">
                  <Radio className="mb-3 h-10 w-10 text-tv-red" />
                  <p className="font-display text-xl tracking-widest">Sin emisión disponible</p>
                  <p className="font-condensed mt-1 text-xs uppercase tracking-widest">
                    El equipo configurará pronto la próxima emisión
                  </p>
                </div>
              )}
            </div>

            {/* Live status badge overlay */}
            <div className="absolute left-4 top-4 z-10">
              {isLive ? (
                <span className="font-condensed inline-flex items-center gap-2 bg-tv-red px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white shadow-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                  EN DIRECTO
                </span>
              ) : showCountdown ? (
                <span className="font-condensed inline-flex items-center gap-2 border border-tv-red/60 bg-black/70 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-tv-red backdrop-blur">
                  <Clock className="h-3 w-3" /> Próxima emisión
                </span>
              ) : null}
            </div>

            {/* Countdown overlay */}
            {showCountdown && msUntilStart !== null && (
              <div className="pointer-events-none absolute inset-0 z-[5] flex items-end justify-center bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 sm:p-8">
                <CountdownDisplay ms={msUntilStart} startsAt={settings!.live_starts_at!} />
              </div>
            )}
          </div>

          {/* Info side */}
          <div className="flex flex-col justify-center">
            <p className="font-condensed text-xs uppercase tracking-[3px] text-tv-red">
              RollerZone TV
            </p>
            <h1 className="font-display mt-2 text-4xl tracking-widest text-white md:text-5xl">
              {settings?.live_title ?? "RollerZone TV"}
            </h1>
            {settings?.live_subtitle && (
              <p className="mt-3 max-w-xl text-base text-muted-foreground md:text-lg">
                {settings.live_subtitle}
              </p>
            )}

            <div className="mt-6 grid gap-3 border-t border-border/50 pt-5 sm:grid-cols-2">
              <StatusBlock isLive={isLive} settings={settings} now={now} />
              {settings?.next_event_title && (
                <div className="border-l border-tv-red/40 pl-4">
                  <p className="font-condensed text-[11px] uppercase tracking-widest text-tv-red">
                    Siguiente
                  </p>
                  <p className="font-display mt-1 text-sm uppercase tracking-wider text-white">
                    {settings.next_event_title}
                  </p>
                  {settings.next_event_at && (
                    <p className="font-condensed mt-0.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                      {formatDateTime(settings.next_event_at)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PRÓXIMAS CARRERAS — CARRUSEL */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <SectionHeader
            kicker="Programación"
            title="Próximas"
            highlight="carreras"
          />

          {broadcasts === null ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="aspect-video animate-pulse bg-surface" />
              ))}
            </div>
          ) : broadcasts.length === 0 ? (
            <p className="mt-6 text-muted-foreground">Aún no hay próximas emisiones programadas.</p>
          ) : (
            <BroadcastsCarousel
              items={broadcasts}
              index={carouselIdx}
              setIndex={setCarouselIdx}
            />
          )}
        </div>
      </section>

      {/* HIGHLIGHTS GRID */}
      <section className="bg-black">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <SectionHeader
            kicker="Lo mejor"
            title="Highlights"
            highlight="& momentos"
            light
          />

          {highlights === null ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-video animate-pulse bg-surface-2" />
              ))}
            </div>
          ) : highlights.length === 0 ? (
            <p className="mt-6 text-muted-foreground">Aún no hay highlights publicados.</p>
          ) : (
            <HighlightsGrid items={highlights} onPlay={setActiveHighlight} />
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-tv-red/30 bg-gradient-to-b from-black to-background">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center lg:px-8">
          <h2 className="font-display text-2xl tracking-widest text-white md:text-3xl">
            ¿No te quieres perder <span className="text-tv-red">nada</span>?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Suscríbete a nuestro canal y activa las notificaciones para no perderte ningún directo.
          </p>
          <a
            href="https://www.youtube.com/@rollerzonespain?sub_confirmation=1"
            target="_blank"
            rel="noopener noreferrer"
            className="font-condensed mt-5 inline-flex items-center gap-2 bg-tv-red px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-tv-red-dark"
          >
            Suscribirse al canal
          </a>
          <div className="mt-4">
            <Link
              to="/eventos"
              className="font-condensed text-xs uppercase tracking-widest text-muted-foreground hover:text-tv-red"
            >
              Ver todos los eventos →
            </Link>
          </div>
        </div>
      </section>

      {/* HIGHLIGHT MODAL */}
      {activeHighlight && (
        <HighlightModal item={activeHighlight} onClose={() => setActiveHighlight(null)} />
      )}
    </div>
  );
}

function SectionHeader({
  kicker,
  title,
  highlight,
  light,
}: {
  kicker: string;
  title: string;
  highlight: string;
  light?: boolean;
}) {
  return (
    <div>
      <p className="font-condensed text-xs uppercase tracking-[3px] text-tv-red">{kicker}</p>
      <h2
        className={`font-display mt-1 text-3xl tracking-widest md:text-4xl ${
          light ? "text-white" : "text-foreground"
        }`}
      >
        {title} <span className="text-tv-red">{highlight}</span>
      </h2>
    </div>
  );
}

function StatusBlock({
  isLive,
  settings,
  now,
}: {
  isLive: boolean;
  settings: Settings | null;
  now: Date;
}) {
  if (isLive) {
    return (
      <div className="border-l border-tv-red pl-4">
        <p className="font-condensed text-[11px] uppercase tracking-widest text-tv-red">
          Estado
        </p>
        <p className="font-display mt-1 flex items-center gap-2 text-sm uppercase tracking-wider text-white">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tv-red opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-tv-red" />
          </span>
          EN DIRECTO AHORA
        </p>
      </div>
    );
  }
  if (settings?.live_starts_at) {
    const start = new Date(settings.live_starts_at);
    const isFuture = start.getTime() > now.getTime();
    return (
      <div className="border-l border-tv-red/40 pl-4">
        <p className="font-condensed text-[11px] uppercase tracking-widest text-tv-red">
          {isFuture ? "Próxima emisión" : "Última emisión"}
        </p>
        <p className="font-display mt-1 text-sm uppercase tracking-wider text-white">
          {formatDateTime(settings.live_starts_at)}
        </p>
      </div>
    );
  }
  return (
    <div className="border-l border-border pl-4">
      <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
        Estado
      </p>
      <p className="font-display mt-1 text-sm uppercase tracking-wider text-muted-foreground">
        Sin programación
      </p>
    </div>
  );
}

function BroadcastsCarousel({
  items,
  index,
  setIndex,
}: {
  items: Broadcast[];
  index: number;
  setIndex: (i: number) => void;
}) {
  const perView = 3;
  const maxIndex = Math.max(0, items.length - perView);
  const safeIndex = Math.min(index, maxIndex);

  return (
    <div className="relative mt-6">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${(safeIndex * 100) / perView}%)` }}
        >
          {items.map((b) => (
            <div key={b.id} className="w-full shrink-0 px-2 sm:w-1/2 lg:w-1/3">
              <BroadcastCard b={b} />
            </div>
          ))}
        </div>
      </div>

      {items.length > perView && (
        <>
          <button
            onClick={() => setIndex(Math.max(0, safeIndex - 1))}
            disabled={safeIndex === 0}
            aria-label="Anterior"
            className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 border border-tv-red/60 bg-black/80 p-2 text-tv-red backdrop-blur transition-opacity hover:bg-tv-red hover:text-white disabled:opacity-30 sm:block"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIndex(Math.min(maxIndex, safeIndex + 1))}
            disabled={safeIndex === maxIndex}
            aria-label="Siguiente"
            className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 border border-tv-red/60 bg-black/80 p-2 text-tv-red backdrop-blur transition-opacity hover:bg-tv-red hover:text-white disabled:opacity-30 sm:block"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Ir a ${i + 1}`}
                className={`h-1 w-6 transition-colors ${
                  i === safeIndex ? "bg-tv-red" : "bg-border"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BroadcastCard({ b }: { b: Broadcast }) {
  const cover = b.cover_url || youTubeThumbnail(b.stream_url);
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    b.stream_url ? (
      <a
        href={b.stream_url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block overflow-hidden border border-border bg-surface transition-all hover:border-tv-red hover:shadow-[0_0_30px_rgba(229,9,20,0.2)]"
      >
        {children}
      </a>
    ) : (
      <div className="block overflow-hidden border border-border bg-surface">{children}</div>
    );

  return (
    <Wrapper>
      <div className="relative aspect-video overflow-hidden bg-black">
        {cover ? (
          <img
            src={cover}
            alt={b.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="hero-grid-bg flex h-full w-full items-center justify-center">
            <Radio className="h-10 w-10 text-tv-red/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute left-3 top-3">
          <span className="font-condensed inline-flex items-center gap-1 bg-tv-red px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
            <Radio className="h-3 w-3" /> {b.platform}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="font-condensed flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-white">
            <Calendar className="h-3 w-3" /> {formatDateTime(b.scheduled_at)}
          </p>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display clamp-2 text-base leading-tight tracking-wide text-foreground group-hover:text-tv-red">
          {b.title}
        </h3>
        {b.location && (
          <p className="font-condensed mt-2 flex items-center gap-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            <MapPin className="h-3 w-3" /> {b.location}
          </p>
        )}
        {b.description && (
          <p className="clamp-2 mt-2 text-sm text-muted-foreground">{b.description}</p>
        )}
      </div>
    </Wrapper>
  );
}

function HighlightsGrid({
  items,
  onPlay,
}: {
  items: Highlight[];
  onPlay: (h: Highlight) => void;
}) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((h, i) => {
        const isFeatured = h.featured && i === 0;
        return (
          <button
            key={h.id}
            onClick={() => onPlay(h)}
            className={`group relative overflow-hidden border border-border bg-surface text-left transition-all hover:border-tv-red hover:shadow-[0_0_30px_rgba(229,9,20,0.25)] ${
              isFeatured ? "sm:col-span-2 lg:row-span-2" : ""
            }`}
          >
            <div className={`relative overflow-hidden bg-black ${isFeatured ? "aspect-[16/10]" : "aspect-video"}`}>
              {(() => {
                const thumb = h.thumbnail_url || youTubeThumbnail(h.video_url);
                return thumb ? (
                  <img
                    src={thumb}
                    alt={h.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="hero-grid-bg flex h-full w-full items-center justify-center">
                    <Play className="h-12 w-12 text-tv-red/50" />
                  </div>
                );
              })()}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-tv-red text-white shadow-2xl">
                  <Play className="ml-1 h-7 w-7 fill-white" />
                </span>
              </div>
              {h.duration && (
                <div className="absolute right-2 top-2 bg-black/80 px-2 py-0.5 text-[11px] font-bold tracking-wider text-white">
                  {h.duration}
                </div>
              )}
              {h.category && (
                <div className="absolute left-2 top-2">
                  <span className="font-condensed bg-tv-red/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                    {h.category}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3
                  className={`font-display tracking-wide text-white group-hover:text-tv-red ${
                    isFeatured ? "clamp-2 text-2xl md:text-3xl" : "clamp-2 text-base"
                  }`}
                >
                  {h.title}
                </h3>
                {isFeatured && h.description && (
                  <p className="clamp-2 mt-2 text-sm text-white/80">{h.description}</p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function HighlightModal({ item, onClose }: { item: Highlight; onClose: () => void }) {
  const embed = youTubeEmbedUrl(item.video_url, { autoplay: true });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute -top-10 right-0 text-white hover:text-tv-red"
        >
          ✕ CERRAR
        </button>
        <div className="aspect-video w-full border border-tv-red bg-black shadow-[0_0_60px_rgba(229,9,20,0.4)]">
          {embed ? (
            <iframe
              src={embed}
              title={item.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              No se puede reproducir este vídeo. Ábrelo en{" "}
              <a
                href={item.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-tv-red underline"
              >
                la plataforma original
              </a>
              .
            </div>
          )}
        </div>
        <div className="mt-3 text-white">
          <h3 className="font-display text-xl tracking-wide">{item.title}</h3>
          {item.description && (
            <p className="mt-1 text-sm text-white/70">{item.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
