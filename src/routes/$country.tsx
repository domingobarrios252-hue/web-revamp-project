import { createFileRoute, Outlet, Link, notFound, useParams } from "@tanstack/react-router";
import { getCountryBySlug, COUNTRY_LIST, type CountryInfo } from "@/lib/countries";

export const Route = createFileRoute("/$country")({
  beforeLoad: ({ params }) => {
    const c = getCountryBySlug(params.country);
    if (!c) throw notFound();
    return { country: c };
  },
  loader: ({ context }) => ({ country: (context as { country: CountryInfo }).country }),
  head: ({ params }) => {
    const c = getCountryBySlug(params.country);
    const name = c?.name ?? "RollerZone";
    return {
      meta: [
        { title: `RollerZone ${name} — Patinaje de velocidad` },
        {
          name: "description",
          content: `Cobertura local de RollerZone en ${name}: noticias, eventos, patinadores y clubes.`,
        },
        { property: "og:title", content: `RollerZone ${name}` },
        {
          property: "og:description",
          content: `Patinaje de velocidad en ${name}: noticias, calendario, clubes y patinadores.`,
        },
        {
          property: "og:url",
          content: `https://rollerzone.lovable.app/${params.country}`,
        },
      ],
      links: [
        {
          rel: "canonical",
          href: `https://rollerzone.lovable.app/${params.country}`,
        },
      ],
    };
  },
  component: CountryLayout,
});

const SUB_NAV = [
  { label: "Inicio", to: "" },
  { label: "Noticias", to: "noticias" },
  { label: "Eventos", to: "eventos" },
  { label: "Calendario", to: "calendario" },
  { label: "Entrevistas", to: "entrevistas" },
  { label: "Clubes", to: "clubes" },
  { label: "Patinadores", to: "atletas" },
  { label: "Galería", to: "galeria" },
] as const;

function CountryLayout() {
  const { country: countrySlug } = useParams({ from: "/$country" });
  const c = getCountryBySlug(countrySlug)!;

  return (
    <div>
      {/* Country accent band */}
      <div
        className="h-1.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${c.accents.c1}, ${c.accents.c2}, ${c.accents.c3})`,
        }}
      />

      {/* Country bar */}
      <div className="border-b border-border bg-surface/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>
              {c.emoji}
            </span>
            <div className="leading-tight">
              <div className="font-condensed text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
                RollerZone
              </div>
              <div className="font-display text-lg tracking-widest">{c.name}</div>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {SUB_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to ? `/$country/${item.to}` as "/$country/noticias" : "/$country"}
                params={{ country: c.slug }}
                activeOptions={{ exact: item.to === "" }}
                className="font-condensed text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-gold"
                activeProps={{ className: "text-gold" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {COUNTRY_LIST.filter((x) => x.slug !== c.slug).map((other) => (
              <Link
                key={other.slug}
                to="/$country"
                params={{ country: other.slug }}
                className="inline-flex h-7 items-center gap-1 rounded border border-border px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
                title={`Cambiar a ${other.name}`}
              >
                <span aria-hidden>{other.emoji}</span> {other.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Outlet />
    </div>
  );
}
