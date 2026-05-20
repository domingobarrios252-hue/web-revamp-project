import { Link } from "@tanstack/react-router";
import { Building2, MapPin } from "lucide-react";
import { useFederations } from "@/lib/hub/useFederations";
import { SpainMap } from "@/components/hub/SpainMap";

export function FederationsDirectory({ country }: { country: string }) {
  const { federations, loading } = useFederations(country);
  const nacional = federations.filter((f) => f.type === "nacional");
  const autonomicas = federations.filter((f) => f.type === "autonomica");

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      <header className="mb-8">
        <div className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">
          Hub España
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-black uppercase text-[#F5F5F5]">
          Federaciones
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#B5B5B5]">
          Organismos rectores del patinaje en España: Real Federación Española y federaciones autonómicas.
        </p>
      </header>

      {country === "es" && (
        <div className="mb-8">
          <SpainMap country={country} />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[#888]">Cargando federaciones…</p>
      ) : (
        <>
          {nacional.length > 0 && (
            <section className="mb-10">
              <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-4">
                Federación Nacional
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {nacional.map((f) => (
                  <FederationCard key={f.id} federation={f} country={country} large />
                ))}
              </div>
            </section>
          )}
          {autonomicas.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-4">
                Federaciones Autonómicas ({autonomicas.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {autonomicas.map((f) => (
                  <FederationCard key={f.id} federation={f} country={country} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function FederationCard({
  federation,
  country,
  large,
}: {
  federation: { id: string; name: string; slug: string; short_name: string | null; region_name: string | null; city: string | null; logo_url: string | null; description: string | null };
  country: string;
  large?: boolean;
}) {
  return (
    <Link
      to="/hub/$country/federaciones/$slug"
      params={{ country, slug: federation.slug }}
      className={`group flex gap-3 rounded-[8px] border border-[#333] bg-[#1A1A1A] hover:border-[#D4A017] transition-colors ${large ? "p-5" : "p-3"}`}
    >
      <div className={`shrink-0 rounded-[6px] border border-[#333] bg-[#0d0d0d] flex items-center justify-center ${large ? "h-16 w-16" : "h-12 w-12"}`}>
        {federation.logo_url ? (
          <img src={federation.logo_url} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <Building2 className={`text-[#D4A017] ${large ? "h-8 w-8" : "h-6 w-6"}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`font-display font-black uppercase text-[#F5F5F5] group-hover:text-[#D4A017] leading-tight ${large ? "text-lg" : "text-sm"}`}>
          {federation.short_name ?? federation.name}
        </h3>
        {federation.short_name && (
          <p className={`text-[#888] truncate ${large ? "text-sm" : "text-[11px]"}`}>{federation.name}</p>
        )}
        <div className={`mt-1 flex items-center gap-1 text-[#B5B5B5] ${large ? "text-xs" : "text-[10px] uppercase tracking-widest"}`}>
          <MapPin className="h-3 w-3" />
          {federation.region_name ?? federation.city}
        </div>
        {large && federation.description && (
          <p className="mt-2 text-xs text-[#B5B5B5] line-clamp-2">{federation.description}</p>
        )}
      </div>
    </Link>
  );
}
