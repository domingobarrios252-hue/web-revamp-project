import { createFileRoute } from "@tanstack/react-router";
import { FederationProfile } from "@/components/hub/FederationProfile";

export const Route = createFileRoute("/hub/$country/federaciones/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ").toUpperCase()} · Federaciones RollerZone` },
      { name: "description", content: `Ficha de la federación ${params.slug.replace(/-/g, " ")} en RollerZone España.` },
    ],
  }),
  component: FederationPage,
});

function FederationPage() {
  const { country, slug } = Route.useParams();
  return <FederationProfile slug={slug} country={country} />;
}
