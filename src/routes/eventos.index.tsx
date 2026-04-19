import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Globe, Instagram, Facebook, ExternalLink, Trophy, Users, Filter, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [scope, setScope] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("events")
      .select("id, name, slug, description, start_date, end_date, location, organizer, scope, categories, cover_url, website_url, instagram_url, facebook_url, registration_url")
      .eq("published", true)
      .order("start_date", { ascending: true })
      .limit(200)
      .then(({ data }) => {
        if (!cancelled) setEvents((data as EventItem[]) ?? []);
      });
    return () => { cancelled = true; };
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
        <h1 className="font-display text-3xl tracking-widest">EVENTOS</h1>
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

      {events === null ? (
        <p className="text-muted-foreground">Cargando eventos…</p>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground">Aún no hay eventos publicados.</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">Ningún evento coincide con los filtros seleccionados.</p>
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
  return (
    <article className="group flex flex-col border border-border bg-surface transition-colors hover:border-gold">
      <Link to="/eventos/$slug" params={{ slug: event.slug }} className="block">
        {event.cover_url ? (
          <div className="aspect-video overflow-hidden bg-background">
            <img src={event.cover_url} alt={event.name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-background">
            <Trophy className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="font-condensed text-[11px] uppercase tracking-widest text-gold">{event.scope}</div>
        <Link to="/eventos/$slug" params={{ slug: event.slug }}>
          <h3 className="font-display mt-1 text-lg leading-tight tracking-wide hover:text-gold">{event.name}</h3>
        </Link>

        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{formatRange(event.start_date, event.end_date)}</div>
          {event.location && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{event.location}</div>}
          {event.organizer && <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />{event.organizer}</div>}
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
            <a href={event.registration_url} target="_blank" rel="noopener noreferrer" className="font-condensed ml-auto inline-flex items-center gap-1 bg-gold px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-background hover:bg-gold-dark">
              Inscripción <ExternalLink className="h-3 w-3" />
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
