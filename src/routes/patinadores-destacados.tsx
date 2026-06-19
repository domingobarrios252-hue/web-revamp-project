import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, MapPin, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/patinadores-destacados")({
  head: () => ({
    meta: [
      { title: "Patinadores Destacados — RollerZone" },
      {
        name: "description",
        content:
          "Los patinadores de velocidad más destacados del momento. Perfiles, palmarés, marcas y trayectoria de las figuras del patinaje.",
      },
      { property: "og:title", content: "Patinadores Destacados — RollerZone" },
      {
        property: "og:description",
        content:
          "Descubre a las figuras destacadas del patinaje de velocidad: España, Colombia y más.",
      },
    ],
  }),
  component: FeaturedSkatersPage,
});

type FeaturedSkater = {
  id: string;
  slug: string;
  full_name: string;
  photo_url: string | null;
  category: string | null;
  gender: string | null;
  specialty: string | null;
  province: string | null;
  birth_year: number | null;
  country_code: string;
  total_points: number;
  clubs?: { name: string; slug: string } | null;
};

const COUNTRY_LABELS: Record<string, string> = {
  es: "España",
  co: "Colombia",
  ec: "Ecuador",
  ve: "Venezuela",
};

function FeaturedSkatersPage() {
  const [skaters, setSkaters] = useState<FeaturedSkater[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("skaters")
      .select(
        "id, slug, full_name, photo_url, category, gender, specialty, province, birth_year, country_code, total_points, clubs(name, slug)",
      )
      .eq("featured", true)
      .eq("published", true)
      .eq("active", true)
      .order("total_points", { ascending: false })
      .then(({ data }) => {
        setSkaters((data as unknown as FeaturedSkater[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-[60vh] bg-[#111]">
      <div className="border-b border-[#2A2A2A] bg-gradient-to-b from-[#1A1A1A] to-[#111]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-12">
          <div className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">
            <Star className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
            Vitrina RollerZone
          </div>
          <h1 className="mt-2 font-display text-4xl md:text-6xl font-black uppercase text-[#F5F5F5]">
            Patinadores Destacados
          </h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-[#B5B5B5]">
            Las figuras del patinaje de velocidad que marcan la actualidad. Selección curada por el
            equipo editorial de RollerZone.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
        {loading ? (
          <p className="text-sm text-[#888]">Cargando patinadores destacados…</p>
        ) : skaters.length === 0 ? (
          <p className="text-sm text-[#888]">
            Aún no hay patinadores destacados. Vuelve pronto.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {skaters.map((s) => {
              const age = s.birth_year ? new Date().getFullYear() - s.birth_year : null;
              return (
                <Link
                  key={s.id}
                  to="/hub/$country/patinadores/$slug"
                  params={{ country: s.country_code, slug: s.slug }}
                  className="group block overflow-hidden rounded-[10px] border border-[#333] bg-[#1A1A1A] hover:border-[#D4A017] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(212,160,23,0.4)]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#0d0d0d]">
                    {s.photo_url ? (
                      <img
                        src={s.photo_url}
                        alt={s.full_name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#333] font-display text-6xl font-black">
                        {s.full_name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
                    <div className="absolute top-2 right-2 rounded-[3px] bg-[#D4A017] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#111]">
                      Destacado
                    </div>
                    <div className="absolute top-2 left-2 rounded-[3px] bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#F5F5F5]">
                      {COUNTRY_LABELS[s.country_code] ?? s.country_code.toUpperCase()}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <h3 className="font-display text-lg font-black uppercase text-white leading-tight">
                        {s.full_name}
                      </h3>
                      {s.clubs && (
                        <div className="text-[11px] uppercase tracking-widest text-[#D4A017]">
                          {s.clubs.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-3 space-y-1 text-xs text-[#B5B5B5]">
                    <div className="flex justify-between">
                      <span>
                        {[s.category, s.gender === "F" ? "Femenino" : s.gender === "M" ? "Masculino" : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      {age && <span className="text-[#888]">{age} años</span>}
                    </div>
                    {s.specialty && (
                      <div className="flex items-center gap-1 text-[#888]">
                        <Trophy className="h-3 w-3" /> {s.specialty}
                      </div>
                    )}
                    {s.province && (
                      <div className="flex items-center gap-1 text-[#888]">
                        <MapPin className="h-3 w-3" /> {s.province}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
