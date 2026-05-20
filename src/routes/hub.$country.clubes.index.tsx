import { createFileRoute } from "@tanstack/react-router";
import { ClubsDirectory } from "@/components/hub/ClubsDirectory";

export const Route = createFileRoute("/hub/$country/clubes/")({
  head: ({ params }) => ({
    meta: [
      { title: `Clubes de patinaje de velocidad · Hub ${params.country.toUpperCase()} — RollerZone` },
      {
        name: "description",
        content: `Directorio nacional de clubes y escuelas de patinaje de velocidad en ${params.country.toUpperCase()}. Filtra por comunidad autónoma, categoría y tipo.`,
      },
      { property: "og:title", content: `Clubes · RollerZone ${params.country.toUpperCase()}` },
    ],
  }),
  component: ClubesIndex,
});

function ClubesIndex() {
  const { country } = Route.useParams();
  return <ClubsDirectory country={country} />;
}
