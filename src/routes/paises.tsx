import { createFileRoute, Link } from "@tanstack/react-router";
import { COUNTRY_LIST } from "@/lib/countries";

export const Route = createFileRoute("/paises")({
  head: () => ({
    meta: [
      { title: "Países — RollerZone" },
      {
        name: "description",
        content:
          "RollerZone en tu país: noticias, eventos y entrevistas de patinaje de velocidad en España, Colombia y Venezuela.",
      },
      { property: "og:title", content: "RollerZone — Edición por país" },
      {
        property: "og:description",
        content: "Selecciona tu país y descubre la cobertura local de RollerZone.",
      },
      { property: "og:url", content: "https://rollerzone.lovable.app/paises" },
    ],
    links: [{ rel: "canonical", href: "https://rollerzone.lovable.app/paises" }],
  }),
  component: PaisesPage,
});

function PaisesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <header className="mb-10 text-center">
        <p className="font-condensed text-xs font-bold uppercase tracking-[0.3em] text-gold">
          RollerZone Internacional
        </p>
        <h1 className="font-display mt-2 text-4xl tracking-widest md:text-5xl">
          Elige tu país
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          La misma marca, cobertura local. Noticias, eventos, patinadores y clubes de cada país.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {COUNTRY_LIST.map((c) => (
          <Link
            key={c.slug}
            to="/$country"
            params={{ country: c.slug }}
            className="group relative overflow-hidden rounded-xl border border-border bg-surface p-6 transition-all hover:-translate-y-1 hover:border-gold hover:shadow-[0_15px_40px_-10px_rgba(212,160,23,0.4)]"
          >
            <div
              className="absolute inset-x-0 top-0 h-1.5"
              style={{
                background: `linear-gradient(90deg, ${c.accents.c1}, ${c.accents.c2}, ${c.accents.c3})`,
              }}
            />
            <div className="flex items-center gap-4">
              <div className="text-5xl">{c.emoji}</div>
              <div>
                <div className="font-condensed text-[11px] font-bold uppercase tracking-widest text-gold">
                  RollerZone
                </div>
                <div className="font-display text-2xl tracking-widest">{c.name}</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Entra a la edición de {c.name}: actualidad, calendario y patinadores destacados.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
              Entrar →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
