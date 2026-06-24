import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { SpecialBreadcrumb } from "@/components/specials/europeo-2026/SpecialBreadcrumb";
import { SpecialHero } from "@/components/specials/europeo-2026/SpecialHero";
import { SpecialSubNav } from "@/components/specials/europeo-2026/SpecialSubNav";
import { BackToSpecial } from "@/components/specials/europeo-2026/BackToSpecial";
import { getPiece, EVENT } from "@/lib/specials/europeo-2026";

const PIECE = getPiece("resultados-y-medallero");
const CANON = "https://rollerzone.lovable.app/camino-al-europeo-2026/resultados-y-medallero";

export const Route = createFileRoute("/camino-al-europeo-2026/resultados-y-medallero")({
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
      <SpecialBreadcrumb current="Resultados" />
      <SpecialHero
        compact
        title={PIECE.title}
        subtitle={`Se activará durante el campeonato (${EVENT.datesLabel}) con resultados diarios, medallero y crónicas.`}
        image={PIECE.image}
      />
      <SpecialSubNav active="resultados-y-medallero" />

      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <Trophy className="mx-auto h-12 w-12 text-gold" />
          <h2 className="font-display mt-4 text-2xl uppercase tracking-wider text-foreground md:text-3xl">
            Resultados y medallero
          </h2>
          <div className="mx-auto mt-3 h-[3px] w-24 bg-gold" />
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Esta página está preparada para activarse durante el Europeo. Aquí
            encontrarás:
          </p>
          <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-foreground">
            <li className="rounded-md border border-border bg-surface p-3">· Medallero general por países y por categorías.</li>
            <li className="rounded-md border border-border bg-surface p-3">· Resultados diarios de pista, ruta y maratón.</li>
            <li className="rounded-md border border-border bg-surface p-3">· Resumen de la actuación de la selección española.</li>
            <li className="rounded-md border border-border bg-surface p-3">· Enlaces a las crónicas publicadas en RollerZone.</li>
          </ul>
          <div className="mt-8">
            <Link
              to="/resultados"
              className="font-condensed inline-flex items-center gap-2 rounded-md border border-gold/60 bg-black/20 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold transition-all hover:bg-black/40"
            >
              Ver resultados publicados
            </Link>
          </div>
        </div>
      </section>

      <BackToSpecial />
    </>
  );
}
