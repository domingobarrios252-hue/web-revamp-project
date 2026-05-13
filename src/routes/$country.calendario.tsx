import { createFileRoute } from "@tanstack/react-router";
import { getCountryBySlug } from "@/lib/countries";

export const Route = createFileRoute("/$country/calendario")({ component: Page });

function Page() {
  const { country: slug } = Route.useParams();
  const c = getCountryBySlug(slug)!;
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 text-center">
      <h1 className="font-display text-3xl tracking-widest">Calendario <span className="text-gold">{c.name}</span></h1>
      <p className="mt-3 text-sm text-muted-foreground">Calendario nacional de {c.name} en preparación.</p>
    </div>
  );
}
