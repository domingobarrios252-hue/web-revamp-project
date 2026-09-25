import { useEffect, useState } from "react";
import { Play, Radio, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { videoEmbedUrl, videoThumbnail } from "@/lib/videoEmbed";
import { useAdBanners, type AdBanner } from "@/lib/useAdBanners";
import { AdCreative } from "@/components/site/AdCreative";
import { ExternalEmbedGate } from "@/components/site/ExternalEmbedGate";
import { TvEventLiveCenter } from "@/components/tv/TvEventLiveCenter";
import { TvSidebarBanners } from "@/components/tv/TvSidebarBanners";

export type TvStageSettings = {
  live_stream_url: string | null;
  live_title: string;
  live_subtitle: string | null;
  live_starts_at: string | null;
  live_ends_at: string | null;
  live_thumbnail_url: string | null;
  next_event_title: string | null;
  next_event_at: string | null;
  live_center_event_slug: string | null;
  show_live_center: boolean;
  live_center_position: "right" | "bottom";
  show_full_results_button: boolean;
};

export type TvStageStatus = "live" | "upcoming" | "finished";
type NextItem = { title: string; at: string };

const STATUS_LABEL: Record<TvStageStatus, string> = {
  live: "En directo",
  upcoming: "Próximamente",
  finished: "Finalizado",
};

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

function dateRange(a: string | null, b: string | null) {
  if (!a) return null;
  const da = fmtDay(a);
  if (!b) return da;
  const db = fmtDay(b);
  if (da === db) return da;
  const A = new Date(a);
  const B = new Date(b);
  if (A.getFullYear() === B.getFullYear() && A.getMonth() === B.getMonth())
    return `${A.getDate()}–${db}`;
  return `${da} – ${db}`;
}

function StatusPill({ status }: { status: TvStageStatus }) {
  if (status === "live")
    return (
      <span className="font-condensed inline-flex shrink-0 items-center gap-1.5 bg-tv-red px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
        {STATUS_LABEL.live}
      </span>
    );
  return (
    <span
      className={
        "font-condensed inline-flex shrink-0 items-center border px-2 py-1 text-[10px] font-bold uppercase tracking-widest " +
        (status === "finished" ? "border-border text-muted-foreground" : "border-gold/60 text-gold")
      }
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** TV-01 · Presenting Partner: franja discreta "Presentado por [logo]". */
function PresentingPartner({ banner }: { banner: AdBanner }) {
  return (
    <div className="flex min-w-0 items-center gap-2 md:gap-3">
      <span className="font-condensed shrink-0 text-[9px] uppercase tracking-[2.5px] text-muted-foreground md:text-[10px]">
        Presentado por
      </span>
      <AdCreative
        banner={banner}
        placement="tv_01"
        className="block min-w-0"
        width={970}
        height={90}
        imgClassName="block h-9 w-auto max-w-[160px] object-contain md:h-[45px] md:max-w-[485px]"
      />
    </div>
  );
}

/**
 * Fase 1 del rediseño: cabecera compacta + TV-01 + reproductor + TV-02 + TV-03 + próxima emisión.
 * Reutiliza tv_settings, tv_broadcasts, result_events y el gestor de Banners.
 */
export function TvTopStage({
  settings,
  status,
  nextBroadcast,
}: {
  settings: TvStageSettings | null;
  status: TvStageStatus;
  nextBroadcast: NextItem | null;
}) {
  const [playerActive, setPlayerActive] = useState(false);
  const [place, setPlace] = useState<string | null>(null);
  const tv01 = useAdBanners("tv_01");
  const tv02 = useAdBanners("tv_02");
  const tv03 = useAdBanners("tv_03");
  const legacyLarge = useAdBanners("tv_sidebar");
  const legacySmall = useAdBanners("tv_side");

  // Ubicación: solo del evento vinculado a esta emisión (mismo slug que el Live Center).
  const slug = settings?.live_center_event_slug ?? null;
  useEffect(() => {
    if (!slug) return setPlace(null);
    supabase
      .from("result_events")
      .select("city, country")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        const d = data as { city: string | null; country: string | null } | null;
        setPlace([d?.city, d?.country].filter(Boolean).join(", ") || null);
      });
  }, [slug]);

  const embedUrl = videoEmbedUrl(settings?.live_stream_url, { autoplay: true });
  const thumbnail = settings?.live_thumbnail_url || videoThumbnail(settings?.live_stream_url) || null;
  const title = settings?.live_title || "Rollerzone TV";
  const range = dateRange(settings?.live_starts_at ?? null, settings?.live_ends_at ?? null);
  const meta = [range, place].filter(Boolean).join(" · ");

  const partner = tv01[0];
  const tv02Banner = tv02[0];
  const tv03Banner = tv03[0];
  const liveCenterRight = !!(settings?.show_live_center && slug && settings.live_center_position === "right");
  const liveCenterBottom = !!(settings?.show_live_center && slug && settings.live_center_position === "bottom");
  const legacyRail = legacyLarge.length + legacySmall.length > 0;
  const hasRail = !!tv02Banner || legacyRail || liveCenterRight;

  const next =
    status !== "live"
      ? settings?.next_event_title && settings.next_event_at && new Date(settings.next_event_at).getTime() > Date.now()
        ? { title: settings.next_event_title, at: settings.next_event_at }
        : nextBroadcast
      : null;

  return (
    <section id="directo" className="scroll-mt-28 border-b border-gold/30 bg-background">
      {/* CABECERA COMPACTA */}
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 pb-3 pt-4 lg:px-8 lg:pb-4 lg:pt-6">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="font-display shrink-0 text-sm tracking-[4px] text-gold md:text-base">ROLLERZONE TV</p>
          {partner && <PresentingPartner banner={partner} />}
        </div>
        <div className="mt-2 flex min-w-0 items-start gap-2 md:items-center md:gap-3">
          <h1 className="font-display min-w-0 text-xl leading-tight tracking-wider text-foreground md:text-3xl">
            {title}
          </h1>
          <span className="mt-0.5 md:mt-0">
            <StatusPill status={status} />
          </span>
        </div>
        {meta && (
          <p className="font-condensed mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">{meta}</p>
        )}
      </div>

      {/* REPRODUCTOR + RAIL LATERAL (solo desktop) */}
      <div
        className={
          "mx-auto grid w-full max-w-7xl min-w-0 grid-cols-[minmax(0,1fr)] gap-6 pb-6 md:px-4 lg:px-8 lg:pb-10 " +
          (hasRail ? "lg:grid-cols-[minmax(0,1fr)_300px]" : "")
        }
      >
        <div className="min-w-0">
          <div className="relative aspect-video w-full overflow-hidden border-y border-gold/30 bg-black md:border md:shadow-[0_0_40px_oklch(0.78_0.16_70/0.18)]">
            {playerActive && embedUrl ? (
              <ExternalEmbedGate provider="reproductor externo">
                <iframe
                  src={embedUrl}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 block h-full w-full border-0"
                />
              </ExternalEmbedGate>
            ) : embedUrl ? (
              <button
                type="button"
                onClick={() => setPlayerActive(true)}
                className="group relative flex h-full w-full items-center justify-center bg-black"
                aria-label={`Reproducir: ${title}`}
              >
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt=""
                    width={1280}
                    height={720}
                    fetchPriority="high"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                  />
                ) : (
                  <div className="hero-grid-bg absolute inset-0" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gold text-primary-foreground shadow-2xl transition-transform group-hover:scale-110 md:h-20 md:w-20">
                  <Play className="ml-1 h-7 w-7 fill-current md:h-9 md:w-9" />
                </span>
              </button>
            ) : settings?.live_stream_url ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
                <Radio className="h-8 w-8 text-gold" />
                <p className="font-display text-lg tracking-widest text-foreground">Retransmisión externa</p>
                <a
                  href={settings.live_stream_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-condensed inline-flex min-h-11 items-center border border-gold bg-gold px-5 text-[11px] font-bold uppercase tracking-widest text-primary-foreground hover:bg-gold-dark"
                >
                  Ver retransmisión
                </a>
              </div>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-center text-muted-foreground">
                <Radio className="mb-2 h-8 w-8 text-gold" />
                <p className="font-display text-lg tracking-widest">Sin emisión disponible</p>
              </div>
            )}
            {status === "live" && (
              <span className="font-condensed pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 bg-tv-red px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                En directo
              </span>
            )}
          </div>

          <div className="px-4 md:px-0">
            {/* TV-03 · Bajo reproductor */}
            {tv03Banner && (
              <div className="mt-4">
                <div className="font-condensed mb-1 text-[9px] uppercase tracking-widest text-muted-foreground/60">
                  Publicidad
                </div>
                <div className="aspect-[16/5] w-full overflow-hidden border border-border bg-surface md:aspect-[97/25]">
                  <AdCreative
                    banner={tv03Banner}
                    placement="tv_03"
                    className="block h-full w-full"
                    width={970}
                    height={250}
                    imgClassName="block h-full w-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* PRÓXIMA EMISIÓN (solo si existe una real) */}
            {next && (
              <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border border-gold/30 bg-surface px-3 py-2.5">
                <CalendarClock className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-condensed text-[10px] uppercase tracking-[2px] text-gold">Próxima emisión</p>
                  <p className="truncate text-sm font-semibold uppercase text-foreground">{next.title}</p>
                  <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                    {fmtDate(next.at)} · {fmtTime(next.at)} h <span className="normal-case">(tu hora)</span>
                  </p>
                </div>
                <StatusPill status="upcoming" />
              </div>
            )}

            {liveCenterBottom && slug && (
              <div id="live-center" className="mt-6 scroll-mt-28">
                <TvEventLiveCenter
                  eventSlug={slug}
                  layout="bottom"
                  showFullResultsButton={settings?.show_full_results_button ?? false}
                />
              </div>
            )}
          </div>
        </div>

        {hasRail && (
          <div className="flex min-w-0 flex-col gap-4 px-4 md:px-0">
            {liveCenterRight && slug && (
              <div id="live-center" className="scroll-mt-28">
                <TvEventLiveCenter
                  eventSlug={slug}
                  layout="right"
                  showFullResultsButton={settings?.show_full_results_button ?? false}
                />
              </div>
            )}
            {/* TV-02 · exclusivamente desktop */}
            {tv02Banner && (
              <div className="hidden lg:block">
                <div className="font-condensed mb-1 text-[9px] uppercase tracking-widest text-muted-foreground/60">
                  Publicidad
                </div>
                <div className="aspect-[6/5] w-full overflow-hidden border border-border bg-surface">
                  <AdCreative
                    banner={tv02Banner}
                    placement="tv_02"
                    className="block h-full w-full"
                    width={300}
                    height={250}
                    imgClassName="block h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
            {/* Laterales antiguos: siguen activos en desktop; en móvil no se apilan */}
            {legacyRail && (
              <div className="hidden lg:block">
                <TvSidebarBanners />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
