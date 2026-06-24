import { PenLine, Globe2, Mic, Camera } from "lucide-react";
import { ContributorSignupForm } from "./ContributorSignupForm";

export function JoinContributorsBlock() {
  return (
    <section
      id="colaborar"
      className="relative overflow-hidden border-y border-gold/30 bg-background py-16 md:py-24"
    >
      {/* Fondo editorial */}
      <div className="absolute inset-0 opacity-[0.07]" aria-hidden="true">
        <div className="hero-grid-bg h-full w-full" />
      </div>
      <div
        className="absolute -left-32 top-1/2 h-[480px] w-[480px] -translate-y-1/2 rounded-full bg-gold/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-tv-red/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 md:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div>
          <div className="font-condensed inline-flex items-center gap-2 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background">
            <PenLine className="h-3 w-3" /> Red de redactores RollerZone
          </div>
          <h2 className="font-display mt-4 text-3xl uppercase leading-[1] tracking-wider text-foreground md:text-5xl lg:text-6xl">
            Cuenta el patinaje de
            <span className="text-gold"> tu ciudad, tu club</span> o tu país.
          </h2>
          <div className="mt-4 h-[3px] w-24 bg-gold" aria-hidden="true" />
          <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground/85 md:text-lg">
            RollerZone está construyendo una red internacional de redactores, corresponsales y
            fotógrafos para cubrir el patinaje de velocidad allí donde ocurre. Si te apasiona el
            deporte y quieres firmar en el medio de referencia, este es tu sitio.
          </p>

          <ul className="mt-7 grid grid-cols-2 gap-3 sm:max-w-md">
            {[
              { Icon: PenLine, label: "Redactores", text: "Crónicas y análisis" },
              { Icon: Mic, label: "Entrevistas", text: "Voces del patinaje" },
              { Icon: Camera, label: "Fotografía", text: "Imágenes de carrera" },
              { Icon: Globe2, label: "Corresponsales", text: "Cobertura local" },
            ].map(({ Icon, label, text }) => (
              <li
                key={label}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface/70 p-3 backdrop-blur"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gold/15 text-gold">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-sm uppercase tracking-wider text-foreground">
                    {label}
                  </div>
                  <div className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                    {text}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <ContributorSignupForm />
      </div>
    </section>
  );
}
