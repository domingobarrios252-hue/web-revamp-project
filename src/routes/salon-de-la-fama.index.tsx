import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/salon-de-la-fama/")({
  head: () => ({
    meta: [
      { title: "Salón de la Fama — Leyendas del Patinaje · RollerZone" },
      {
        name: "description",
        content:
          "Las leyendas del patinaje de velocidad. Trayectorias, palmarés y biografías de los grandes nombres que marcaron la historia.",
      },
      {
        property: "og:title",
        content: "Salón de la Fama — Leyendas del Patinaje · RollerZone",
      },
      {
        property: "og:description",
        content:
          "Homenaje a las leyendas del patinaje de velocidad. Conoce sus logros y su huella en el deporte.",
      },
    ],
  }),
  component: HallOfFamePage,
});

type Legend = {
  id: string;
  slug: string;
  full_name: string;
  photo_url: string | null;
  country_code: string;
  birth_year: number | null;
  death_year: number | null;
  induction_year: number | null;
  specialty: string | null;
  club: string | null;
  nationality: string | null;
};

const COUNTRY_LABELS: Record<string, string> = {
  es: "España",
  co: "Colombia",
  ec: "Ecuador",
  ve: "Venezuela",
  it: "Italia",
  us: "USA",
};

function HallOfFamePage() {
  const [legends, setLegends] = useState<Legend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("hall_of_fame")
      .select(
        "id, slug, full_name, photo_url, country_code, birth_year, death_year, induction_year, specialty, club, nationality",
      )
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("induction_year", { ascending: false })
      .then(({ data }) => {
        setLegends((data as unknown as Legend[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-[60vh] bg-[#0c0c0c]">
      <div className="relative overflow-hidden border-b border-[#2A2A2A]">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #D4A017 0%, transparent 40%), radial-gradient(circle at 80% 60%, #8B6914 0%, transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-14">
          <div className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4A017] flex items-center gap-1.5">
            <Crown className="h-4 w-4" /> Hall of Fame
          </div>
          <h1 className="mt-2 font-display text-4xl md:text-6xl font-black uppercase text-[#F5F5F5]">
            Salón de la Fama
          </h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-[#B5B5B5]">
            Homenaje a las leyendas del patinaje de velocidad. Atletas que marcaron una época y
            cuyo legado sigue inspirando a las nuevas generaciones.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
        {loading ? (
          <p className="text-sm text-[#888]">Cargando leyendas…</p>
        ) : legends.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-[#333] bg-[#161616] p-10 text-center">
            <Award className="mx-auto h-10 w-10 text-[#D4A017] opacity-60" />
            <h2 className="mt-3 font-display text-2xl font-bold uppercase text-[#F5F5F5]">
              Próximamente
            </h2>
            <p className="mt-2 text-sm text-[#888] max-w-md mx-auto">
              Estamos preparando los perfiles de las grandes leyendas del patinaje. Vuelve pronto.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {legends.map((l) => (
              <Link
                key={l.id}
                to="/salon-de-la-fama/$slug"
                params={{ slug: l.slug }}
                className="group block overflow-hidden rounded-[10px] border border-[#3a2e0d] bg-gradient-to-b from-[#1a1610] to-[#0f0d08] hover:border-[#D4A017] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(212,160,23,0.5)]"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#0a0a0a]">
                  {l.photo_url ? (
                    <img
                      src={l.photo_url}
                      alt={l.full_name}
                      className="h-full w-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#3a2e0d] font-display text-7xl font-black">
                      {l.full_name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  {l.induction_year && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-[3px] bg-[#D4A017] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#111]">
                      <Crown className="h-3 w-3" /> {l.induction_year}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <h3 className="font-display text-xl font-black uppercase text-white leading-tight">
                      {l.full_name}
                    </h3>
                    <div className="mt-1 text-[11px] uppercase tracking-widest text-[#D4A017]">
                      {l.nationality ?? COUNTRY_LABELS[l.country_code] ?? l.country_code.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="p-3 space-y-1 text-xs text-[#B5B5B5]">
                  {l.specialty && <div className="text-[#D4A017]">{l.specialty}</div>}
                  {l.club && <div className="text-[#888] truncate">{l.club}</div>}
                  {(l.birth_year || l.death_year) && (
                    <div className="text-[#666]">
                      {l.birth_year ?? "?"}
                      {l.death_year ? ` — ${l.death_year}` : ""}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
