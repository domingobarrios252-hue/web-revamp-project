import { createFileRoute, Link } from "@tanstack/react-router";
import { PlayCircle } from "lucide-react";
import { SpecialBreadcrumb } from "@/components/specials/europeo-2026/SpecialBreadcrumb";
import { SpecialHero } from "@/components/specials/europeo-2026/SpecialHero";
import { SpecialSubNav } from "@/components/specials/europeo-2026/SpecialSubNav";
import { BackToSpecial } from "@/components/specials/europeo-2026/BackToSpecial";
import { getPiece } from "@/lib/specials/europeo-2026";

const PIECE = getPiece("galeria-rollerzone-tv");
const CANON = "https://rollerzone.lovable.app/camino-al-europeo-2026/galeria-rollerzone-tv";

export const Route = createFileRoute("/camino-al-europeo-2026/galeria-rollerzone-tv")({
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
      <SpecialBreadcrumb current="Galería / TV" />
      <SpecialHero
        compact
        title={PIECE.title}
        subtitle="Fotos, vídeos y emisiones en directo del Europeo cuando se vaya generando contenido."
        image={PIECE.image}
      />
      <SpecialSubNav active="galeria-rollerzone-tv" />

      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <PlayCircle className="mx-auto h-12 w-12 text-gold" />
          <h2 className="font-display mt-4 text-2xl uppercase tracking-wider text-foreground md:text-3xl">
            Galería y vídeos del Europeo
          </h2>
          <div className="mx-auto mt-3 h-[3px] w-24 bg-gold" />
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Reuniremos aquí las fotografías, vídeos y emisiones de RollerZone TV
            relacionadas con el Europeo 2026. Mientras tanto, puedes explorar
            todos los contenidos disponibles en RollerZone TV.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/tv"
              className="font-condensed inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-background shadow-lg gold-glow-soft transition-all hover:bg-gold-light"
            >
              Ir a RollerZone TV
            </Link>
          </div>
        </div>
      </section>

      <BackToSpecial />
    </>
  );
}
