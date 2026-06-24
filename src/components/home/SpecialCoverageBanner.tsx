import { Link } from "@tanstack/react-router";
import { ArrowRight, Flame } from "lucide-react";
import {
  EVENT,
  PIECES,
  SPECIAL_BASE_PATH,
  piecePath,
} from "@/lib/specials/europeo-2026";

/**
 * Bloque "Especial del momento" en la home.
 * Enlaza a la landing del especial y a cada subpágina del dossier.
 */
export function SpecialCoverageBanner() {
  return (
    <section className="relative overflow-hidden border-y border-gold/30 bg-background py-16 md:py-24">
      <div className="absolute inset-0">
        <img
          src={EVENT.heroImage}
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-[1.03] object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/70" />
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 md:px-6 lg:grid-cols-[1.35fr_1fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-condensed inline-flex items-center gap-2 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background shadow-lg">
              <Flame className="h-3 w-3" /> Cobertura especial
            </div>
            <div className="font-condensed border border-gold/50 bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-gold backdrop-blur-sm">
              Dossier RollerZone
            </div>
          </div>
          <h2 className="font-display mt-5 text-4xl uppercase leading-[0.95] tracking-wider text-foreground drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] md:text-6xl lg:text-7xl">
            Camino al Europeo 2026
          </h2>
          <div className="mt-5 flex items-center gap-3">
            <div className="h-[3px] w-24 bg-gold" aria-hidden="true" />
            <span className="font-condensed text-[10px] uppercase tracking-[3px] text-gold">
              {EVENT.datesLabel} · {EVENT.venue}
            </span>
          </div>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground/90 md:text-lg">
            Reportajes, convocatoria de España, calendario, sedes, entrevistas
            y toda la actualidad de la selección española en el Europeo de
            Cardano al Campo 2026.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to={SPECIAL_BASE_PATH}
              className="font-condensed inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-background shadow-lg gold-glow-soft transition-all hover:bg-gold-light hover:translate-x-1"
            >
              Ver toda la cobertura <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to={piecePath("convocatoria-seleccion-espanola")}
              className="font-condensed inline-flex items-center gap-2 rounded-md border border-gold/60 bg-black/30 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold backdrop-blur-sm transition-all hover:bg-black/50"
            >
              Ver convocatoria de España <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <ol className="relative divide-y divide-border/60 overflow-hidden rounded-xl border border-border bg-surface/90 backdrop-blur shadow-2xl">
          <li className="bg-black/40 px-5 py-3">
            <span className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
              Piezas del dossier
            </span>
          </li>
          {PIECES.map((p) => (
            <li key={p.slug}>
              <Link
                to={piecePath(p.slug)}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2"
              >
                <span className="font-display w-6 shrink-0 text-lg text-gold/70 group-hover:text-gold">
                  {p.number}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-condensed text-[10px] font-bold uppercase tracking-[2.5px] text-gold/80">
                    {p.kicker}
                  </div>
                  <div className="font-display text-sm uppercase leading-snug tracking-wider text-foreground transition-colors group-hover:text-gold md:text-base">
                    {p.title}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-gold transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
