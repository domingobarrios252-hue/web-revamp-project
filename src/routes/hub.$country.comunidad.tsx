import { createFileRoute } from "@tanstack/react-router";
import { CommunityPage } from "@/components/hub/CommunityPage";

export const Route = createFileRoute("/hub/$country/comunidad")({
  head: ({ params }) => ({
    meta: [
      { title: `Comunidad — Hub ${params.country.toUpperCase()}` },
      {
        name: "description",
        content:
          "Envía tu noticia, consulta el calendario comunitario y descubre el espacio de patrocinio en RollerZone.",
      },
    ],
  }),
  component: () => {
    const { country } = Route.useParams();
    return <CommunityPage country={country} />;
  },
});
