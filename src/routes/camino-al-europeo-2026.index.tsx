import { createFileRoute } from "@tanstack/react-router";
import { SpecialHero } from "@/components/specials/europeo-2026/SpecialHero";
import { SpecialSubNav } from "@/components/specials/europeo-2026/SpecialSubNav";
import { EventKeyFacts } from "@/components/specials/europeo-2026/EventKeyFacts";
import { DossierPiecesGrid } from "@/components/specials/europeo-2026/DossierPiecesGrid";
import { RelatedSelectionNews } from "@/components/specials/europeo-2026/RelatedSelectionNews";
import { EVENT, piecePath } from "@/lib/specials/europeo-2026";

const CANON = "https://rollerzone.lovable.app/camino-al-europeo-2026";

export const Route = createFileRoute("/camino-al-europeo-2026/")({
  head: () => ({
    meta: [
      { title: "Camino al Europeo 2026 — Cobertura especial RollerZone" },
      {
        name: "description",
        content:
          "Cobertura completa del Campeonato de Europa de Patinaje de Velocidad 2026 en Cardano al Campo: convocatoria de España, calendario, sedes, entrevistas y actualidad de la selección.",
      },
      { property: "og:title", content: "Camino al Europeo 2026 — Cobertura especial" },
      {
        property: "og:description",
        content:
          "Reportajes, convocatoria, calendario y toda la actualidad de la selección española en el Europeo de Cardano al Campo 2026.",
      },
      { property: "og:url", content: CANON },
      { property: "og:type", content: "website" },
      { property: "og:image", content: EVENT.heroImage },
    ],
    links: [{ rel: "canonical", href: CANON }],
  }),
  component: SpecialLanding,
});

function SpecialLanding() {
  return (
    <>
      <SpecialHero
        title="Camino al Europeo 2026"
        subtitle="Reportajes, entrevistas, convocatoria, calendario, información oficial y toda la actualidad de la selección española y del Europeo de Cardano al Campo 2026."
        image={EVENT.heroImage}
        ctas={[
          { label: "Ver convocatoria de España", to: piecePath("convocatoria-seleccion-espanola"), primary: true },
          { label: "Calendario y sedes", to: piecePath("calendario-y-sedes") },
        ]}
      />

      <SpecialSubNav active="landing" />

      <EventKeyFacts />

      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <div className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
            Presentación
          </div>
          <h2 className="font-display mt-3 text-3xl uppercase tracking-wider text-foreground md:text-4xl">
            La cita europea del patinaje de velocidad
          </h2>
          <div className="mx-auto mt-4 h-[3px] w-24 bg-gold" />
          <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
            El <strong className="text-foreground">{EVENT.name}</strong> se
            disputa del <strong className="text-foreground">{EVENT.datesLabel}</strong>{" "}
            en <strong className="text-foreground">{EVENT.venue} ({EVENT.region})</strong>,
            con pruebas de pista, ruta y maratón. RollerZone abre este especial
            para acompañar el camino de la selección española y reunir en un
            solo lugar la información oficial, las convocatorias, las
            entrevistas, los resultados y todas las piezas que iremos publicando
            antes, durante y después del campeonato.
          </p>
        </div>
      </section>

      <div id="piezas" />
      <DossierPiecesGrid />

      <RelatedSelectionNews />
    </>
  );
}
