import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { MapPin, Play, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { videoEmbedUrl, videoThumbnail } from "@/lib/videoEmbed";
import { TvTopStage, type TvStageStatus } from "@/components/tv/TvTopStage";
import { TvMobileNav } from "@/components/tv/TvMobileNav";
import { ExternalEmbedGate } from "@/components/site/ExternalEmbedGate";
import { TvPremiumBanner } from "@/components/tv/TvPremiumBanner";
import { TvAdSlot, useVisibleBanners } from "@/components/tv/TvAdSlot";
import { TvPartners, useTvPartners } from "@/components/tv/TvPartners";


const TV_OG_IMAGE = "https://rollerzone.es/__l5e/assets-v1/57c70012-bbe9-4642-b766-6b243447cc73/og-rollerzone-tv.jpg";
const TV_CANONICAL = "https://rollerzone.es/tv";
const TV_TITLE = "Rollerzone TV | El canal del patinaje de velocidad";
const TV_DESCRIPTION =
  "Directos, retransmisiones, vídeos, momentos destacados y contenido audiovisual del patinaje de velocidad nacional e internacional.";

export const Route = createFileRoute("/tv")({
  head: () => ({
    meta: [
      { title: TV_TITLE },
      { name: "description", content: TV_DESCRIPTION },
      { property: "og:title", content: TV_TITLE },
      { property: "og:description", content: TV_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: TV_CANONICAL },
      { property: "og:image", content: TV_OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "RollerZone TV — El canal del patinaje de velocidad" },
      { property: "og:site_name", content: "RollerZone" },
      { property: "og:locale", content: "es_ES" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TV_TITLE },
      { name: "twitter:description", content: TV_DESCRIPTION },
      { name: "twitter:image", content: TV_OG_IMAGE },
      { name: "twitter:image:alt", content: "RollerZone TV — El canal del patinaje de velocidad" },
    ],
    links: [{ rel: "canonical", href: TV_CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BroadcastService",
              name: "Rollerzone TV",
              url: TV_CANONICAL,
              inLanguage: "es-ES",
              broadcastDisplayName: "Rollerzone TV",
              description: TV_DESCRIPTION,
              publisher: { "@type": "Organization", name: "Rollerzone", url: "https://rollerzone.es" },
              areaServed: ["ES", "CO", "PT"],
            },
            {
              "@type": "VideoObject",
              name: TV_TITLE,
              description: TV_DESCRIPTION,
              thumbnailUrl: [TV_OG_IMAGE],
              uploadDate: "2025-01-01T00:00:00.000Z",
              contentUrl: TV_CANONICAL,
              embedUrl: TV_CANONICAL,
              publisher: { "@type": "Organization", name: "Rollerzone", url: "https://rollerzone.es" },
            },
          ],
        }).replace(/</g, "\\u003c"),
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
  live_is_active: boolean;
  status_label: string;
  live_thumbnail_url: string | null;
  next_event_title: string | null;
  next_event_at: string | null;
  premium_autoplay: boolean;
  premium_interval_ms: number;
  premium_show_arrows: boolean;
  premium_show_dots: boolean;
  subscribe_title: string | null;
  subscribe_text: string | null;
  subscribe_button_text: string | null;
  subscribe_button_url: string | null;
  live_center_event_slug: string | null;
  show_live_center: boolean;
  live_center_position: "right" | "bottom";
  show_full_results_button: boolean;
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
  created_at: string | null;
};

function TvPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[] | null>(null);
  const [highlights, setHighlights] = useState<Highlight[] | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [activeHighlight, setActiveHighlight] = useState<Highlight | null>(null);
  const [playerActive, setPlayerActive] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash?.replace(/^#/, "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [location.hash]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    supabase
      .from("tv_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const row = Array.isArray(data) ? data[0] : data;
        setSettings((row as Settings) ?? null);
      });

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
      .select("id, title, description, video_url, thumbnail_url, category, duration, featured, created_at")
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => setHighlights((data as Highlight[]) ?? []));
  }, []);

  // Estado: solo manual (activación en Admin TV). Nunca se autoactiva por horario.
  const status: TvStageStatus = settings?.live_is_active || settings?.status_label === "live"
    ? "live"
    : settings?.status_label === "finished"
      ? "finished"
      : "upcoming";

  // Programación: SOLO emisiones futuras publicadas.
  const upcomingBroadcasts = useMemo(
    () => (broadcasts ?? []).filter((x) => new Date(x.scheduled_at).getTime() > now.getTime()),
    [broadcasts, now],
  );
  const nextBroadcast = upcomingBroadcasts[0]
    ? { title: upcomingBroadcasts[0].title, at: upcomingBroadcasts[0].scheduled_at }
    : null;

  const hasLiveCenter = !!(settings?.show_live_center && settings?.live_center_event_slug);
  const hasProgram = upcomingBroadcasts.length > 0;
  const hasHighlights = !!highlights && highlights.length > 0;
  const navItems = [
    { id: "directo", label: "Directo" },
    ...(hasLiveCenter ? [{ id: "live-center", label: "Live Center" }] : []),
    ...(hasProgram ? [{ id: "emisiones", label: "Programación" }] : []),
    ...(hasHighlights ? [{ id: "highlights", label: "Highlights" }] : []),
  ];

  // Publicidad (solo banners visibles en este dispositivo).
  const tv03 = useVisibleBanners("tv_03");
  const tv04 = useVisibleBanners("tv_04");
  const tvPremium = useVisibleBanners("tv_premium");
  const tv05 = useVisibleBanners("tv_05");
  const tv06 = useVisibleBanners("tv_06");
  const partners = useTvPartners();

  // ¿La zona superior termina en publicidad? (TV-03 sin próxima emisión ni Live Center debajo)
  const nextShown =
    status !== "live" &&
    ((settings?.next_event_title && settings.next_event_at && new Date(settings.next_event_at).getTime() > now.getTime()) ||
      !!nextBroadcast);
  const liveCenterBelow = hasLiveCenter && settings?.live_center_position === "bottom";
  const topEndsWithAd = tv03.length > 0 && !nextShown && !liveCenterBelow;

  type Block = { key: string; ad: boolean; node: React.ReactNode };
  const blocks: Block[] = [];
  // Bajo Live Center: TV-04 tiene prioridad; si no hay campaña TV-04, se muestra el carrusel tv_premium.
  if (tv04.length > 0) {
    blocks.push({
      key: "tv04",
      ad: true,
      node: <TvAdSlot banner={tv04[0]} placement="tv_04" desktop={{ w: 1200, h: 200 }} mobile={{ w: 640, h: 320 }} />,
    });
  } else if (tvPremium.length > 0) {
    blocks.push({
      key: "tv_premium",
      ad: true,
      node: (
        <section aria-label="Publicidad" className="bg-background">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
            <TvPremiumBanner
              autoplay={settings?.premium_autoplay ?? true}
              intervalMs={settings?.premium_interval_ms ?? 5000}
              showArrows={settings?.premium_show_arrows ?? false}
              showDots={settings?.premium_show_dots ?? true}
            />
          </div>
        </section>
      ),
    });
  }
  const tv05Block: Block | null = tv05.length
    ? {
        key: "tv05",
        ad: true,
        node: <TvAdSlot banner={tv05[0]} placement="tv_05" desktop={{ w: 970, h: 250 }} mobile={{ w: 300, h: 250 }} />,
      }
    : null;
  if (hasProgram) {
    blocks.push({
      key: "prog",
      ad: false,
      node: (
        <section id="emisiones" className="scroll-mt-28 border-y border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
            <SectionHeader kicker="Programación" title="Próximas" highlight="emisiones" />
            <BroadcastsRail items={upcomingBroadcasts} />
          </div>
        </section>
      ),
    });
    if (tv05Block) blocks.push(tv05Block);
  }
  if (hasHighlights) {
    blocks.push({
      key: "hl",
      ad: false,
      node: (
        <section id="highlights" className="scroll-mt-28 border-y border-border bg-surface/40">
          <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
            <SectionHeader kicker="Lo mejor" title="Highlights" highlight="& vídeos" />
            <HighlightsRail items={highlights!} onPlay={setActiveHighlight} />
          </div>
        </section>
      ),
    });
  }
  // Sin Programación: TV-05 se coloca después de Highlights (nunca pegado a TV-04).
  if (!hasProgram && tv05Block) blocks.push(tv05Block);
  blocks.push({
    key: "cta",
    ad: false,
    node: (
      <section className="border-t border-gold/30 bg-background">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center lg:px-8">
          <h2 className="font-display text-2xl tracking-widest text-foreground md:text-3xl">
            {settings?.subscribe_title ?? "¿No te quieres perder nada?"}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {settings?.subscribe_text ??
              "Suscríbete a nuestro canal y activa las notificaciones para no perderte ningún directo."}
          </p>
          <a
            href={settings?.subscribe_button_url ?? "https://www.youtube.com/@rollerzonespain?sub_confirmation=1"}
            target="_blank"
            rel="noopener noreferrer"
            className="font-condensed mt-5 inline-flex min-h-11 items-center gap-2 bg-gold px-6 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-gold-dark"
          >
            {settings?.subscribe_button_text ?? "Suscribirse al canal"}
          </a>
        </div>
      </section>
    ),
  });
  if (partners.length) {
    blocks.push({ key: "partners", ad: false, node: <TvPartners items={partners} /> });
  }
  if (tv06.length) {
    blocks.push({
      key: "tv06",
      ad: true,
      node: <TvAdSlot banner={tv06[0]} placement="tv_06" desktop={{ w: 1200, h: 200 }} mobile={{ w: 640, h: 320 }} />,
    });
  }
  // Regla anti-saturación: nunca dos espacios publicitarios seguidos.
  const rendered: Block[] = [];
  let prevAd = topEndsWithAd;
  for (const b of blocks) {
    if (b.ad && prevAd) continue;
    rendered.push(b);
    prevAd = b.ad;
  }

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-clip bg-background">
      <TvMobileNav items={navItems} live={status === "live"} />
      <TvTopStage settings={settings} status={status} nextBroadcast={nextBroadcast} />
      {rendered.map((b) => (
        <Fragment key={b.key}>{b.node}</Fragment>
      ))}
      {activeHighlight && (
        <HighlightModal item={activeHighlight} onClose={() => setActiveHighlight(null)} />
      )}
    </div>
  );
}

function StatusBadge({ tone, label }: { tone: "live" | "gold" | "muted"; label: string }) {
  if (tone === "live") {
    return (
      <span className="font-condensed inline-flex items-center gap-2 bg-tv-red px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        {label}
      </span>
    );
  }
  if (tone === "muted") {
    return (
      <span className="font-condensed inline-flex items-center gap-2 border border-border bg-surface px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    );
  }
  return (
    <span className="font-condensed inline-flex items-center gap-2 border border-gold/60 bg-gold/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-gold">
      {label}
    </span>
  );
}

function SectionHeader({
  kicker,
  title,
  highlight,
}: {
  kicker: string;
  title: string;
  highlight: string;
}) {
  return (
    <div>
      <p className="font-condensed text-xs uppercase tracking-[3px] text-gold">{kicker}</p>
      <h2 className="font-display mt-1 text-3xl tracking-widest text-foreground md:text-4xl">
        {title} <span className="text-gold">{highlight}</span>
      </h2>
    </div>
  );
}

/** Carril táctil en móvil (tarjetas ~82 % del ancho) y rejilla en tablet/desktop. */
const RAIL = "mt-6 -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:scroll-px-0 lg:grid-cols-3";
const RAIL_ITEM = "w-[82%] shrink-0 snap-start sm:w-auto";

function BroadcastsRail({ items }: { items: Broadcast[] }) {
  return (
    <div className={RAIL}>
      {items.map((b) => (
        <div key={b.id} className={RAIL_ITEM}>
          <BroadcastCard b={b} />
        </div>
      ))}
    </div>
  );
}

function BroadcastCard({ b }: { b: Broadcast }) {
  const cover = b.cover_url || videoThumbnail(b.stream_url);
  const d = new Date(b.scheduled_at);
  const day = d.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" });
  const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const body = (
    <>
      <div className="relative aspect-video overflow-hidden bg-black">
        {cover ? (
          <img src={cover} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover opacity-80" />
        ) : (
          <div className="hero-grid-bg flex h-full w-full items-center justify-center">
            <Radio className="h-10 w-10 text-gold/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <span className="font-condensed absolute left-2 top-2 border border-gold/60 bg-background/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold">
          Próximamente
        </span>
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
          <p className="font-condensed text-[11px] uppercase tracking-widest text-white/85">{day}</p>
          <p className="font-display text-xl leading-none text-gold">{time}</p>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-display clamp-2 text-base leading-tight tracking-wide text-foreground group-hover:text-gold">
          {b.title}
        </h3>
        {b.location && (
          <p className="font-condensed mt-1.5 flex items-center gap-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{b.location}</span>
          </p>
        )}
      </div>
    </>
  );
  return b.stream_url ? (
    <a
      href={b.stream_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block h-full overflow-hidden border border-border bg-surface transition-colors hover:border-gold"
    >
      {body}
    </a>
  ) : (
    <div className="block h-full overflow-hidden border border-border bg-surface">{body}</div>
  );
}

function HighlightsRail({ items, onPlay }: { items: Highlight[]; onPlay: (h: Highlight) => void }) {
  return (
    <div className={RAIL}>
      {items.map((h) => {
        const thumb = h.thumbnail_url || videoThumbnail(h.video_url);
        const date = h.created_at
          ? new Date(h.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
          : null;
        return (
          <div key={h.id} className={RAIL_ITEM}>
            <button
              type="button"
              onClick={() => onPlay(h)}
              aria-label={`Reproducir: ${h.title}`}
              className="group block h-full w-full overflow-hidden border border-border bg-surface text-left transition-colors hover:border-gold"
            >
              <div className="relative aspect-video overflow-hidden bg-black">
                {thumb ? (
                  <img
                    src={thumb}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="hero-grid-bg h-full w-full" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/95 text-primary-foreground shadow-xl transition-transform group-hover:scale-110">
                    <Play className="ml-0.5 h-5 w-5 fill-current" />
                  </span>
                </span>
                {h.duration && (
                  <span className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 font-mono text-[11px] text-white">
                    {h.duration}
                  </span>
                )}
                {h.category && (
                  <span className="font-condensed absolute left-2 top-2 bg-gold/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                    {h.category}
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-display clamp-2 text-base leading-tight tracking-wide text-foreground group-hover:text-gold">
                  {h.title}
                </h3>
                {date && (
                  <p className="font-condensed mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">{date}</p>
                )}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function HighlightModal({ item, onClose }: { item: Highlight; onClose: () => void }) {
  const embed = videoEmbedUrl(item.video_url, { autoplay: true });
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
      <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute -top-10 right-0 text-white hover:text-gold"
        >
          ✕ CERRAR
        </button>
        <div className="aspect-video w-full border border-gold bg-black shadow-[0_0_60px_oklch(0.78_0.16_70/0.3)]">
          {embed ? (
            <ExternalEmbedGate provider="reproductor externo" sourceUrl={item.video_url}>
              <iframe
                src={embed}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </ExternalEmbedGate>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              No se puede reproducir este vídeo. Ábrelo en{" "}
              <a
                href={item.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-gold underline"
              >
                la plataforma original
              </a>
              .
            </div>
          )}
        </div>
        <div className="mt-3 text-foreground">
          <h3 className="font-display text-xl tracking-wide">{item.title}</h3>
          {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
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
