import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/colabora")({
  head: () => ({
    meta: [
      { title: "Colabora — RollerZone" },
      { name: "description", content: "Colabora con RollerZone." },
    ],
  }),
  component: ColaboraPage,
});

function ColaboraPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="font-display text-4xl tracking-widest">Colabora</h1>
      <p className="mt-4 text-muted-foreground">Página en construcción.</p>
      <Link to="/" className="mt-6 inline-block text-gold underline">Volver al inicio</Link>
    </div>
  );
}
