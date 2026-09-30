import { createFileRoute } from "@tanstack/react-router";
import { UsaZonePage, zoneTitle } from "@/components/territory/UsaZonePage";

export const Route = createFileRoute("/usa/$region/")({
  head: ({ params }) => {
    const name = zoneTitle(params.region);
    const title = `Patinaje en ${name} (USA) | RollerZone`;
    const desc = `Noticias del patinaje de velocidad en ${name}, Estados Unidos, en RollerZone USA.`;
    const url = `https://rollerzone.es/usa/${params.region}`;
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
  component: RegionPage,
});

function RegionPage() {
  const { region } = Route.useParams();
  return <UsaZonePage regionSlug={region} />;
}
