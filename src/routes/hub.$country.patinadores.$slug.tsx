import { createFileRoute } from "@tanstack/react-router";
import { SkaterProfile } from "@/components/hub/SkaterProfile";

export const Route = createFileRoute("/hub/$country/patinadores/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} · Patinadores RollerZone` },
      {
        name: "description",
        content: `Ficha del patinador ${params.slug.replace(/-/g, " ")} — RollerZone España.`,
      },
    ],
  }),
  component: SkaterPage,
});

function SkaterPage() {
  const { country, slug } = Route.useParams();
  return <SkaterProfile slug={slug} country={country} />;
}
