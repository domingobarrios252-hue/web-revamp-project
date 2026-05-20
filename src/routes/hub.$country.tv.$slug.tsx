import { createFileRoute } from "@tanstack/react-router";
import { VideoFicha } from "@/components/hub/VideoFicha";

export const Route = createFileRoute("/hub/$country/tv/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — RollerZone TV` },
      { name: "description", content: "Vídeo de RollerZone TV." },
    ],
  }),
  component: () => {
    const { country, slug } = Route.useParams();
    return <VideoFicha country={country} slug={slug} />;
  },
});
