import { Link } from "@tanstack/react-router";
import { Newspaper } from "lucide-react";
import { SectionHeading } from "@/components/home/SectionHeading";
import {
  TerritoryLead,
  TerritoryMasthead,
  TerritoryNewsCard,
} from "@/components/territory/TerritoryCards";
import { UsaZoneNav } from "@/components/territory/UsaZoneNav";
import { MIAMI } from "@/lib/territory/territories";
import { useTerritoryNews, useTerritoryZones } from "@/lib/territory/useTerritory";

/** Página de una zona del hub USA (estado o ciudad). */
export function UsaZonePage({ regionSlug, citySlug }: { regionSlug: string; citySlug?: string }) {
  const { zones, loading: zLoading } = useTerritoryZones(MIAMI.code);
  const region = zones.find((z) => !z.parent_id && z.slug === regionSlug);
  const city = citySlug
    ? zones.find((z) => z.parent_id === region?.id && z.slug === citySlug)
    : undefined;
  const zone = city ?? region;
  const { items, loading } = useTerritoryNews(MIAMI.code, 60, {
    regionId: region?.id ?? "00000000-0000-0000-0000-000000000000",
    cityId: citySlug ? (city?.id ?? "00000000-0000-0000-0000-000000000000") : null,
  });
  const [lead, ...rest] = items;
  const label = city ? `${city.name}, ${region?.name}` : region?.name;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <TerritoryMasthead
        territory={MIAMI}
        subtitle={label ? `Noticias · ${label}` : undefined}
      />
      <UsaZoneNav zones={zones} regionSlug={regionSlug} citySlug={citySlug} />

      {zLoading || (zone && loading) ? (
        <p className="mt-10 text-muted-foreground">Cargando…</p>
      ) : !zone ? (
        <div className="mt-8 border border-border bg-surface p-8 text-center text-muted-foreground">
          Esta zona no existe.{" "}
          <Link to="/usa" className="text-gold underline">
            Volver a USA
          </Link>
        </div>
      ) : !lead ? (
        <div className="mt-8 border border-border bg-surface p-8 text-center text-muted-foreground">
          Aún no hay noticias publicadas en {zone.name}. Muy pronto.
        </div>
      ) : (
        <>
          <section className="mt-8">
            <TerritoryLead item={lead} territory={MIAMI} />
          </section>
          {rest.length > 0 && (
            <section className="mt-14">
              <SectionHeading
                kicker={zone.name}
                icon={<Newspaper className="h-3.5 w-3.5" />}
                title="ÚLTIMAS"
                accent="NOTICIAS"
              />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((n) => (
                  <TerritoryNewsCard key={n.id} item={n} territory={MIAMI} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export const zoneTitle = (slug: string) =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
