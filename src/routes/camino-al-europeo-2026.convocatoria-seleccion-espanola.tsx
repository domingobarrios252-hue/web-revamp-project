import { createFileRoute } from "@tanstack/react-router";
import { SpecialBreadcrumb } from "@/components/specials/europeo-2026/SpecialBreadcrumb";
import { SpecialHero } from "@/components/specials/europeo-2026/SpecialHero";
import { SpecialSubNav } from "@/components/specials/europeo-2026/SpecialSubNav";
import { CallupRoster } from "@/components/specials/europeo-2026/CallupRoster";
import { RelatedSelectionNews } from "@/components/specials/europeo-2026/RelatedSelectionNews";
import { BackToSpecial } from "@/components/specials/europeo-2026/BackToSpecial";
import { getPiece, SPAIN_CALLUP } from "@/lib/specials/europeo-2026";

const PIECE = getPiece("convocatoria-seleccion-espanola");
const CANON =
  "https://rollerzone.lovable.app/camino-al-europeo-2026/convocatoria-seleccion-espanola";
const TITLE = "España ya tiene equipo para Cardano: convocatoria oficial para el Europeo 2026";
const DESCRIPTION =
  "Garikoitz Lerga da a conocer la convocatoria oficial de la selección española para el Europeo de Cardano al Campo 2026, con representación juvenil, júnior y sénior.";

export const Route = createFileRoute(
  "/camino-al-europeo-2026/convocatoria-seleccion-espanola"
)({
  head: () => ({
    meta: [
      { title: `${TITLE} — Europeo 2026` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: CANON },
      { property: "og:type", content: "article" },
      { property: "og:image", content: PIECE.image },
    ],
    links: [{ rel: "canonical", href: CANON }],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <SpecialBreadcrumb current="Convocatoria" />
      <SpecialHero
        compact
        title={TITLE}
        subtitle={DESCRIPTION}
        image={PIECE.image}
      />
      <SpecialSubNav active="convocatoria-seleccion-espanola" />

      <article className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-5 px-4 text-base leading-relaxed text-foreground/90 md:px-6">
          <p>
            Ya no hay lugar para las especulaciones. España ya tiene definidos
            los nombres que afrontarán una de las grandes citas del calendario
            internacional. El Europeo de Cardano al Campo 2026 ya tiene acento
            español y también una lista de protagonistas dispuestos a dejar su
            huella en Italia.
          </p>
          <p>
            La convocatoria anunciada por el seleccionador{" "}
            <strong>{SPAIN_CALLUP.coach}</strong> refleja el presente y el
            futuro del patinaje español: jóvenes con enorme proyección,
            patinadores júnior llamados a dar un paso adelante y una categoría
            sénior que mezcla experiencia, carácter competitivo y mucha
            calidad.
          </p>
        </div>
      </article>

      <CallupRoster />

      <section className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-5 px-4 text-base leading-relaxed text-foreground/90 md:px-6">
          <p>
            La lista deja entrever una selección con profundidad, talento y
            mucha variedad de perfiles, capaz de competir en diferentes frentes
            dentro del campeonato. Desde RollerZone seguiremos muy de cerca la
            evolución de cada uno de los convocados, la preparación final
            antes del viaje a Italia y, por supuesto, el rendimiento de España
            en una semana que puede dejar grandes momentos para nuestro
            patinaje.
          </p>
          <p className="font-display text-lg uppercase tracking-wider text-gold">
            Cardano ya espera. Y España ya tiene nombres, caras y sueños para
            intentarlo.
          </p>
        </div>
      </section>

      <RelatedSelectionNews limit={4} />

      <BackToSpecial />
    </>
  );
}
