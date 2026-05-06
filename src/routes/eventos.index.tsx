import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Globe, Instagram, Facebook, ExternalLink, Trophy, Users, Filter, X, CalendarX2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdBannerSmall } from "@/components/site/AdBannerSmall";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type EventItem = {
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

export const Route = createFileRoute("/eventos/")({
  head: () => ({
    meta: [
      { title: "Eventos — RollerZone" },
      { name: "description", content: "Calendario de eventos y competiciones de patinaje de velocidad: categorías, fechas, ubicación y enlaces oficiales." },
      { property: "og:title", content: "Eventos — RollerZone" },
      { property: "og:description", content: "Calendario de eventos y competiciones de patinaje de velocidad." },
    ],
  }),
  component: EventosPage,
});

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

function formatRange(start: string, end: string | null) {
  if (!end || end === start) return formatDate(start);
  return `${formatDate(start)} → ${formatDate(end)}`;
}

function EventosPage() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [scope, setScope] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    // Timeout 5s → mostrar vacío si no carga
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setEvents((prev) => (prev === null ? [] : prev));
      }
    }, 5000);
    supabase
      .from("events")
      .select("id, name, slug, description, start_date, end_date, location, organizer, scope, categories, cover_url, website_url, instagram_url, facebook_url, registration_url")
      .eq("published", true)
      .order("start_date", { ascending: true })
      .limit(200)
      .then(({ data }) => {
        if (!cancelled) setEvents((data as EventItem[]) ?? []);
      });
    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  const { scopes, categories } = useMemo(() => {
    const s = new Set<string>();
    const c = new Set<string>();
    (events ?? []).forEach((e) => {
      if (e.scope) s.add(e.scope);
      e.categories?.forEach((cat) => c.add(cat));
    });
    return {
      scopes: Array.from(s).sort(),
      categories: Array.from(c).sort(),
    };
  }, [events]);

  const filtered = useMemo(() => {
    return (events ?? []).filter((e) => {
      if (scope !== "all" && e.scope !== scope) return false;
      if (category !== "all" && !e.categories?.includes(category)) return false;
      if (month !== "all") {
        const m = new Date(e.start_date + "T00:00:00").getMonth();
        if (m !== Number(month)) return false;
      }
      return true;
    });
  }, [events, scope, category, month]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = filtered.filter((e) => (e.end_date ?? e.start_date) >= today);
  const past = filtered.filter((e) => (e.end_date ?? e.start_date) < today).reverse();

  const hasFilters = scope !== "all" || category !== "all" || month !== "all";
  const resetFilters = () => { setScope("all"); setCategory("all"); setMonth("all"); };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8 flex items-center gap-3 border-b border-border pb-4">
        <Calendar className="h-7 w-7 text-gold" />
        <h1 className="font-display text-3xl tracking-widest">{t("events.title").toUpperCase()}</h1>
      </div>

      {events !== null && events.length > 0 && (
        <div className="mb-8 border border-border bg-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-gold" />
            <span className="font-condensed text-xs uppercase tracking-widest text-gold">Filtros</span>
            {hasFilters && (
              <button
                onClick={resetFilters}
                className="font-condensed ml-auto inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-gold"
              >
                <X className="h-3 w-3" /> Limpiar
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <FilterSelect label="Ámbito" value={scope} onChange={setScope}>
              <option value="all">Todos</option>
              {scopes.map((s) => <option key={s} value={s}>{s}</option>)}
            </FilterSelect>
            <FilterSelect label="Categoría" value={category} onChange={setCategory}>
              <option value="all">Todas</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </FilterSelect>
            <FilterSelect label="Mes" value={month} onChange={setMonth}>
              <option value="all">Todos</option>
              {MONTHS.map((m, i) => <option key={m} value={String(i)}>{m}</option>)}
            </FilterSelect>
          </div>
        </div>
      )}

      <div className="mb-8">
        <AdBannerSmall placement="eventos_side" />
      </div>

      {events === null ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border border-border bg-surface">
              <div className="aspect-[1/1.414] animate-pulse bg-surface-2" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-20 animate-pulse bg-surface-2" />
                <div className="h-5 w-3/4 animate-pulse bg-surface-2" />
                <div className="h-3 w-1/2 animate-pulse bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyEvents
          title="Aún no hay eventos publicados"
          message="Estamos preparando el calendario. Vuelve pronto para descubrir nuevas competiciones."
        />
      ) : filtered.length === 0 ? (
        <EmptyEvents
          title="Ningún evento coincide"
          message="Prueba a limpiar los filtros para ver todos los eventos disponibles."
          action={
            <button
              onClick={resetFilters}
              className="font-condensed mt-6 inline-flex items-center gap-2 border border-gold px-4 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold hover:text-background"
            >
              <X className="h-4 w-4" /> Limpiar filtros
            </button>
          }
        />
      ) : (
        <>
          <Section title="Próximos eventos" items={upcoming} empty="No hay eventos programados próximamente." />
          {past.length > 0 && (
            <div className="mt-12">
              <Section title="Eventos pasados" items={past} dim />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyEvents({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-border bg-surface px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-background">
        <CalendarX2 className="h-7 w-7 text-gold" aria-hidden="true" />
      </div>
      <h2 className="font-display text-2xl tracking-widest text-foreground">{title}</h2>
      <p className="font-condensed mt-2 max-w-md text-sm uppercase tracking-wider text-muted-foreground">
        {message}
      </p>
      {action}
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none"
      >
        {children}
      </select>
    </label>
  );
}

function Section({ title, items, empty, dim }: { title: string; items: EventItem[]; empty?: string; dim?: boolean }) {
  return (
    <div>
      <h2 className="font-display mb-4 text-xl tracking-widest text-gold">{title}</h2>
      {items.length === 0 && empty ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${dim ? "opacity-80" : ""}`}>
          {items.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const start = new Date(event.start_date + "T00:00:00");
  const day = start.toLocaleDateString("es-ES", { day: "2-digit" });
  const month = start.toLocaleDateString("es-ES", { month: "short" }).replace(".", "");
  const year = start.getFullYear();

  return (
    <article className="group relative flex flex-col overflow-hidden border border-border bg-surface pl-1 transition-colors hover:border-gold">
      {/* Barra lateral dorada */}
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gold" />

      <Link
        to="/eventos/$slug"
        params={{ slug: event.slug }}
        className="relative block"
        aria-label={`Ver detalle del evento ${event.name}`}
      >
        {event.cover_url ? (
          <div className="relative aspect-[1/1.414] overflow-hidden bg-background">
            <img
              src={event.cover_url}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-xl"
            />
            <img
              src={event.cover_url}
              alt={`Cartel de ${event.name}`}
              loading="lazy"
              className="relative h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div className="flex aspect-[1/1.414] items-center justify-center bg-background">
            <Trophy className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
          </div>
        )}

        {/* Fecha destacada */}
        <div className="absolute left-3 top-3 flex flex-col items-center border border-gold/40 bg-background/90 px-2 py-1 text-center backdrop-blur-sm">
          <span className="font-display text-2xl leading-none tracking-wider text-gold">{day}</span>
          <span className="font-condensed text-[9px] uppercase tracking-widest text-foreground">{month}</span>
          <span className="font-condensed text-[9px] uppercase tracking-widest text-muted-foreground">{year}</span>
        </div>

        {/* Badge tipo evento dorado suave */}
        {event.scope && (
          <span className="font-condensed absolute right-3 top-3 border border-gold/40 bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold backdrop-blur-sm">
            {event.scope}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link to="/eventos/$slug" params={{ slug: event.slug }}>
          <h3 className="font-display text-lg leading-tight tracking-wide text-foreground hover:text-gold">
            {event.name}
          </h3>
        </Link>

        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" aria-hidden="true" />{formatRange(event.start_date, event.end_date)}</div>
          {event.location && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{event.location}</div>}
          {event.organizer && <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" aria-hidden="true" />{event.organizer}</div>}
        </div>

        {event.categories?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {event.categories.map((c) => (
              <span key={c} className="font-condensed border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground/80">
                {c}
              </span>
            ))}
          </div>
        )}

        {event.description && <p className="mt-3 line-clamp-3 text-sm text-foreground/80">{event.description}</p>}

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
          <Link to="/eventos/$slug" params={{ slug: event.slug }} className="font-condensed inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-gold hover:text-gold-dark">
            Ver detalle →
          </Link>
          {event.website_url && <ExternalLinkBtn href={event.website_url} icon={<Globe className="h-3.5 w-3.5" />}>Web</ExternalLinkBtn>}
          {event.instagram_url && <ExternalLinkBtn href={event.instagram_url} icon={<Instagram className="h-3.5 w-3.5" />}>Instagram</ExternalLinkBtn>}
          {event.facebook_url && <ExternalLinkBtn href={event.facebook_url} icon={<Facebook className="h-3.5 w-3.5" />}>Facebook</ExternalLinkBtn>}
          {event.registration_url && (
            <a href={event.registration_url} target="_blank" rel="noopener noreferrer" aria-label="Inscripción al evento" className="font-condensed ml-auto inline-flex items-center gap-1 bg-gold px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-background hover:bg-gold-dark">
              Inscripción <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function ExternalLinkBtn({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-condensed inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-gold">
      {icon} {children}
    </a>
  );
}
