import { createFileRoute } from "@tanstack/react-router";
import { HubDashboard } from "@/components/hub/HubDashboard";

export const Route = createFileRoute("/hub/$country/")({
  component: HubIndex,
  head: ({ params }) => ({
    links: [{ rel: "canonical", href: `https://rollerzone.es/hub/${params.country}` }],
  }),
});

const HUB_H1: Record<string, string> = {
  es: "Patinaje de velocidad en España: noticias, competiciones y resultados",
  co: "Patinaje de velocidad en Colombia: noticias, competiciones y resultados",
};

function HubIndex() {
  const { country } = Route.useParams();
  return (
    <>
      {/* Titular principal para buscadores y lectores de pantalla; no altera el diseño. */}
      <h1 className="sr-only">
        {HUB_H1[country] ?? `Patinaje de velocidad · Hub ${country.toUpperCase()} | Rollerzone`}
      </h1>
      <HubDashboard country={country} />
    </>
  );
}
