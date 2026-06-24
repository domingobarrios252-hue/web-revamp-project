import { Link } from "@tanstack/react-router";
import { ArrowRight, Trophy, Award, Flag, Globe2 } from "lucide-react";
import type { ReactNode } from "react";
import { SectionHeading } from "./SectionHeading";

type Tile = {
  to: string;
  params?: Record<string, string>;
  kicker: string;
  title: string;
  description: string;
  icon: ReactNode;
};

const TILES: Tile[] = [
  {
    to: "/premios-mvp",
    kicker: "Reconocimiento",
    title: "Premios MVP",
    description: "Los mejores patinadores y patinadoras de la temporada según RollerZone.",
    icon: <Trophy className="h-5 w-5" />,
  },
  {
    to: "/salon-de-la-fama",
    kicker: "Memoria deportiva",
    title: "Salón de la Fama",
    description: "Las leyendas que escribieron la historia del patinaje de velocidad.",
    icon: <Award className="h-5 w-5" />,
  },
  {
    to: "/hub/$country",
    params: { country: "espana" },
    kicker: "Hub oficial",
    title: "España",
    description: "Liga nacional, clubes, federaciones y selección absoluta.",
    icon: <Flag className="h-5 w-5" />,
  },
  {
    to: "/hub/$country",
    params: { country: "colombia" },
    kicker: "Hub oficial",
    title: "Colombia",
    description: "Liga, ligas regionales y la potencia mundial del patinaje.",
    icon: <Globe2 className="h-5 w-5" />,
  },
];

export function UniverseGrid() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-12 md:px-6">
      <SectionHeading
        kicker="Universo RollerZone"
        title="Mucho más que"
        accent="noticias"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((t) => (
          <Link
            key={t.title}
            to={t.to}
            params={t.params as never}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-[0_15px_40px_-10px_rgba(212,160,23,0.35)]"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold transition-colors group-hover:bg-gold group-hover:text-background">
              {t.icon}
            </div>
            <div className="font-condensed mb-1 text-[10px] font-bold uppercase tracking-[2.5px] text-gold">
              {t.kicker}
            </div>
            <h3 className="font-display text-xl uppercase tracking-wider text-foreground md:text-2xl">
              {t.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {t.description}
            </p>
            <span className="font-condensed mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gold transition-transform group-hover:translate-x-1">
              Explorar <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
