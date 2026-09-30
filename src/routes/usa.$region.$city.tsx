import { createFileRoute } from "@tanstack/react-router";
import { UsaZonePage, zoneTitle } from "@/components/territory/UsaZonePage";

export const Route = createFileRoute("/usa/$region/$city")({
  head: ({ params }) => {
    const city = zoneTitle(params.city);
    const region = zoneTitle(params.region);
    const title = `Patinaje en ${city}, ${region} | RollerZone USA`;
    const desc = `Noticias del patinaje de velocidad en ${city} (${region}, Estados Unidos) en RollerZone USA.`;
    const url = `https://rollerzone.es/usa/${params.region}/${params.city}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: CityPage,
});

function CityPage() {
  const { region, city } = Route.useParams();
  return <UsaZonePage regionSlug={region} citySlug={city} />;
}
