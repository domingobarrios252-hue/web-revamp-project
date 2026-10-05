import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, MapPin, ShieldCheck } from "lucide-react";

/** Hero promocional temporal de Rollerzone TV hacia el broadcast hub ASU26. */
export function Asu26TvHero({ logoUrl }: { logoUrl?: string }) {
  return (
    <section aria-label="World Skate Games ASU26" className="bg-background">
      <Link
        to="/rollerzone-tv/world-skate-games-asu26"
        className="asu-hero-bg group relative isolate block overflow-hidden border-b border-asu/40"
      >
        <div className="asu-curve pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <div className="absolute inset-y-0 left-0 w-1 bg-gold md:w-1.5" aria-hidden="true" />
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-8 md:py-16">
          <div className="asu-reveal min-w-0 max-w-3xl">
            <span className="font-condensed inline-flex items-center gap-1.5 rounded-full border border-gold/70 bg-background/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[2px] text-gold">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Streaming oficial autorizado por World Skate
            </span>
            {logoUrl && <img src={logoUrl} alt="" className="mt-5 h-14 w-auto max-w-[220px] object-contain md:h-16" />}
            <h2 className="font-display mt-4 break-words text-4xl uppercase leading-[0.95] tracking-wide text-foreground sm:text-5xl md:text-7xl">
              World Skate Games <span className="text-gold">ASU26 2026</span>
            </h2>
            <p className="font-display mt-2 text-xl uppercase tracking-wider text-foreground/90 md:text-3xl">Patinaje de velocidad</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-foreground/80">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-gold" /> 10–18 octubre 2026</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gold" /> Asunción · Paraguay</span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/80 md:text-base">
              Sigue todas las pruebas de patinaje de velocidad de los World Skate Games ASU26 en nuestro centro especial de
              retransmisión, con streaming oficial, horarios, próximas carreras y resultados oficiales.
            </p>
          </div>
          <span className="font-condensed inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-gold px-6 text-xs font-bold uppercase tracking-widest text-background transition-colors group-hover:bg-gold-light md:text-sm">
            Ver streaming en directo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </section>
  );
}
