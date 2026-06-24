import { Link } from "@tanstack/react-router";
import { ArrowRight, Flame } from "lucide-react";

/**
 * Bloque "Especial del momento" — gran cobertura editorial estilo
 * portada de medio deportivo (kicker, dossier, lista de piezas).
 */
const SPECIAL = {
  kicker: "Cobertura especial",
  dossier: "Dossier RollerZone",
  title: "Camino al Europeo 2026",
  description:
    "Reportajes, entrevistas y análisis sobre la preparación de la selección española y las grandes citas que marcan la temporada del patinaje de velocidad.",
  ctaLabel: "Ver toda la cobertura",
  ctaHref: "/noticias",
  image:
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1800&q=80",
  links: [
    { label: "Convocatoria de la selección absoluta", kicker: "Selección", href: "/noticias" },
    { label: "Análisis: los rivales europeos a batir", kicker: "Análisis", href: "/noticias" },
    { label: "Entrevista al seleccionador nacional", kicker: "Entrevista", href: "/entrevistas" },
    { label: "Calendario y sedes confirmadas", kicker: "Agenda", href: "/eventos" },
  ],
};

export function SpecialCoverageBanner() {
  return (
    <section className="relative overflow-hidden border-y border-gold/30 bg-background py-16 md:py-24">
      {/* Fondo a sangre con overlay editorial */}
      <div className="absolute inset-0">
        <img
          src={SPECIAL.image}
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
              <Flame className="h-3 w-3" /> {SPECIAL.kicker}
            </div>
            <div className="font-condensed border border-gold/50 bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-gold backdrop-blur-sm">
              {SPECIAL.dossier}
            </div>
          </div>
          <h2 className="font-display mt-5 text-4xl uppercase leading-[0.95] tracking-wider text-foreground drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] md:text-6xl lg:text-7xl">
            {SPECIAL.title}
          </h2>
          <div className="mt-5 flex items-center gap-3">
            <div className="h-[3px] w-24 bg-gold" aria-hidden="true" />
            <span className="font-condensed text-[10px] uppercase tracking-[3px] text-gold">
              {SPECIAL.links.length} piezas · actualizado
            </span>
          </div>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground/90 md:text-lg">
            {SPECIAL.description}
          </p>
          <Link
            to={SPECIAL.ctaHref}
            className="font-condensed mt-7 inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-background shadow-lg gold-glow-soft transition-all hover:bg-gold-light hover:translate-x-1"
          >
            {SPECIAL.ctaLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ol className="relative divide-y divide-border/60 overflow-hidden rounded-xl border border-border bg-surface/90 backdrop-blur shadow-2xl">
          <li className="bg-black/40 px-5 py-3">
            <span className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
              Piezas del dossier
            </span>
          </li>
          {SPECIAL.links.map((l, i) => (
            <li key={l.label}>
              <Link
                to={l.href}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2"
              >
                <span className="font-display w-6 shrink-0 text-lg text-gold/70 group-hover:text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-condensed text-[10px] font-bold uppercase tracking-[2.5px] text-gold/80">
                    {l.kicker}
                  </div>
                  <div className="font-display text-sm uppercase leading-snug tracking-wider text-foreground transition-colors group-hover:text-gold md:text-base">
                    {l.label}
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
