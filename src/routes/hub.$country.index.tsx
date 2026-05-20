import { createFileRoute } from "@tanstack/react-router";
import { HubDashboard } from "@/components/hub/HubDashboard";

export const Route = createFileRoute("/hub/$country/")({
  component: HubIndex,
});

function HubIndex() {
  const { country } = Route.useParams();
  return <HubDashboard country={country} />;
}
