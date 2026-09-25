import { useEffect, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  formatEventRange,
  isEventLive,
  resolveCtas,
  type LinkedEvent,
  type LivePiece,
  type LiveSpecial,
} from "@/lib/specials/liveEvent";

type State = { special: LiveSpecial; event: LinkedEvent | null; pieces: LivePiece[] } | null;

/**
 * Bloque de portada del especial con "Modo evento" activo.
 * Si no hay ningún especial en Modo evento, no renderiza nada:
 * la portada queda exactamente como siempre.
 */
export function EventModeHomeBlock() {
  const [data, setData] = useState<State>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const { data: sp } = await sb
        .from("special_editorials")
        .select("*")
        .eq("event_mode_active", true)
        .eq("status", "active")
        .maybeSingle();
      if (!sp || cancelled) return;
      const [{ data: ev }, { data: pcs }] = await Promise.all([
        sp.event_id
          ? sb.from("events").select("id,name,status,location,city,start_date,end_date").eq("id", sp.event_id).maybeSingle()
          : Promise.resolve({ data: null }),
        sb
          .from("special_pieces")
          .select("slug,kicker,category")
          .eq("special_slug", sp.slug)
          .in("status", ["published", "live"])
          .eq("visible", true)
          .order("sort_order", { ascending: true }),
      ]);
      if (!cancelled) setData({ special: sp, event: ev ?? null, pieces: pcs ?? [] });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return null;
  const { special, event, pieces } = data;
  const live = isEventLive(event);
  const ctas = resolveCtas(special, pieces);
  const dates = formatEventRange(special.start_date ?? event?.start_date, special.end_date ?? event?.end_date);
  const location = special.location?.trim() || event?.city || event?.location || "";
  const desktop = special.hero_image_url?.trim() || special.cover_url?.trim() || "";
  const mobile = special.hero_image_mobile_url?.trim() || desktop;

  return (
    <section aria-label={special.title} className="border-y border-gold/40 bg-background">
      <div className="relative isolate mx-auto max-w-7xl overflow-hidden md:my-6 md:border md:border-border">
        {desktop && (
          <picture className="absolute inset-0 -z-10">
            <source media="(min-width: 768px)" srcSet={desktop} />
            <img
              src={mobile}
              alt={special.hero_image_alt?.trim() || special.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover opacity-35"
            />
          </picture>
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/85 to-background/40" />
        <div className="absolute inset-y-0 left-0 -z-10 w-1 bg-gold" aria-hidden="true" />

        <div className="grid gap-4 px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:px-8 md:py-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {live && (
                <span className="font-condensed inline-flex items-center gap-1.5 bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2.5px] text-destructive-foreground">
                  <span className="live-dot h-1.5 w-1.5 rounded-full bg-destructive-foreground" /> En directo
                </span>
              )}
              <span className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
                Cobertura especial
              </span>
            </div>
            <h2 className="font-display mt-2 break-words text-2xl uppercase leading-tight tracking-wide text-foreground sm:text-3xl md:text-4xl">
              {special.title}
            </h2>
            {(special.subtitle || dates) && (
              <p className="font-condensed mt-1 text-[11px] font-bold uppercase tracking-[2.5px] text-gold sm:text-xs">
                {[special.subtitle, dates].filter(Boolean).join(" · ")}
              </p>
            )}
            {location && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" /> {location}
              </p>
            )}
            {!location && dates && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gold" /> {dates}
              </p>
            )}
          </div>
          {ctas.length > 0 && (
            <div className="grid grid-cols-2 gap-2 md:flex">
              {ctas.map((c, i) => (
                <a
                  key={`${c.label}-${i}`}
                  href={c.url}
                  className={
                    "font-condensed inline-flex min-h-11 items-center justify-center px-4 text-[11px] font-bold uppercase tracking-[2px] transition-colors " +
                    (i === 0
                      ? "col-span-2 bg-gold text-background hover:bg-gold-light md:col-span-1"
                      : "border border-border bg-background/70 text-foreground hover:border-gold hover:text-gold")
                  }
                >
                  {c.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
