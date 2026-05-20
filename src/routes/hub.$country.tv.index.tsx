import { createFileRoute } from "@tanstack/react-router";
import { VideosDirectory } from "@/components/hub/VideosDirectory";

export const Route = createFileRoute("/hub/$country/tv/")({
  head: ({ params }) => ({
    meta: [
      { title: `RollerZone TV — ${params.country.toUpperCase()}` },
      { name: "description", content: "Vídeos, entrevistas, directos y highlights del patinaje en RollerZone TV." },
    ],
  }),
  component: () => {
    const { country } = Route.useParams();
    return <VideosDirectory country={country} />;
  },
});
