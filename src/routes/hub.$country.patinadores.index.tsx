import { createFileRoute } from "@tanstack/react-router";
import { SkatersDirectory } from "@/components/hub/SkatersDirectory";

export const Route = createFileRoute("/hub/$country/patinadores/")({
  head: () => ({
    meta: [
      { title: "Patinadores · Hub España · RollerZone" },
      {
        name: "description",
        content:
          "Directorio de patinadores de velocidad en España. Perfiles, palmarés, marcas personales y noticias relacionadas.",
      },
    ],
  }),
  component: SkatersPage,
});

function SkatersPage() {
  const { country } = Route.useParams();
  return <SkatersDirectory country={country} />;
}
