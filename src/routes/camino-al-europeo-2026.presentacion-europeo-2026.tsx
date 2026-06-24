import { createFileRoute } from "@tanstack/react-router";
import { SpecialBreadcrumb } from "@/components/specials/europeo-2026/SpecialBreadcrumb";
import { SpecialHero } from "@/components/specials/europeo-2026/SpecialHero";
import { SpecialSubNav } from "@/components/specials/europeo-2026/SpecialSubNav";
import { EventKeyFacts } from "@/components/specials/europeo-2026/EventKeyFacts";
import { EventCalendarTimeline } from "@/components/specials/europeo-2026/EventCalendarTimeline";
import { BackToSpecial } from "@/components/specials/europeo-2026/BackToSpecial";
import { getPiece } from "@/lib/specials/europeo-2026";

const PIECE = getPiece("presentacion-europeo-2026");
const CANON = "https://rollerzone.lovable.app/camino-al-europeo-2026/presentacion-europeo-2026";
const TITLE = "Camino al Europeo 2026: Cardano al Campo espera a la élite del patinaje continental";
const DESCRIPTION =
  "Del 19 al 26 de julio de 2026, el patinaje de velocidad europeo vivirá una de sus grandes citas en Cardano al Campo (Italia). RollerZone abre su especial Camino al Europeo 2026.";

export const Route = createFileRoute("/camino-al-europeo-2026/presentacion-europeo-2026")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Camino al Europeo 2026` },
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
      <SpecialBreadcrumb current={PIECE.kicker} />
      <SpecialHero
        compact
        title={TITLE}
        subtitle={DESCRIPTION}
        image={PIECE.image}
      />
      <SpecialSubNav active="presentacion-europeo-2026" />

      <article className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-6 px-4 text-base leading-relaxed text-foreground/90 md:px-6 md:text-lg">
          <p>
            Hay campeonatos que se recuerdan por los resultados, por los récords
            o por las medallas. Y luego están aquellos que se viven como un
            viaje completo: la preparación, la convocatoria, la ilusión de los
            clubes, el orgullo de vestir una selección y la sensación de que
            cada detalle cuenta antes de salir a pista. Para RollerZone, el
            Europeo de Cardano al Campo 2026 es exactamente eso: una gran
            historia que merece ser contada desde mucho antes de que suene el
            primer disparo de salida.
          </p>
          <p>
            La localidad italiana de <strong>Cardano al Campo</strong>, situada
            en la provincia de Varese, será el epicentro del patinaje de
            velocidad europeo durante una semana que reunirá a las principales
            selecciones del continente en un escenario preparado para albergar
            pruebas de pista, ruta y maratón. Allí se cruzarán la experiencia
            de los grandes referentes, la ambición de las nuevas generaciones y
            el trabajo de meses de preparación de cada federación.
          </p>
          <p>
            Para el patinaje español, esta cita representa mucho más que una
            simple competición internacional. El Europeo es un escaparate, una
            prueba de madurez deportiva y una oportunidad de confirmar el
            crecimiento de una generación de patinadores que llega con hambre,
            talento y una enorme ilusión por competir frente a las mejores
            potencias del continente. Juveniles, júniors y sénior compartirán
            el mismo objetivo: defender los colores de España en una de las
            semanas más importantes del año.
          </p>

          <div className="my-8 rounded-2xl border border-gold/40 bg-surface p-6">
            <div className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
              El especial
            </div>
            <h2 className="font-display mt-2 text-xl uppercase tracking-wider text-foreground md:text-2xl">
              Camino al Europeo 2026
            </h2>
            <p className="mt-3 text-sm text-foreground/90 md:text-base">
              Un espacio pensado para seguir de cerca todo lo que rodea al
              campeonato:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-foreground/90 md:text-base">
              <li>• La convocatoria oficial de la selección española</li>
              <li>• El calendario y las sedes</li>
              <li>• La información clave del evento</li>
              <li>• Las entrevistas y protagonistas</li>
              <li>• La actualidad de la selección española</li>
              <li>
                • Los resultados, el medallero y la cobertura diaria cuando
                llegue la hora de la verdad
              </li>
            </ul>
          </div>

          <p>
            Queremos que este especial sea algo más que una recopilación de
            noticias. Queremos que sea el lugar donde se concentre el relato
            completo del Europeo: la cuenta atrás, la emoción previa, las voces
            de los protagonistas, los nombres propios, las fechas señaladas y
            todo aquello que convierte un campeonato en una historia que merece
            quedarse en la memoria.
          </p>
          <p>
            Porque antes de cada medalla hay un camino. Antes de cada final hay
            meses de esfuerzo, entrenamientos, dudas, sacrificios y sueños. Y
            RollerZone quiere recorrer ese camino al lado de la selección
            española y de todos los aficionados que sienten este deporte como
            algo propio.
          </p>
          <p className="font-display text-lg uppercase tracking-wider text-gold">
            Bienvenidos a Camino al Europeo 2026. Empieza la cuenta atrás.
          </p>
        </div>
      </article>

      <EventKeyFacts />
      <EventCalendarTimeline />

      <BackToSpecial />
    </>
  );
}
