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

export const Route = createFileRoute(
  "/camino-al-europeo-2026/convocatoria-seleccion-espanola"
)({
  head: () => ({
    meta: [
      { title: `${PIECE.title} — Europeo 2026` },
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
      <SpecialBreadcrumb current="Convocatoria" />
      <SpecialHero
        compact
        title="Convocatoria oficial de España"
        subtitle={`Los convocados por ${SPAIN_CALLUP.coach} para representar a España en el Europeo de Cardano al Campo 2026.`}
        image={PIECE.image}
      />
      <SpecialSubNav active="convocatoria-seleccion-espanola" />

      <section className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-5 px-4 text-base leading-relaxed text-foreground/90 md:px-6">
          <p>
            La Real Federación Española de Patinaje, a través del seleccionador{" "}
            <strong>{SPAIN_CALLUP.coach}</strong>, ha hecho pública la
            convocatoria oficial de la selección española de patinaje de
            velocidad para el Campeonato de Europa 2026.
          </p>
          <p>
            La expedición española estará compuesta por las categorías{" "}
            <strong>juvenil</strong>, <strong>júnior</strong> y{" "}
            <strong>sénior</strong>, tanto en masculino como en femenino, con
            opciones reales de medalla en varias pruebas de pista, ruta y
            maratón.
          </p>
        </div>
      </section>

      <CallupRoster />

      <RelatedSelectionNews limit={4} />

      <BackToSpecial />
    </>
  );
}
