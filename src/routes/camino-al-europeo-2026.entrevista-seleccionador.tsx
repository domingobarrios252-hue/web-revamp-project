import { createFileRoute, Link } from "@tanstack/react-router";
import { SpecialBreadcrumb } from "@/components/specials/europeo-2026/SpecialBreadcrumb";
import { SpecialHero } from "@/components/specials/europeo-2026/SpecialHero";
import { SpecialSubNav } from "@/components/specials/europeo-2026/SpecialSubNav";
import { RelatedSelectionNews } from "@/components/specials/europeo-2026/RelatedSelectionNews";
import { BackToSpecial } from "@/components/specials/europeo-2026/BackToSpecial";
import { getPiece, SPAIN_CALLUP } from "@/lib/specials/europeo-2026";

const PIECE = getPiece("entrevista-seleccionador");
const CANON = "https://rollerzone.lovable.app/camino-al-europeo-2026/entrevista-seleccionador";

export const Route = createFileRoute("/camino-al-europeo-2026/entrevista-seleccionador")({
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
      <SpecialBreadcrumb current="Entrevistas" />
      <SpecialHero
        compact
        title={PIECE.title}
        subtitle={`Conversaciones con ${SPAIN_CALLUP.coach} y los protagonistas del Europeo 2026.`}
        image={PIECE.image}
      />
      <SpecialSubNav active="entrevista-seleccionador" />

      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <div className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
            Próximamente
          </div>
          <h2 className="font-display mt-3 text-2xl uppercase tracking-wider text-foreground md:text-3xl">
            Entrevistas en preparación
          </h2>
          <div className="mx-auto mt-4 h-[3px] w-24 bg-gold" />
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Publicaremos en este espacio las entrevistas con el seleccionador
            nacional y con los patinadores convocados a medida que se acerque la
            cita europea. Mientras tanto, puedes consultar todas las entrevistas
            ya publicadas en RollerZone.
          </p>
          <div className="mt-8">
            <Link
              to="/entrevistas"
              className="font-condensed inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-background shadow-lg gold-glow-soft transition-all hover:bg-gold-light"
            >
              Ver todas las entrevistas
            </Link>
          </div>
        </div>
      </section>

      <RelatedSelectionNews limit={4} />

      <BackToSpecial />
    </>
  );
}
