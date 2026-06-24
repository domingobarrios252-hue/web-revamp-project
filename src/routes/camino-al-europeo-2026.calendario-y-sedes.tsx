import { createFileRoute } from "@tanstack/react-router";
import { MapPin, ExternalLink, Plane, Train, Car } from "lucide-react";
import { SpecialBreadcrumb } from "@/components/specials/europeo-2026/SpecialBreadcrumb";
import { SpecialHero } from "@/components/specials/europeo-2026/SpecialHero";
import { SpecialSubNav } from "@/components/specials/europeo-2026/SpecialSubNav";
import { EventCalendarTimeline } from "@/components/specials/europeo-2026/EventCalendarTimeline";
import { BackToSpecial } from "@/components/specials/europeo-2026/BackToSpecial";
import { EVENT, getPiece } from "@/lib/specials/europeo-2026";

const PIECE = getPiece("calendario-y-sedes");
const CANON = "https://rollerzone.lovable.app/camino-al-europeo-2026/calendario-y-sedes";
const TITLE = "Calendario y sedes del Europeo 2026: así se disputará la gran semana de Cardano";
const DESCRIPTION =
  "El Europeo 2026 se celebra del 19 al 26 de julio en Cardano al Campo (Italia), con pruebas de pista, ruta y maratón. Calendario, sede e información clave.";

export const Route = createFileRoute("/camino-al-europeo-2026/calendario-y-sedes")({
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

const ACCESS = [
  {
    icon: Plane,
    label: "En avión",
    value: "Aeropuerto de Milán-Malpensa (MXP), a escasos kilómetros de la sede.",
  },
  {
    icon: Train,
    label: "En tren",
    value: "Estación de referencia: Gallarate, con conexión directa desde Milán.",
  },
  {
    icon: Car,
    label: "En coche",
    value: "Sede accesible por carretera, con zonas de aparcamiento en las inmediaciones.",
  },
];

function Page() {
  return (
    <>
      <SpecialBreadcrumb current="Calendario y sedes" />
      <SpecialHero
        compact
        title={TITLE}
        subtitle={DESCRIPTION}
        image={PIECE.image}
      />
      <SpecialSubNav active="calendario-y-sedes" />

      <article className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-5 px-4 text-base leading-relaxed text-foreground/90 md:px-6">
          <p>
            El Europeo de Cardano al Campo ya tiene forma. La cita continental
            se desarrollará a lo largo de ocho días con una estructura clásica,
            pensada para combinar las pruebas de pista, la competición en ruta
            y el cierre con la <strong>maratón</strong>, una de las pruebas
            más esperadas del campeonato.
          </p>
        </div>
      </article>

      <EventCalendarTimeline />

      <section className="bg-surface/40 py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <div className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
            La sede
          </div>
          <h2 className="font-display mt-2 text-2xl uppercase tracking-wider text-foreground md:text-3xl">
            {EVENT.venue}, {EVENT.region}
          </h2>
          <div className="mt-3 h-[3px] w-24 bg-gold" />
          <p className="mt-5 text-base leading-relaxed text-foreground/90">
            Cardano al Campo, en la provincia de Varese (región de Lombardía),
            será la casa del Europeo 2026. La localidad lombarda acogerá a las
            delegaciones europeas en una instalación preparada para la alta
            competición y con una ubicación estratégica, muy cercana al
            aeropuerto de Milán-Malpensa.
          </p>

          <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-surface p-6 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div>
                <div className="font-condensed text-[10px] uppercase tracking-[2.5px] text-muted-foreground">
                  Ubicación
                </div>
                <div className="text-sm text-foreground">
                  {EVENT.venue}, provincia de Varese, Lombardía (Italia).
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

          <h3 className="font-display mt-10 text-xl uppercase tracking-wider text-foreground">
            Instalación deportiva
          </h3>
          <div className="mt-2 h-[3px] w-16 bg-gold" />
          <ul className="mt-4 grid gap-3 text-sm text-foreground/90 md:grid-cols-3">
            <li className="rounded-xl border border-border bg-surface p-4">
              <div className="font-condensed text-[10px] uppercase tracking-[2.5px] text-muted-foreground">
                Pista
              </div>
              <div className="font-display mt-1 text-base text-foreground">
                200 metros
              </div>
            </li>
            <li className="rounded-xl border border-border bg-surface p-4">
              <div className="font-condensed text-[10px] uppercase tracking-[2.5px] text-muted-foreground">
                Circuito de ruta
              </div>
              <div className="font-display mt-1 text-base text-foreground">
                500 metros
              </div>
            </li>
            <li className="rounded-xl border border-border bg-surface p-4">
              <div className="font-condensed text-[10px] uppercase tracking-[2.5px] text-muted-foreground">
                Nivel
              </div>
              <div className="font-display mt-1 text-base text-foreground">
                Competición internacional
              </div>
            </li>
          </ul>

          <h3 className="font-display mt-10 text-xl uppercase tracking-wider text-foreground">
            Cómo llegar
          </h3>
          <div className="mt-2 h-[3px] w-16 bg-gold" />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {ACCESS.map((a) => (
              <div
                key={a.label}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4"
              >
                <a.icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <div>
                  <div className="font-condensed text-[10px] uppercase tracking-[2.5px] text-muted-foreground">
                    {a.label}
                  </div>
                  <p className="mt-1 text-sm text-foreground/90">{a.value}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Queda todavía tiempo para que se publique el programa definitivo
            con horarios, distancias y distribución completa de pruebas. En
            RollerZone iremos actualizando esta página con el programa
            detallado y toda la información útil a medida que se acerque la
            gran cita de Cardano.
          </p>
        </div>
      </section>

      <BackToSpecial />
    </>
  );
}
