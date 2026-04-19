import { createFileRoute } from "@tanstack/react-router";
import { LiveResultsWidget } from "@/components/site/LiveResultsWidget";

export const Route = createFileRoute("/resultados")({
  head: () => ({
    meta: [
      { title: "Resultados en vivo — RollerZone" },
      {
        name: "description",
        content:
          "Sigue los resultados de las pruebas de patinaje de velocidad en directo: Top 3, tiempos y clubes.",
      },
      { property: "og:title", content: "Resultados en vivo — RollerZone" },
      {
        property: "og:description",
        content:
          "Sigue los resultados de las pruebas de patinaje de velocidad en directo: Top 3, tiempos y clubes.",
      },
    ],
  }),
  component: ResultadosPage,
});

function ResultadosPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <header className="mb-8">
        <div className="font-condensed text-xs font-bold uppercase tracking-widest text-gold">
          Competición
        </div>
        <h1 className="font-display mt-1 text-4xl tracking-widest md:text-5xl">
          RESULTADOS EN VIVO
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Top 3 de cada prueba con tiempos y clubes. Las tarjetas con noticia vinculada llevan a la
          crónica completa.
        </p>
      </header>

      <LiveResultsWidget limit={50} />
    </div>
  );
}
