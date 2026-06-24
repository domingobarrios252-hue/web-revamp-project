import { createFileRoute } from "@tanstack/react-router";
import { Plane, Train, Car } from "lucide-react";
import { SpecialBreadcrumb } from "@/components/specials/europeo-2026/SpecialBreadcrumb";
import { SpecialHero } from "@/components/specials/europeo-2026/SpecialHero";
import { SpecialSubNav } from "@/components/specials/europeo-2026/SpecialSubNav";
import { EventKeyFacts } from "@/components/specials/europeo-2026/EventKeyFacts";
import { BackToSpecial } from "@/components/specials/europeo-2026/BackToSpecial";
import { EVENT, getPiece } from "@/lib/specials/europeo-2026";

const PIECE = getPiece("informacion-campeonato");
const CANON = "https://rollerzone.lovable.app/camino-al-europeo-2026/informacion-campeonato";
const TITLE = "Europeo 2026 en Cardano al Campo: sede, instalación, accesos y datos clave";
const DESCRIPTION =
  "Sede, instalación deportiva, accesos y datos prácticos del Campeonato de Europa de Patinaje de Velocidad 2026, organizado por Cardano Skating del 19 al 26 de julio.";

export const Route = createFileRoute("/camino-al-europeo-2026/informacion-campeonato")({
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

const ROWS: Array<{ label: string; value: string }> = [
  { label: "Evento", value: EVENT.name },
  { label: "Sede", value: `${EVENT.venue}, Varese (Lombardía, Italia)` },
  { label: "Fechas", value: EVENT.datesLabel },
  { label: "Disciplinas", value: EVENT.disciplines.join(" · ") },
  { label: "Organiza", value: "Cardano Skating" },
  { label: "Aeropuerto cercano", value: "Milán-Malpensa (MXP)" },
];

const INSTALLATION = [
  { label: "Pista", value: "200 metros" },
  { label: "Circuito de ruta", value: "500 metros" },
  { label: "Capacidad aproximada", value: "1.000 espectadores" },
  { label: "Accesibilidad", value: "Instalación plenamente accesible" },
];

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
    value: "Sede accesible por carretera y con zonas de aparcamiento en las inmediaciones.",
  },
];

const PRACTICAL = [
  "Alojamientos recomendados",
  "Restauración",
  "Biglietteria (entradas)",
  "Contacto con la organización",
  "Maratón",
  "Clasificaciones",
  "Programa de competición",
];

function Page() {
  return (
    <>
      <SpecialBreadcrumb current="Información" />
      <SpecialHero
        compact
        title={TITLE}
        subtitle={DESCRIPTION}
        image={PIECE.image}
      />
      <SpecialSubNav active="informacion-campeonato" />

      <article className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-5 px-4 text-base leading-relaxed text-foreground/90 md:px-6">
          <p>
            Más allá de las medallas, las convocatorias o el calendario, todo
            gran campeonato tiene un contexto. Una sede, una instalación, una
            manera de llegar, un ambiente y una infraestructura que también
            forman parte del relato del evento. En el caso del Europeo de
            Cardano al Campo 2026, ese contexto apunta a una sede muy bien
            conectada, pensada para acoger una cita de primer nivel y con una
            clara vocación internacional.
          </p>
        </div>
      </article>

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
        </div>
      </section>

      <section className="bg-surface/40 py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <h2 className="font-display text-2xl uppercase tracking-wider text-foreground md:text-3xl">
            La instalación deportiva
          </h2>
          <div className="mt-3 h-[3px] w-24 bg-gold" />
          <p className="mt-5 text-base leading-relaxed text-foreground/90">
            El Europeo se disputará en una instalación preparada para acoger
            las diferentes disciplinas del campeonato y pensada para ofrecer
            una experiencia competitiva completa.
          </p>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {INSTALLATION.map((it) => (
              <li
                key={it.label}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="font-condensed text-[10px] uppercase tracking-[2.5px] text-muted-foreground">
                  {it.label}
                </div>
                <div className="font-display mt-1 text-base text-foreground">
                  {it.value}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <h2 className="font-display text-2xl uppercase tracking-wider text-foreground md:text-3xl">
            Cómo llegar a Cardano al Campo
          </h2>
          <div className="mt-3 h-[3px] w-24 bg-gold" />
          <div className="mt-6 grid gap-3 md:grid-cols-3">
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
        </div>
      </section>

      <section className="bg-surface/40 py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <h2 className="font-display text-2xl uppercase tracking-wider text-foreground md:text-3xl">
            La maratón: una prueba abierta
          </h2>
          <div className="mt-3 h-[3px] w-24 bg-gold" />
          <p className="mt-5 text-base leading-relaxed text-foreground/90">
            Uno de los aspectos más llamativos del Europeo 2026 es el formato
            de la maratón. La{" "}
            <strong>European Marathon Open Championship 2026</strong> estará
            abierta también a atletas que no formen parte de las delegaciones
            nacionales convocadas por sus federaciones, lo que convierte esta
            prueba en un evento con identidad propia dentro del campeonato.
            Esa apertura da todavía más valor al cierre del Europeo y amplía
            el interés competitivo del último día.
          </p>
        </div>
      </section>

      <section className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <h2 className="font-display text-2xl uppercase tracking-wider text-foreground md:text-3xl">
            Información práctica para delegaciones y visitantes
          </h2>
          <div className="mt-3 h-[3px] w-24 bg-gold" />
          <p className="mt-5 text-base leading-relaxed text-foreground/90">
            La web oficial del campeonato recoge apartados específicos para
            delegaciones y aficionados:
          </p>
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {PRACTICAL.map((p) => (
              <li
                key={p}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground"
              >
                • {p}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            Información oficial actualizada desde la web del comité
            organizador:{" "}
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
