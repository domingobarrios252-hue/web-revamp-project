import { Mail } from "lucide-react";
import { NewsletterForm } from "@/components/site/NewsletterForm";

export function NewsletterBand() {
  return (
    <section className="bg-gradient-to-br from-surface via-background to-surface py-14 md:py-16">
      <div className="mx-auto max-w-5xl px-5 text-center md:px-6">
        <div className="font-condensed mx-auto inline-flex items-center gap-2 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background">
          <Mail className="h-3 w-3" /> Newsletter RollerZone
        </div>
        <h2 className="font-display mt-4 text-3xl uppercase leading-tight tracking-wider text-foreground md:text-5xl">
          No te pierdas nada del <span className="text-gold">patinaje de velocidad</span>
        </h2>
        <div className="mx-auto mt-4 h-[3px] w-24 bg-gold" aria-hidden="true" />
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-foreground/80">
          Recibe noticias, resultados, entrevistas y novedades de RollerZone directamente en tu correo. Solo lo
          esencial, sin spam.
        </p>

        <div className="mx-auto mt-7 max-w-xl">
          <NewsletterForm source="home" />
        </div>
      </div>
    </section>
  );
}
