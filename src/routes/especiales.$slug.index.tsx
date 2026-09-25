import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import specialFallback from "@/assets/special-fallback.svg";
import { LiveEventHero } from "@/components/specials/live/LiveEventHero";
import { LiveEventNav } from "@/components/specials/live/LiveEventNav";
import { LiveSchedule } from "@/components/specials/live/LiveSchedule";
import { LiveStream, streamMode } from "@/components/specials/live/LiveStream";
import { LiveUpdates, type TimelineRow } from "@/components/specials/live/LiveUpdates";
import {
  buildLiveNav,
  isEventLive,
  resolveCtas,
  loadLinkedEvent,
  STREAM_COLUMNS,
  type EventStream,
  dayRange,
  venueTimeZone,
  type ScheduleItem,
  type LinkedEvent,
  type LiveSpecial,
} from "@/lib/specials/liveEvent";

const SITE = "https://rollerzone.es";

type Special = LiveSpecial & { status: string };

type Piece = {
  slug: string;
  number: string;
  kicker: string;
  category: string;
  title: string;
  description: string;
  excerpt: string;
  image_url: string;
  thumbnail_url: string;
  sort_order: number;
  featured: boolean;
  visible: boolean;
  status: string;
  external_url: string;
};

export const Route = createFileRoute("/especiales/$slug/")({
  loader: async ({ params }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data: sp } = await sb
      .from("special_editorials")
      .select("*")
      .eq("slug", params.slug)
      .eq("status", "active")
      .maybeSingle();
    if (!sp) throw notFound();
    const { data: pcs } = await sb
      .from("special_pieces")
      .select("*")
      .eq("special_slug", params.slug)
      .in("status", ["published", "live"])
      .eq("visible", true)
      .order("sort_order", { ascending: true });
    const event: LinkedEvent | null = await loadLinkedEvent(sb, sp);
    let schedule: ScheduleItem[] = [];
    let stream: EventStream | null = null;
    let timeline: TimelineRow[] = [];
    if (sp.result_event_id) {
      const { data: st } = await sb.from("result_events").select(STREAM_COLUMNS).eq("id", sp.result_event_id).maybeSingle();
      stream = (st as unknown as EventStream) ?? null;
      const { data: tl } = await sb
        .from("live_timeline")
        .select("id,entry_type,message,occurred_at")
        .eq("result_event_id", sp.result_event_id)
        .eq("published", true)
        .order("occurred_at", { ascending: false })
        .limit(30);
      timeline = (tl ?? []) as TimelineRow[];
      const { data: si } = await sb
        .from("schedule_items")
        .select("id,event_name,event_name_en,category,gender,phase,discipline,venue_type,location,scheduled_at,status,featured,sort_order")
        .eq("result_event_id", sp.result_event_id)
        .eq("published", true)
        .order("scheduled_at", { ascending: true });
      schedule = (si ?? []) as ScheduleItem[];
    }
    return {
      special: sp as Special,
      pieces: (pcs ?? []) as Piece[],
      event,
      schedule,
      stream,
      timeline,
      url: `${SITE}/especiales/${params.slug}`,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Especial no disponible | Rollerzone" },
          { name: "robots", content: "noindex, follow" },
        ],
      };
    }
    const { special, url } = loaderData;
    const title = `${special.title} | Rollerzone`;
    const description = (
      special.description ||
      special.subtitle ||
      `Cobertura especial de Rollerzone: ${special.title}.`
    ).slice(0, 300);
    const image = (special.hero_image_url || special.cover_url || "").trim();
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ];
    if (image.startsWith("http")) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
    }
    return { meta, links: [{ rel: "canonical", href: url }] };
  },
  component: SpecialLanding,
  notFoundComponent: SpecialNotFound,
});

function SpecialLanding() {
  const { slug } = Route.useParams();
  const { special, pieces, event, schedule, stream, timeline } = Route.useLoaderData();
  const hasStream = streamMode(stream) !== null;
  const streamLive = streamMode(stream) === "player";
  const sp = special as Special & { schedule_notice?: string | null; schedule_notice_visible?: boolean; today_override?: string | null };

  const heroImage = special.hero_image_url?.trim() || special.cover_url?.trim() || (specialFallback as string);
  const featured = pieces.filter((p) => p.featured);
  const rest = pieces.filter((p) => !p.featured);
  const isLiveHub = Boolean(special.result_event_id || special.event_id);
  const live = isEventLive(event);

  return (
    <>
      {isLiveHub ? (
        <>
          <LiveEventHero
            special={{
              ...special,
              start_date: special.start_date ?? event?.start_date ?? null,
              end_date: special.end_date ?? event?.end_date ?? null,
            }}
            ctas={resolveCtas(special, pieces).map((c) => (c.url === `/especiales/${slug}` ? { ...c, url: "#hoy" } : c))}
            live={live}
            location={special.location?.trim() || event?.city || event?.location || ""}
          />
          <LiveEventNav slug={slug} items={buildLiveNav(pieces, { hasSchedule: schedule.length > 0, hasStream })} live={live} />
        </>
      ) : (
      <section className="relative overflow-hidden bg-surface">
        <div className="absolute inset-0">
          <img loading="lazy" decoding="async"
            src={heroImage}
            alt=""
            className="h-full w-full object-cover opacity-40"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-20 md:px-6 md:py-28">
          <Link
            to="/especiales"
            className="font-condensed inline-block text-[10px] font-bold uppercase tracking-[3px] text-gold hover:text-gold-light"
          >
            ← Especiales RollerZone
          </Link>
          <h1 className="font-display mt-4 text-4xl uppercase tracking-wider text-foreground md:text-6xl">
            {special.title}
          </h1>
          <div className="mt-4 h-[3px] w-24 bg-gold" />
          {special.subtitle && (
            <p className="mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
              {special.subtitle}
            </p>
          )}
        </div>
      </section>
      )}

      {/* Description */}
      {special.description && (
        <section className="bg-background py-12">
          <div className="mx-auto max-w-3xl px-4 md:px-6">
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              {special.description}
            </p>
          </div>
        </section>
      )}

      <div id="hoy" className="scroll-mt-14" />
      {isLiveHub && (
        <>
        <LiveStream stream={stream} city={event?.city ? event.city.charAt(0) + event.city.slice(1).toLowerCase() : ""} tz={venueTimeZone(event?.country)} />
        <LiveUpdates items={timeline} tz={venueTimeZone(event?.country)} />
        <LiveSchedule
          streamAnchor={streamLive ? "#directo" : undefined}
          items={schedule}
          days={dayRange(event?.start_date ?? special.start_date, event?.end_date ?? special.end_date)}
          tz={venueTimeZone(event?.country)}
          city={event?.city ? event.city.charAt(0) + event.city.slice(1).toLowerCase() : ""}
          todayOverride={sp.today_override}
          notice={sp.schedule_notice}
          noticeVisible={sp.schedule_notice_visible}
        />
        </>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="bg-background py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <h2 className="font-display mb-6 text-2xl uppercase tracking-wider text-foreground">
              Piezas destacadas
            </h2>
            <ol className="grid gap-5 sm:grid-cols-2">
              {featured.map((p) => (
                <PieceCard key={p.slug} piece={p} specialSlug={slug} large />
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* All pieces */}
      <section className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <h2 className="font-display mb-6 text-2xl uppercase tracking-wider text-foreground">
            {featured.length > 0 ? "Todas las piezas" : "Piezas del especial"}
          </h2>
          {rest.length === 0 && featured.length === 0 ? (
            <div className="border border-dashed border-border p-8 text-center text-muted-foreground">
              Aún no hay piezas publicadas en este especial.
            </div>
          ) : (
            <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(rest.length ? rest : featured).map((p) => (
                <PieceCard key={p.slug} piece={p} specialSlug={slug} />
              ))}
            </ol>
          )}
        </div>
      </section>
    </>
  );
}

function PieceCard({
  piece,
  specialSlug,
  large,
}: {
  piece: Piece;
  specialSlug: string;
  large?: boolean;
}) {
  const img = piece.image_url || piece.thumbnail_url || (specialFallback as string);
  return (
    <li>
      <Link
        to="/especiales/$slug/$piece"
        params={{ slug: specialSlug, piece: piece.slug }}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lg transition-all hover:-translate-y-1 hover:border-gold hover:shadow-[0_15px_40px_-10px_rgba(212,160,23,0.35)]"
      >
        <div className={"relative overflow-hidden bg-surface-2 " + (large ? "aspect-[16/9]" : "aspect-[16/9]")}>
          <img
            src={img}
            alt={piece.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {(piece.kicker || piece.category) && (
            <span className="font-condensed absolute left-3 top-3 inline-block bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-background shadow-md">
              {piece.kicker || piece.category}
            </span>
          )}
          {piece.number && (
            <span className="font-display absolute right-3 top-3 text-2xl text-gold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {piece.number}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-lg uppercase leading-snug tracking-wider text-foreground transition-colors group-hover:text-gold md:text-xl">
            {piece.title}
          </h3>
          {(piece.excerpt || piece.description) && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {piece.excerpt || piece.description}
            </p>
          )}
          <div className="font-condensed mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2.5px] text-gold">
            Leer pieza <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </li>
  );
}

function SpecialNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">
        Especial no disponible
      </h1>
      <p className="mt-4 text-muted-foreground">
        El especial que buscas no existe o ya no está publicado.
      </p>
      <Link
        to="/especiales"
        className="font-condensed mt-6 inline-block bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background"
      >
        Ver todos los especiales
      </Link>
    </div>
  );
}
