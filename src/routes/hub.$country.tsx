import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";
import { useCountryHub } from "@/lib/hub/useCountryHub";
import { HubSubNav } from "@/components/hub/HubSubNav";
import { HubHero } from "@/components/hub/HubHero";

export const Route = createFileRoute("/hub/$country")({
  component: HubLayout,
  head: ({ params }) => ({
    meta: [
      { title: `Hub ${params.country.toUpperCase()} — RollerZone` },
      {
        name: "description",
        content: `Portal del patinaje de velocidad en ${params.country.toUpperCase()} — noticias, competiciones, clubes, patinadores y más.`,
      },
    ],
  }),
});

function HubLayout() {
  const { country } = Route.useParams();
  const { hub, loading } = useCountryHub(country);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-[#888]">
        Cargando hub…
      </div>
    );
  }

  if (!hub) {
    throw notFound();
  }

  return (
    <div className="hub-readable bg-[#111]">
      <HubHero hub={hub} />
      <HubSubNav country={country} activeSections={hub.active_sections} sectionLabels={hub.section_labels} />
      <Outlet />
    </div>
  );
}
