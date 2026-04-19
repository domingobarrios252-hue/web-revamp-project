import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, MapPin, Globe, Instagram, Facebook, ExternalLink, Trophy, ArrowLeft, Users, Navigation } from "lucide-react";
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
};

export const Route = createFileRoute("/eventos/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("events")
      .select("id, name, slug, description, start_date, end_date, location, organizer, scope, categories, cover_url, website_url, instagram_url, facebook_url, registration_url")
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

  return (
    <article className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <Link to="/eventos" className="font-condensed mb-6 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold">
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a Eventos
      </Link>

      {event.cover_url ? (
        <div className="mb-8 aspect-[16/7] overflow-hidden border border-border bg-background">
          <img src={event.cover_url} alt={event.name} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="mb-8 flex aspect-[16/7] items-center justify-center border border-border bg-background">
          <Trophy className="h-16 w-16 text-muted-foreground/30" />
        </div>
      )}

      <div className="font-condensed text-xs uppercase tracking-widest text-gold">{event.scope}</div>
      <h1 className="font-display mt-2 text-3xl leading-tight tracking-wide md:text-5xl">{event.name}</h1>

      <div className="mt-6 grid gap-3 border-y border-border py-5 md:grid-cols-2">
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
        <div className="mt-8 max-w-3xl">
          <h2 className="font-display mb-3 text-xl tracking-widest text-gold">Descripción</h2>
          <p className="whitespace-pre-line text-base leading-relaxed text-foreground/90">{event.description}</p>
        </div>
      )}

      {event.location && <EventLocationMap location={event.location} name={event.name} />}

      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-border pt-6">
        {event.website_url && <ExternalBtn href={event.website_url} icon={<Globe className="h-4 w-4" />}>Web oficial</ExternalBtn>}
        {event.instagram_url && <ExternalBtn href={event.instagram_url} icon={<Instagram className="h-4 w-4" />}>Instagram</ExternalBtn>}
        {event.facebook_url && <ExternalBtn href={event.facebook_url} icon={<Facebook className="h-4 w-4" />}>Facebook</ExternalBtn>}
        {event.registration_url && (
          <a href={event.registration_url} target="_blank" rel="noopener noreferrer" className="font-condensed ml-auto inline-flex items-center gap-2 bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark">
            Inscripción <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </article>
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
