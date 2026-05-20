import { createFileRoute } from "@tanstack/react-router";
import { LiveCenterPage } from "@/components/hub/LiveCenterPage";

export const Route = createFileRoute("/hub/$country/live")({
  head: ({ params }) => ({
    meta: [
      { title: `Live Center — ${params.country.toUpperCase()}` },
      { name: "description", content: "Sigue en directo las competiciones de patinaje: timeline, resultados y streaming." },
    ],
  }),
  component: () => {
    const { country } = Route.useParams();
    return <LiveCenterPage country={country} />;
  },
});
