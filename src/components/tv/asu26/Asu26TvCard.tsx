import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";

/** Tarjeta destacada en Rollerzone TV hacia el broadcast hub ASU26. */
export function Asu26TvCard() {
  return (
    <section aria-label="World Skate Games ASU26" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <Link
          to="/rollerzone-tv/world-skate-games-asu26"
          className="asu-hero-bg group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-asu/50 p-5 transition-all duration-300 hover:border-gold md:flex-row md:items-center md:justify-between md:p-7"
        >
          <div className="asu-curve pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative min-w-0">
            <span className="font-condensed inline-flex items-center gap-1.5 rounded-full border border-gold/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[2px] text-gold">
              <ShieldCheck className="h-3 w-3" /> Streaming autorizado
            </span>
            <p className="font-display mt-3 text-3xl uppercase leading-none tracking-wide text-foreground md:text-4xl">World Skate Games ASU26</p>
            <p className="font-condensed mt-1 text-xs font-bold uppercase tracking-[3px] text-asu-light">Patinaje de velocidad · 10–18 octubre</p>
          </div>
          <span className="font-condensed relative inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-gold px-5 text-xs font-bold uppercase tracking-widest text-background transition-colors group-hover:bg-gold-light">
            Ver en directo <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </section>
  );
}
