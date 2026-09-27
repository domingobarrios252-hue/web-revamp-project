import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/estadisticas")({
  head: () => ({
    meta: [
      { title: "Estadísticas — Panel RollerZone" },
      { name: "description", content: "Panel privado de estadísticas reales de RollerZone." },
      { property: "og:title", content: "Estadísticas — Panel RollerZone" },
      { property: "og:description", content: "Panel privado de estadísticas reales de RollerZone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  return <h1>ESTADÍSTICAS — PANEL CARGADO CORRECTAMENTE</h1>;
}
