import { createFileRoute } from "@tanstack/react-router";
import { ArchiveBrowser } from "@/components/hub/ArchiveBrowser";

export const Route = createFileRoute("/hub/$country/archivo")({
  head: ({ params }) => ({
    meta: [
      { title: `Archivo histórico — Hub ${params.country.toUpperCase()}` },
      {
        name: "description",
        content:
          "Memoria histórica del patinaje: noticias, resultados, entrevistas y leyendas archivadas.",
      },
    ],
  }),
  component: () => {
    const { country } = Route.useParams();
    return <ArchiveBrowser country={country} />;
  },
});
