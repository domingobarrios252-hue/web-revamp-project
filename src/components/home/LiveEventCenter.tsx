import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, MapPin, Radio, Trophy, Play, Clock } from "lucide-react";
import { useFeaturedLiveEvent, type EventTest, type EventResult } from "@/lib/home/useFeaturedLiveEvent";

export function LiveEventCenter() {
  const { event, tests, results, loading } = useFeaturedLiveEvent();

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-10 md:px-6 md:py-14">
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
      </section>
    );
  }

  if (!event) return null;

  const isLiveNow = tests.some((t) => t.status === "live") || event.status === "live";
  const dateLabel = new Date(event.start_date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const place = [event.venue, event.city ?? event.location].filter(Boolean).join(" · ");

  return (
    <section className="relative mx-auto max-w-7xl px-5 py-10 md:px-6 md:py-14">
      {/* Header bar */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-3">
            {isLiveNow ? (
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> En directo
              </span>
            ) : (
              <Radio className="h-5 w-5 text-gold" />
            )}
            <h2 className="font-display text-2xl uppercase tracking-widest md:text-3xl">
              Live Event Center
            </h2>
          </div>
          <div className="mt-2 h-[3px] w-20 bg-gold" aria-hidden="true" />
        </div>
        <Link
          to="/eventos/$slug"
          params={{ slug: event.slug }}
          className="font-condensed group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold transition-all hover:text-gold-light hover:drop-shadow-[0_0_8px_rgba(212,160,23,0.6)]"
        >
          Ver ficha del evento{" "}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Hero strip */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2/40 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
        {event.banner_url || event.cover_url ? (
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(${event.banner_url ?? event.cover_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/30" />
        <div className="relative grid gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:items-center md:p-8">
          {event.logo_url ? (
            <img
              src={event.logo_url}
              alt={event.name}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="h-20 w-20 rounded-xl border border-gold/40 bg-black/40 object-contain p-2 md:h-24 md:w-24"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-gold/40 bg-black/40 md:h-24 md:w-24">
              <Trophy className="h-10 w-10 text-gold" />
            </div>
          )}
          <div className="min-w-0">
            {event.event_type && (
              <div className="font-condensed text-[11px] font-bold uppercase tracking-[2.5px] text-gold">
                {event.event_type}
                {event.season ? ` · ${event.season}` : ""}
              </div>
            )}
            <h3 className="font-display mt-1 text-2xl uppercase leading-tight tracking-wide text-foreground md:text-4xl">
              {event.name}
            </h3>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gold" /> {dateLabel}
              </span>
              {place && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-gold" /> {place}
                </span>
              )}
            </div>
          </div>
          {event.streaming_url && (
            <a
              href={event.streaming_url}
              target="_blank"
              rel="noreferrer"
              className="font-condensed inline-flex items-center gap-2 self-start rounded-sm border border-gold bg-gold px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-black transition-all hover:bg-gold-light"
            >
              <Play className="h-4 w-4" /> Ver streaming
            </a>
          )}
        </div>
      </div>

      {/* Tests grid */}
      {tests.length > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tests.map((t) => (
            <TestCard key={t.id} test={t} top={(results[t.id] ?? []).slice(0, 3)} eventSlug={event.slug} />
          ))}
        </div>
      )}

      {tests.length === 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          Las pruebas se publicarán próximamente.
        </div>
      )}
    </section>
  );
}

function TestCard({
  test,
  top,
  eventSlug,
}: {
  test: EventTest;
  top: EventResult[];
  eventSlug: string;
}) {
  const time = new Date(test.scheduled_time).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateShort = new Date(test.scheduled_time).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-gradient-to-b from-surface to-surface-2/40 shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-[0_8px_32px_rgba(212,160,23,0.25)]">
      <header className="flex items-start justify-between gap-2 border-b border-border bg-black/30 px-4 py-3">
        <div className="min-w-0">
          <div className="font-condensed text-[10px] font-bold uppercase tracking-[2.5px] text-gold">
            {[test.category, test.gender].filter(Boolean).join(" · ") || "Prueba"}
          </div>
          <h4 className="font-display mt-1 text-base uppercase leading-tight tracking-wide text-foreground">
            {test.race_name}
          </h4>
        </div>
        <StatusBadge status={test.status} />
      </header>

      <div className="flex items-center gap-3 border-b border-border bg-black/20 px-4 py-2 text-[11px] text-muted-foreground">
        <Clock className="h-3.5 w-3.5 text-gold" />
        <span className="font-condensed uppercase tracking-widest">
          {dateShort} · {time}
        </span>
      </div>

      <div className="flex-1 px-2 py-3">
        {top.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-muted-foreground">
            {test.status === "finished" ? "Sin resultados publicados" : "Aún sin datos"}
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {top.map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-[28px_1fr_auto] items-center gap-2 px-2 py-2"
              >
                <span
                  className={
                    "font-display text-sm font-black " +
                    (r.position <= 3 ? "text-gold" : "text-muted-foreground")
                  }
                >
                  {r.position}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-foreground">
                    {r.athlete_name}
                  </span>
                  {(r.club || r.country) && (
                    <span className="font-condensed block truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                      {[r.club, r.country].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </span>
                {r.time && (
                  <span className="font-mono text-right text-xs text-gold">{r.time}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        to="/eventos/$slug"
        params={{ slug: eventSlug }}
        className="font-condensed inline-flex items-center justify-between border-t border-border bg-black/20 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gold transition-transform group-hover:translate-x-1"
      >
        Ver resultados <ArrowRight className="h-3 w-3" />
      </Link>
    </article>
  );
}

function StatusBadge({ status }: { status: EventTest["status"] }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
      </span>
    );
  }
  if (status === "finished") {
    return (
      <span className="inline-flex items-center rounded-sm border border-gold/40 bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold">
        Final
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-sm border border-border bg-black/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      Próx.
    </span>
  );
}
