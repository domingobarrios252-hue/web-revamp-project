import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, Users, MapPin, Trophy } from "lucide-react";
import { useRegion } from "@/lib/hub/useRegion";

export const Route = createFileRoute("/hub/$country/regiones/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.code} · Comunidad · Hub España · RollerZone` },
      { name: "description", content: `Federación, clubes y patinadores de la comunidad ${params.code} en RollerZone.` },
    ],
  }),
  component: RegionPage,
});

function RegionPage() {
  const { country, code } = Route.useParams();
  const { region, federation, clubs, skaters, loading } = useRegion(country, code);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-sm text-[#888]">Cargando comunidad…</div>;
  }
  if (!region) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-[#F5F5F5]">Comunidad no encontrada.</p>
        <Link to="/hub/$country" params={{ country }} className="mt-4 inline-block text-sm text-[#D4A017] hover:underline">
          ← Volver al hub
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#111]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <Link
          to="/hub/$country"
          params={{ country }}
          className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[#D4A017] hover:underline"
        >
          <ArrowLeft className="h-3 w-3" /> Hub España
        </Link>
        <header className="mt-3 flex items-center gap-3">
          <span className="rounded-[4px] border border-[#D4A017] px-2 py-1 font-display text-sm font-black text-[#D4A017]">{region.code}</span>
          <h1 className="font-display text-3xl md:text-5xl font-black uppercase text-[#F5F5F5]">
            {region.name}
          </h1>
        </header>
        <p className="mt-2 max-w-2xl text-sm text-[#B5B5B5]">
          Toda la actividad de RollerZone en {region.name}: federación, clubes y patinadores.
        </p>

        {/* Federación */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#D4A017]" /> Federación
          </h2>
          {federation ? (
            <Link
              to="/hub/$country/federaciones/$slug"
              params={{ country, slug: federation.slug }}
              className="flex items-center gap-4 rounded-[8px] border border-[#333] bg-[#1A1A1A] p-4 hover:border-[#D4A017]"
            >
              <div className="h-16 w-16 shrink-0 rounded-[6px] border border-[#333] bg-[#0d0d0d] flex items-center justify-center">
                {federation.logo_url ? (
                  <img src={federation.logo_url} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <Building2 className="h-8 w-8 text-[#D4A017]" />
                )}
              </div>
              <div>
                <div className="font-display text-lg font-black uppercase text-[#F5F5F5]">
                  {federation.short_name ?? federation.name}
                </div>
                {federation.short_name && <div className="text-sm text-[#888]">{federation.name}</div>}
              </div>
            </Link>
          ) : (
            <p className="rounded-[6px] border border-[#333] bg-[#1A1A1A] px-4 py-3 text-sm text-[#888]">
              Sin federación registrada en esta comunidad todavía.
            </p>
          )}
        </section>

        {/* Clubes */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-3 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#D4A017]" /> Clubes ({clubs.length})
          </h2>
          {clubs.length === 0 ? (
            <p className="rounded-[6px] border border-[#333] bg-[#1A1A1A] px-4 py-3 text-sm text-[#888]">
              Aún no hay clubes registrados aquí.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clubs.map((c) => (
                <Link
                  key={c.id}
                  to="/hub/$country/clubes/$slug"
                  params={{ country, slug: c.slug }}
                  className="group flex gap-3 rounded-[8px] border border-[#333] bg-[#1A1A1A] p-3 hover:border-[#D4A017]"
                >
                  <div className="h-12 w-12 shrink-0 rounded-[6px] border border-[#333] bg-[#0d0d0d] flex items-center justify-center">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt="" className="h-full w-full object-contain p-1" />
                    ) : (
                      <Building2 className="h-6 w-6 text-[#D4A017]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-sm font-black uppercase text-[#F5F5F5] group-hover:text-[#D4A017] truncate">
                      {c.name}
                    </div>
                    {c.city && (
                      <div className="text-[10px] uppercase tracking-widest text-[#888] inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {c.city}
                      </div>
                    )}
                    {c.school_type && (
                      <div className="text-[10px] text-[#B5B5B5] mt-1">{c.school_type}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Patinadores */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#D4A017]" /> Patinadores ({skaters.length})
          </h2>
          {skaters.length === 0 ? (
            <p className="rounded-[6px] border border-[#333] bg-[#1A1A1A] px-4 py-3 text-sm text-[#888]">
              Sin patinadores activos registrados en esta comunidad.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {skaters.map((s) => (
                <Link
                  key={s.id}
                  to="/hub/$country/patinadores/$slug"
                  params={{ country, slug: s.slug }}
                  className="group flex gap-3 rounded-[8px] border border-[#333] bg-[#1A1A1A] p-3 hover:border-[#D4A017]"
                >
                  <div className="h-12 w-12 shrink-0 rounded-[6px] border border-[#333] bg-[#0d0d0d] overflow-hidden flex items-center justify-center">
                    {s.photo_url ? (
                      <img src={s.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Users className="h-6 w-6 text-[#D4A017]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-sm font-black uppercase text-[#F5F5F5] group-hover:text-[#D4A017] truncate">
                      {s.full_name}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-[#888]">
                      {[s.category, s.gender === "F" ? "Fem" : s.gender === "M" ? "Masc" : null].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
