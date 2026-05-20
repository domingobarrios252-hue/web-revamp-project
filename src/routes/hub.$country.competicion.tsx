import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CompeticionSubNav } from "@/components/hub/CompeticionSubNav";

export const Route = createFileRoute("/hub/$country/competicion")({
  head: ({ params }) => ({
    meta: [
      { title: `Competición — Hub ${params.country.toUpperCase()} — RollerZone` },
      {
        name: "description",
        content: `Liga Nacional, Campeonatos, resultados y calendario del patinaje de velocidad en ${params.country.toUpperCase()}.`,
      },
    ],
  }),
  component: CompeticionLayout,
});

function CompeticionLayout() {
  const { country } = Route.useParams();
  return (
    <div>
      <CompeticionSubNav country={country} />
      <Outlet />
    </div>
  );
}
