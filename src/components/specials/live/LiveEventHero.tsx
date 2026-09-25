import { MapPin, CalendarDays } from "lucide-react";
import {
  formatEventRange,
  type LiveSpecial,
  type SpecialCta,
} from "@/lib/specials/liveEvent";

/**
 * Hero compacto de gran cobertura. Imagen desktop / móvil independientes
 * gestionadas desde el panel (sin imágenes generadas ni fijas en código).
 */
export function LiveEventHero({
  special,
  ctas,
  live,
  location,
}: {
  special: LiveSpecial;
  ctas: SpecialCta[];
  live: boolean;
  location: string;
}) {
  const desktop = special.hero_image_url?.trim() || special.cover_url?.trim() || "";
  const mobile = special.hero_image_mobile_url?.trim() || desktop;
  const dates = formatEventRange(special.start_date, special.end_date);
  const alt = special.hero_image_alt?.trim() || special.title;
  const altMobile = special.hero_image_mobile_alt?.trim() || alt;

  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-background">
      {desktop && (
        <picture className="absolute inset-0 -z-10">
          <source media="(min-width: 768px)" srcSet={desktop} />
          <img
            src={mobile}
            alt={mobile === desktop ? alt : altMobile}
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover opacity-45"
          />
        </picture>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/80 to-background/20" />
      <div className="absolute inset-y-0 left-0 -z-10 w-1 bg-gold md:w-1.5" aria-hidden="true" />

      <div className="mx-auto flex min-h-[300px] max-w-7xl flex-col justify-end px-4 pb-6 pt-10 sm:min-h-[340px] md:min-h-[400px] md:px-6 md:pb-10">
        <div className="flex flex-wrap items-center gap-2">
          {live && (
            <span className="font-condensed inline-flex items-center gap-1.5 bg-destructive px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-destructive-foreground">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-destructive-foreground" /> En directo
            </span>
          )}
          <span className="font-condensed border border-gold/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-gold">
            Cobertura especial Rollerzone
          </span>
        </div>

        <h1 className="font-display mt-3 max-w-4xl break-words text-[1.9rem] uppercase leading-[1.02] tracking-wide text-foreground sm:text-4xl md:text-6xl">
          {special.title}
        </h1>
        {special.subtitle && (
          <p className="font-condensed mt-2 text-xs font-bold uppercase tracking-[3px] text-gold sm:text-sm">
            {special.subtitle}
          </p>
        )}

        {(dates || location) && (
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground sm:text-sm">
            {dates && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gold" /> {dates}
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" /> {location}
              </span>
            )}
          </div>
        )}

        {ctas.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {ctas.map((c, i) => (
              <a
                key={`${c.label}-${i}`}
                href={c.url}
                className={
                  "font-condensed inline-flex min-h-11 items-center justify-center px-4 text-[11px] font-bold uppercase tracking-[2px] transition-colors " +
                  (i === 0
                    ? "col-span-2 bg-gold text-background hover:bg-gold-light sm:col-span-1"
                    : "border border-border bg-background/60 text-foreground hover:border-gold hover:text-gold")
                }
              >
                {c.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
