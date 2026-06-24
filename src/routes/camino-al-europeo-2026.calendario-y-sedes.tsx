import { createFileRoute } from "@tanstack/react-router";
import { MapPin, ExternalLink } from "lucide-react";
import { SpecialBreadcrumb } from "@/components/specials/europeo-2026/SpecialBreadcrumb";
import { SpecialHero } from "@/components/specials/europeo-2026/SpecialHero";
import { SpecialSubNav } from "@/components/specials/europeo-2026/SpecialSubNav";
import { EventCalendarTimeline } from "@/components/specials/europeo-2026/EventCalendarTimeline";
import { BackToSpecial } from "@/components/specials/europeo-2026/BackToSpecial";
import { EVENT, getPiece } from "@/lib/specials/europeo-2026";

const PIECE = getPiece("calendario-y-sedes");
const CANON = "https://rollerzone.lovable.app/camino-al-europeo-2026/calendario-y-sedes";

export const Route = createFileRoute("/camino-al-europeo-2026/calendario-y-sedes")({
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
      <SpecialBreadcrumb current="Calendario y sedes" />
      <SpecialHero
        compact
        title={PIECE.title}
        subtitle="El día a día del campeonato y la sede principal: ceremonia, pista, ruta y maratón."
        image={PIECE.image}
      />
      <SpecialSubNav active="calendario-y-sedes" />

      <EventCalendarTimeline />

      <section className="bg-surface/40 py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <div className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
            Sede
          </div>
          <h2 className="font-display mt-2 text-2xl uppercase tracking-wider text-foreground md:text-3xl">
            {EVENT.venue}, {EVENT.region}
          </h2>
          <div className="mt-3 h-[3px] w-24 bg-gold" />
          <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-surface p-6 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div>
                <div className="font-condensed text-[10px] uppercase tracking-[2.5px] text-muted-foreground">
                  Ubicación
                </div>
                <div className="text-sm text-foreground">
                  {EVENT.venue}, provincia de {EVENT.region}. A pocos kilómetros
                  del aeropuerto de Milán-Malpensa.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div>
                <div className="font-condensed text-[10px] uppercase tracking-[2.5px] text-muted-foreground">
                  Web oficial
                </div>
                <a
                  href={EVENT.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gold hover:underline"
                >
                  euroskatingcardano2026.it
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BackToSpecial />
    </>
  );
}
