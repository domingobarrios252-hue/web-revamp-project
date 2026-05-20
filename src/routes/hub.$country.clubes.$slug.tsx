import { createFileRoute } from "@tanstack/react-router";
import { ClubProfile } from "@/components/hub/ClubProfile";

export const Route = createFileRoute("/hub/$country/clubes/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} · Clubes RollerZone` },
      { name: "description", content: `Ficha del club ${params.slug.replace(/-/g, " ")} — RollerZone España.` },
    ],
  }),
  component: ClubPage,
});

function ClubPage() {
  const { country, slug } = Route.useParams();
  return <ClubProfile slug={slug} country={country} />;
}
