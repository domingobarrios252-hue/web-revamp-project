import { Link } from "@tanstack/react-router";
import { ArrowRight, PenLine, Globe2, Mic, Camera } from "lucide-react";

export function JoinContributorsBlock() {
  return (
    <section className="relative overflow-hidden border-y border-gold/30 bg-background py-14 md:py-20">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 opacity-[0.06]" aria-hidden="true">
        <div className="hero-grid-bg h-full w-full" />
      </div>
      <div
        className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-gold/10 to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 md:px-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div>
          <div className="font-condensed inline-flex items-center gap-2 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background">
            <PenLine className="h-3 w-3" /> Únete a la redacción
          </div>
          <h2 className="font-display mt-4 text-3xl uppercase leading-[1.05] tracking-wider text-foreground md:text-5xl">
            ¿Quieres contar el patinaje de tu ciudad,
            <span className="text-gold"> tu club o tu país</span> en RollerZone?
          </h2>
          <div className="mt-4 h-[3px] w-24 bg-gold" aria-hidden="true" />
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/85 md:text-lg">
            Buscamos redactores y corresponsales en España, Colombia y resto del mundo para cubrir la actualidad del
            patinaje de velocidad en su zona. Si te apasiona escribir, fotografiar o contar competiciones, tu sitio
            está aquí.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/redactores"
              className="font-condensed inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-background shadow-lg transition-all hover:bg-gold-light hover:translate-x-1"
            >
              Quiero colaborar <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/redactores"
              className="font-condensed inline-flex items-center gap-2 rounded-md border border-gold/60 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold transition-all hover:bg-gold/10"
            >
              Cómo funciona
            </Link>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-3">
          {[
            { Icon: PenLine, label: "Redactores", text: "Crónicas, reportajes y análisis" },
            { Icon: Mic, label: "Entrevistas", text: "Voces del patinaje internacional" },
            { Icon: Camera, label: "Fotografía", text: "Imágenes de competición" },
            { Icon: Globe2, label: "Corresponsales", text: "Cobertura local en tu país" },
          ].map(({ Icon, label, text }) => (
            <li
              key={label}
              className="flex flex-col gap-2 rounded-xl border border-border bg-surface/80 p-4 backdrop-blur transition-colors hover:border-gold"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gold/15 text-gold">
                <Icon className="h-4 w-4" />
              </div>
              <div className="font-display text-sm uppercase tracking-wider text-foreground">{label}</div>
              <div className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                {text}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
