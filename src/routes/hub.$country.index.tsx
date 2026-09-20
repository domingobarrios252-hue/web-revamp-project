import { createFileRoute } from "@tanstack/react-router";
import { HubDashboard } from "@/components/hub/HubDashboard";

export const Route = createFileRoute("/hub/$country/")({
  component: HubIndex,
  head: ({ params }) => ({
    links: [{ rel: "canonical", href: `https://rollerzone.es/hub/${params.country}` }],
  }),
});

function HubIndex() {
  const { country } = Route.useParams();
  return <HubDashboard country={country} />;
}
