import { Link } from "@tanstack/react-router";
import { ArrowRight, Flame } from "lucide-react";

/**
 * Bloque "Especial del momento" — gran cobertura editorial.
 * Configurable por código en esta fase MVP.
 */
const SPECIAL = {
  kicker: "Cobertura especial",
  title: "Camino al Europeo 2026",
  description:
    "Reportajes, entrevistas y análisis sobre la preparación de la selección española y las grandes citas que marcan la temporada del patinaje de velocidad.",
  ctaLabel: "Ver cobertura completa",
  ctaHref: "/noticias",
  image:
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80",
  links: [
    { label: "Convocatoria de la selección absoluta", href: "/noticias" },
    { label: "Análisis: los rivales europeos a batir", href: "/noticias" },
    { label: "Entrevista al seleccionador nacional", href: "/entrevistas" },
    { label: "Calendario y sedes confirmadas", href: "/eventos" },
  ],
};

export function SpecialCoverageBanner() {
  return (
    <section className="relative border-y border-border bg-background py-12 md:py-16">
      {/* Fondo a sangre con imagen + overlay editorial */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={SPECIAL.image}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-8 px-5 md:px-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <div className="font-condensed inline-flex items-center gap-2 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background">
            <Flame className="h-3 w-3" /> {SPECIAL.kicker}
          </div>
          <h2 className="font-display mt-4 text-3xl uppercase leading-[1.05] tracking-wider text-foreground md:text-5xl lg:text-6xl">
            {SPECIAL.title}
          </h2>
          <div className="mt-4 h-[3px] w-24 bg-gold" aria-hidden="true" />
          <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground/85">
            {SPECIAL.description}
          </p>
          <Link
            to={SPECIAL.ctaHref}
            className="font-condensed mt-6 inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-background shadow-lg transition-all hover:bg-gold-light hover:translate-x-1"
          >
            {SPECIAL.ctaLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ul className="divide-y divide-border/60 rounded-xl border border-border bg-surface/80 backdrop-blur">
          {SPECIAL.links.map((l) => (
            <li key={l.label}>
              <Link
                to={l.href}
                className="group flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-2"
              >
                <span className="font-condensed text-sm uppercase tracking-wider text-foreground transition-colors group-hover:text-gold">
                  {l.label}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-gold transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
