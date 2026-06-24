import { createFileRoute } from "@tanstack/react-router";
import { SpecialBreadcrumb } from "@/components/specials/europeo-2026/SpecialBreadcrumb";
import { SpecialHero } from "@/components/specials/europeo-2026/SpecialHero";
import { SpecialSubNav } from "@/components/specials/europeo-2026/SpecialSubNav";
import { EventKeyFacts } from "@/components/specials/europeo-2026/EventKeyFacts";
import { BackToSpecial } from "@/components/specials/europeo-2026/BackToSpecial";
import { EVENT, getPiece } from "@/lib/specials/europeo-2026";

const PIECE = getPiece("informacion-campeonato");
const CANON = "https://rollerzone.lovable.app/camino-al-europeo-2026/informacion-campeonato";

export const Route = createFileRoute("/camino-al-europeo-2026/informacion-campeonato")({
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

const ROWS: Array<{ label: string; value: string }> = [
  { label: "Evento", value: EVENT.name },
  { label: "Sede", value: `${EVENT.venue}, ${EVENT.region}` },
  { label: "Fechas", value: EVENT.datesLabel },
  { label: "Disciplinas", value: EVENT.disciplines.join(" · ") },
  { label: "Organiza", value: "World Skate Europe Rink + comité local" },
  { label: "Aeropuerto cercano", value: "Milán-Malpensa (MXP)" },
];

function Page() {
  return (
    <>
      <SpecialBreadcrumb current="Información" />
      <SpecialHero
        compact
        title={PIECE.title}
        subtitle="Toda la información práctica del Europeo 2026 en un solo lugar."
        image={PIECE.image}
      />
      <SpecialSubNav active="informacion-campeonato" />

      <EventKeyFacts />

      <section className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <h2 className="font-display text-2xl uppercase tracking-wider text-foreground md:text-3xl">
            Ficha técnica
          </h2>
          <div className="mt-3 h-[3px] w-24 bg-gold" />
          <dl className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {ROWS.map((r) => (
              <div key={r.label} className="grid grid-cols-3 gap-4 p-4">
                <dt className="font-condensed col-span-1 text-[11px] uppercase tracking-[2.5px] text-muted-foreground">
                  {r.label}
                </dt>
                <dd className="col-span-2 text-sm text-foreground">{r.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-muted-foreground">
            Información oficial actualizada desde la web del comité organizador:{" "}
            <a
              href={EVENT.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              euroskatingcardano2026.it
            </a>
            . Iremos ampliando esta ficha con horarios, accesos y servicios a
            medida que se publiquen.
          </p>
        </div>
      </section>

      <BackToSpecial />
    </>
  );
}
