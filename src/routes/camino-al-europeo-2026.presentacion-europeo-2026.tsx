import { createFileRoute } from "@tanstack/react-router";
import { SpecialBreadcrumb } from "@/components/specials/europeo-2026/SpecialBreadcrumb";
import { SpecialHero } from "@/components/specials/europeo-2026/SpecialHero";
import { SpecialSubNav } from "@/components/specials/europeo-2026/SpecialSubNav";
import { EventKeyFacts } from "@/components/specials/europeo-2026/EventKeyFacts";
import { EventCalendarTimeline } from "@/components/specials/europeo-2026/EventCalendarTimeline";
import { BackToSpecial } from "@/components/specials/europeo-2026/BackToSpecial";
import { EVENT, getPiece } from "@/lib/specials/europeo-2026";

const PIECE = getPiece("presentacion-europeo-2026");
const CANON = "https://rollerzone.lovable.app/camino-al-europeo-2026/presentacion-europeo-2026";

export const Route = createFileRoute("/camino-al-europeo-2026/presentacion-europeo-2026")({
  head: () => ({
    meta: [
      { title: `${PIECE.title} — Camino al Europeo 2026` },
      { name: "description", content: PIECE.description },
      { property: "og:title", content: PIECE.title },
      { property: "og:description", content: PIECE.description },
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
        title={PIECE.title}
        subtitle="Una guía editorial al Campeonato de Europa que reunirá a la élite del patinaje de velocidad en Cardano al Campo."
        image={PIECE.image}
      />
      <SpecialSubNav active="presentacion-europeo-2026" />

      <section className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-6 px-4 text-base leading-relaxed text-foreground/90 md:px-6 md:text-lg">
          <p>
            El <strong>{EVENT.name}</strong> se celebra entre el{" "}
            <strong>{EVENT.datesLabel}</strong> en <strong>{EVENT.venue}</strong>
            , localidad situada en la provincia de {EVENT.region}, a pocos
            kilómetros del aeropuerto de Milán-Malpensa. Será la gran cita
            continental del calendario 2026, con pruebas en{" "}
            <strong>pista</strong>, <strong>ruta</strong> y{" "}
            <strong>maratón</strong>.
          </p>
          <p>
            Cardano al Campo se convierte así en epicentro del patinaje de
            velocidad europeo: una semana intensa que combina la técnica de la
            pista, la épica de la ruta y la resistencia del maratón final, con
            la mejor generación de patinadores y patinadoras del continente
            buscando el oro continental.
          </p>
          <p>
            RollerZone abre este especial <em>Camino al Europeo 2026</em> para
            seguir paso a paso la preparación y la actuación de la{" "}
            <strong>selección española</strong>, recopilar la información oficial
            del campeonato y construir un dossier completo que sirva tanto al
            aficionado como al profesional del sector.
          </p>
        </div>
      </section>

      <EventKeyFacts />
      <EventCalendarTimeline />

      <BackToSpecial />
    </>
  );
}
