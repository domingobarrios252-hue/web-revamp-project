import { createFileRoute } from "@tanstack/react-router";
import { FederationsDirectory } from "@/components/hub/FederationsDirectory";

export const Route = createFileRoute("/hub/$country/federaciones/")({
  head: () => ({
    meta: [
      { title: "Federaciones · Hub España · RollerZone" },
      { name: "description", content: "Real Federación Española de Patinaje y federaciones autonómicas: directorio, contacto y documentos oficiales." },
    ],
  }),
  component: FederationsPage,
});

function FederationsPage() {
  const { country } = Route.useParams();
  return <FederationsDirectory country={country} />;
}
