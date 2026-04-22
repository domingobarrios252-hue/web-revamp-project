import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/equipo")({
  head: () => ({
    meta: [
      { title: "Equipo — RollerZone" },
      { name: "description", content: "El equipo de RollerZone." },
    ],
  }),
  component: EquipoPage,
});

function EquipoPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="font-display text-4xl tracking-widest">Equipo</h1>
      <p className="mt-4 text-muted-foreground">Página en construcción.</p>
      <Link to="/" className="mt-6 inline-block text-gold underline">Volver al inicio</Link>
    </div>
  );
}
