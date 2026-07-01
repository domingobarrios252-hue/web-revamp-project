import { Link } from "@tanstack/react-router";
import { Radio, MapPin, Calendar, ExternalLink, Clock } from "lucide-react";
import { useActiveLiveEvent, useLiveTimeline, useLiveResults } from "@/lib/hub/useLive";
import { videoEmbedUrl } from "@/lib/videoEmbed";
import { LiveResultsTable } from "@/components/site/LiveResultsTable";

export function LiveCenterPage({ country }: { country: string }) {
  const { event, loading } = useActiveLiveEvent(country);
  const timeline = useLiveTimeline(event?.id);
  const results = useLiveResults(event?.slug);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-12">
        <p className="text-sm text-[#888]">Cargando Live Center…</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-16 text-center">
        <Radio className="mx-auto h-10 w-10 text-[#D4A017] mb-3" />
        <h1 className="font-display text-4xl font-black text-[#F5F5F5]">Live Center</h1>
        <p className="mt-3 text-sm text-[#B5B5B5]">
          No hay ningún evento en directo ahora mismo en {country.toUpperCase()}.
        </p>
        <Link
          to="/hub/$country"
          params={{ country }}
          className="font-ui mt-6 inline-block border border-[#D4A017] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-[#D4A017] hover:bg-[#D4A017] hover:text-[#1A1A1A]"
        >
          Volver al hub
        </Link>
      </div>
    );
  }

  const embed = event.cover_url ? videoEmbedUrl(event.cover_url) : null;
  const totalResults = results.length;

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12 space-y-10">
      <header className="space-y-3">
        <div className="font-ui inline-flex items-center gap-2 bg-red-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          En directo · {country.toUpperCase()}
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-black text-[#F5F5F5]">{event.name}</h1>
        <div className="flex flex-wrap gap-4 text-xs text-[#B5B5B5]">
          {event.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#D4A017]" /> {event.location}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#D4A017]" />
            {new Date(event.start_date).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
          </span>
        </div>
        {event.description && (
          <p className="max-w-3xl text-sm text-[#B5B5B5]">{event.description}</p>
        )}
        <Link
          to="/eventos/$slug"
          params={{ slug: event.slug }}
          className="font-ui inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[#D4A017] hover:underline"
        >
          Ficha del evento <ExternalLink className="h-3 w-3" />
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Streaming */}
        <section className="space-y-3">
          <h2 className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">
            Retransmisión
          </h2>
          <div className="relative aspect-video overflow-hidden rounded-[8px] border border-[#2A2A2A] bg-black">
            {embed ? (
              <iframe
                src={embed}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={event.name}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-sm text-[#888]">
                Sin retransmisión activa
              </div>
            )}
          </div>
        </section>

        {/* Timeline */}
        <section className="space-y-3">
          <h2 className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">
            Timeline en vivo
          </h2>
          <div className="border border-[#2A2A2A] bg-[#161616] rounded-[8px] max-h-[480px] overflow-y-auto">
            {timeline.length === 0 ? (
              <p className="p-6 text-center text-xs text-[#888]">
                Aún no hay actualizaciones. Sigue refrescando.
              </p>
            ) : (
              <ul className="divide-y divide-[#222]">
                {timeline.map((t) => (
                  <li key={t.id} className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-3 w-3 text-[#D4A017]" />
                      <span className="font-ui text-[10px] uppercase tracking-widest text-[#888]">
                        {new Date(t.occurred_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="font-ui text-[10px] uppercase tracking-widest text-[#D4A017]">
                        {t.entry_type}
                      </span>
                    </div>
                    <p className="text-sm text-[#E5E5E5]">{t.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Resultados */}
      {totalResults > 0 && (
        <section className="space-y-3">
          <h2 className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">
            Resultados en vivo
          </h2>
          <LiveResultsTable />
        </section>
      )}
    </div>
  );
}
