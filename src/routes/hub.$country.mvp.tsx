import { createFileRoute } from "@tanstack/react-router";
import { MvpRanking } from "@/components/hub/MvpRanking";

export const Route = createFileRoute("/hub/$country/mvp")({
  head: ({ params }) => ({
    meta: [
      { title: `MVP Ranking — ${params.country.toUpperCase()}` },
      { name: "description", content: "Ranking dinámico de los mejores patinadores por categoría y género." },
    ],
  }),
  component: () => {
    const { country } = Route.useParams();
    return <MvpRanking country={country} />;
  },
});
