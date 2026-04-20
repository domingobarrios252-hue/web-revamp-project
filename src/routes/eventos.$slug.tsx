import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, MapPin, Globe, Instagram, Facebook, ExternalLink, Trophy, ArrowLeft, Users, Navigation, X, ZoomIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type EventDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  organizer: string | null;
  scope: string;
  categories: string[];
  cover_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  registration_url: string | null;
  gallery: string[];
};

export const Route = createFileRoute("/eventos/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("events")
      .select("id, name, slug, description, start_date, end_date, location, organizer, scope, categories, cover_url, website_url, instagram_url, facebook_url, registration_url, gallery")
      .eq("slug", params.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { event: data as EventDetail };
  },
  head: ({ loaderData }) => {
    const e = loaderData?.event;
    if (!e) return { meta: [{ title: "Evento — RollerZone" }] };
    const desc = e.description?.slice(0, 160) ?? `${e.name} — ${e.location ?? ""}`;
    return {
      meta: [
        { title: `${e.name} — Eventos RollerZone` },
        { name: "description", content: desc },
        { property: "og:title", content: e.name },
        { property: "og:description", content: desc },
        ...(e.cover_url ? [{ property: "og:image", content: e.cover_url }, { name: "twitter:image", content: e.cover_url }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl tracking-widest">Evento no encontrado</h1>
      <p className="mt-3 text-muted-foreground">El evento que buscas no existe o no está publicado.</p>
      <Link to="/eventos" className="font-condensed mt-6 inline-block bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark">
        Volver a Eventos
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="text-destructive">Error: {error.message}</p>
      <Link to="/eventos" className="font-condensed mt-6 inline-block border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest">
        Volver a Eventos
      </Link>
    </div>
  ),
  component: EventoDetail,
});

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

function formatRange(start: string, end: string | null) {
  if (!end || end === start) return formatDate(start);
  return `${formatDate(start)} → ${formatDate(end)}`;
}

function EventoDetail() {
  const { event } = Route.useLoaderData();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <article className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <Link to="/eventos" className="font-condensed mb-6 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold">
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a Eventos
      </Link>

      {/* Split: cartel A4 izquierda + info derecha */}
      <div className="grid gap-8 md:grid-cols-[minmax(0,360px)_1fr] lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-12">
        <div className="md:sticky md:top-24 md:self-start">
          {event.cover_url ? (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={`Ampliar cartel de ${event.name}`}
              className="group relative block aspect-[1/1.414] w-full overflow-hidden border border-border bg-background shadow-2xl transition hover:border-gold focus:border-gold focus:outline-none"
            >
              <img
                src={event.cover_url}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl"
              />
              <img
                src={event.cover_url}
                alt={`Cartel de ${event.name}`}
                className="relative h-full w-full object-contain"
              />
              <span className="font-condensed absolute left-3 top-3 bg-background/85 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gold backdrop-blur-sm">
                Cartel oficial
              </span>
              <span className="font-condensed absolute bottom-3 right-3 inline-flex items-center gap-1 bg-background/85 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground/90 opacity-0 backdrop-blur-sm transition group-hover:opacity-100 group-focus:opacity-100">
                <ZoomIn className="h-3 w-3" /> Ampliar
              </span>
            </button>
          ) : (
            <div className="flex aspect-[1/1.414] items-center justify-center border border-border bg-background">
              <Trophy className="h-20 w-20 text-muted-foreground/30" />
            </div>
          )}
          {event.registration_url && (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-condensed mt-4 flex w-full items-center justify-center gap-2 bg-gold px-5 py-3 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
            >
              Inscripción <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <div className="min-w-0">
          <div className="font-condensed text-xs uppercase tracking-widest text-gold">{event.scope}</div>
          <h1 className="font-display mt-2 text-3xl leading-tight tracking-wide md:text-4xl lg:text-5xl">{event.name}</h1>

          <div className="mt-6 grid gap-3 border-y border-border py-5 sm:grid-cols-2">
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Fecha">{formatRange(event.start_date, event.end_date)}</InfoRow>
            {event.location && <InfoRow icon={<MapPin className="h-4 w-4" />} label="Ubicación">{event.location}</InfoRow>}
            {event.organizer && <InfoRow icon={<Users className="h-4 w-4" />} label="Organizador">{event.organizer}</InfoRow>}
            {event.categories?.length > 0 && (
              <InfoRow icon={<Trophy className="h-4 w-4" />} label="Categorías">
                <div className="flex flex-wrap gap-1.5">
                  {event.categories.map((c: string) => (
                    <span key={c} className="font-condensed border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground/80">{c}</span>
                  ))}
                </div>
              </InfoRow>
            )}
          </div>

          {event.description && (
            <div className="mt-8">
              <h2 className="font-display mb-3 text-xl tracking-widest text-gold">Descripción</h2>
              <p className="whitespace-pre-line text-base leading-relaxed text-foreground/90">{event.description}</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
            {event.website_url && <ExternalBtn href={event.website_url} icon={<Globe className="h-4 w-4" />}>Web oficial</ExternalBtn>}
            {event.instagram_url && <ExternalBtn href={event.instagram_url} icon={<Instagram className="h-4 w-4" />}>Instagram</ExternalBtn>}
            {event.facebook_url && <ExternalBtn href={event.facebook_url} icon={<Facebook className="h-4 w-4" />}>Facebook</ExternalBtn>}
          </div>
        </div>
      </div>

      {event.gallery?.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display mb-4 text-xl tracking-widest text-gold">Galería</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {event.gallery.map((url: string, i: number) => (
              <a key={url + i} href={url} target="_blank" rel="noopener noreferrer" className="group block aspect-square overflow-hidden border border-border bg-background">
                <img src={url} alt={`${event.name} — foto ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              </a>
            ))}
          </div>
        </div>
      )}

      {event.location && <EventLocationMap location={event.location} name={event.name} />}

      {lightboxOpen && event.cover_url && (
        <PosterLightbox
          src={event.cover_url}
          alt={`Cartel de ${event.name}`}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </article>
  );
}

function PosterLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm md:p-8"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="font-condensed absolute right-4 top-4 inline-flex items-center gap-1.5 border border-border bg-background/80 px-3 py-2 text-xs uppercase tracking-widest text-foreground hover:border-gold hover:text-gold md:right-6 md:top-6"
      >
        <X className="h-4 w-4" /> Cerrar
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] max-w-full object-contain shadow-2xl"
      />
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-gold">{icon}</div>
      <div>
        <div className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-sm text-foreground/90">{children}</div>
      </div>
    </div>
  );
}

function ExternalBtn({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-condensed inline-flex items-center gap-1.5 border border-border px-3 py-2 text-xs uppercase tracking-widest text-foreground/80 hover:border-gold hover:text-gold">
      {icon} {children}
    </a>
  );
}

function EventLocationMap({ location, name }: { location: string; name: string }) {
  const query = encodeURIComponent(location);
  // OpenStreetMap embed centered by search query (no API key needed)
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=-15,35,10,55&layer=mapnik&marker=`;
  // Use search-based embed via Nominatim-friendly query iframe
  const mapSrc = `https://maps.google.com/maps?q=${query}&hl=es&z=14&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  const viewUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  void osmUrl;

  return (
    <div className="mt-10 max-w-3xl">
      <h2 className="font-display mb-3 flex items-center gap-2 text-xl tracking-widest text-gold">
        <MapPin className="h-5 w-5" /> Ubicación
      </h2>
      <p className="mb-3 text-sm text-foreground/80">{location}</p>
      <div className="aspect-video overflow-hidden border border-border bg-background">
        <iframe
          title={`Mapa de ${name}`}
          src={mapSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Navigation className="h-3.5 w-3.5" /> Cómo llegar
        </a>
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-condensed inline-flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-widest text-foreground/80 hover:border-gold hover:text-gold"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Ver en Google Maps
        </a>
      </div>
    </div>
  );
}
