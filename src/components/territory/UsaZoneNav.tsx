import { Link } from "@tanstack/react-router";
import type { TerritoryZone } from "@/lib/territory/useTerritory";

/**
 * Navegación interna del hub USA: Todas · <estados> · <ciudades del estado activo>.
 * Se genera a partir de territory_zones, así nuevas zonas aparecen solas.
 */
export function UsaZoneNav({
  zones,
  regionSlug,
  citySlug,
}: {
  zones: TerritoryZone[];
  regionSlug?: string;
  citySlug?: string;
}) {
  const regions = zones.filter((z) => !z.parent_id);
  const base =
    "font-condensed inline-flex min-h-[44px] items-center border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors";
  const on = "border-gold bg-gold text-background";
  const off = "border-border text-muted-foreground hover:border-gold hover:text-gold";

  return (
    <nav aria-label="Zonas de USA" className="mt-6 flex flex-wrap gap-2">
      <Link to="/usa" className={`${base} ${!regionSlug ? on : off}`}>
        Todas
      </Link>
      {regions.map((r) => {
        const cities = zones.filter((c) => c.parent_id === r.id);
        return [
          <Link
            key={r.id}
            to="/usa/$region"
            params={{ region: r.slug }}
            className={`${base} ${regionSlug === r.slug && !citySlug ? on : off}`}
          >
            {r.name}
          </Link>,
          ...cities.map((c) => (
            <Link
              key={c.id}
              to="/usa/$region/$city"
              params={{ region: r.slug, city: c.slug }}
              className={`${base} ${citySlug === c.slug && regionSlug === r.slug ? on : off}`}
            >
              {c.name}
            </Link>
          )),
        ];
      })}
    </nav>
  );
}
