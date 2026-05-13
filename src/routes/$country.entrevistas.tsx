import { createFileRoute } from "@tanstack/react-router";
import { getCountryBySlug } from "@/lib/countries";

export const Route = createFileRoute("/$country/entrevistas")({ component: () => Stub("Entrevistas") });

function Stub(title: string) {
  const { country: slug } = Route.useParams();
  const c = getCountryBySlug(slug)!;
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 text-center">
      <h1 className="font-display text-3xl tracking-widest">{title} <span className="text-gold">{c.name}</span></h1>
      <p className="mt-3 text-sm text-muted-foreground">Sección en preparación. Próximamente publicaremos contenido específico para {c.name}.</p>
    </div>
  );
}
