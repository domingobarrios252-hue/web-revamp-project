import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Award, Crown, Trophy, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/salon-de-la-fama/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} · Salón de la Fama · RollerZone` },
      {
        name: "description",
        content: `Perfil de leyenda en el Salón de la Fama de RollerZone — ${params.slug.replace(/-/g, " ")}.`,
      },
    ],
  }),
  component: LegendProfilePage,
});

type AchievementCategory =
  | "mundial"
  | "europeo"
  | "nacional"
  | "campeonato-mundial"
  | "premio-individual"
  | "maraton-internacional"
  | "world-inline-cup"
  | "otro";

type Legend = {
  id: string;
  slug: string;
  full_name: string;
  nickname: string | null;
  photo_url: string | null;
  cover_url: string | null;
  country_code: string;
  birth_year: number | null;
  birth_date: string | null;
  birth_place: string | null;
  death_year: number | null;
  induction_year: number | null;
  specialty: string | null;
  club: string | null;
  nationality: string | null;
  national_team: string | null;
  career_years: string | null;
  bio: string | null;
  achievements: Array<{ year?: number; title: string; description?: string; category?: AchievementCategory }>;
  highlights: string[];
  gallery: string[];
  clubs_history: Array<{ name: string; years?: string }>;
  social: { instagram?: string; twitter?: string; facebook?: string; youtube?: string };
};

const CAT_LABEL: Record<string, string> = {
  "campeonato-mundial": "Campeonato Mundial",
  mundial: "Mundial",
  europeo: "Europeo",
  nacional: "Nacional",
  "premio-individual": "Premio individual",
  "maraton-internacional": "Maratón internacional",
  "world-inline-cup": "World Inline Cup",
  otro: "Otro",
};
const CAT_ORDER = [
  "campeonato-mundial",
  "mundial",
  "europeo",
  "nacional",
  "premio-individual",
  "maraton-internacional",
  "world-inline-cup",
  "otro",
] as const;

function LegendProfilePage() {
  const { slug } = Route.useParams();
  const [legend, setLegend] = useState<Legend | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [catFilter, setCatFilter] = useState<"todos" | AchievementCategory>("todos");

  const availableCats = useMemo(() => {
    if (!legend?.achievements?.length) return [] as string[];
    const set = new Set<string>();
    legend.achievements.forEach((a) => set.add(a.category ?? "otro"));
    return CAT_ORDER.filter((c) => set.has(c));
  }, [legend]);

  const filteredAchievements = useMemo(() => {
    if (!legend?.achievements) return [];
    if (catFilter === "todos") return legend.achievements;
    return legend.achievements.filter((a) => (a.category ?? "otro") === catFilter);
  }, [legend, catFilter]);

  useEffect(() => {
    supabase
      .from("hall_of_fame")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setNotFoundFlag(true);
        else setLegend(data as unknown as Legend);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-[#888]">
        Cargando perfil…
      </div>
    );
  }
  if (notFoundFlag || !legend) {
    throw notFound();
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c]">
      <div className="relative overflow-hidden border-b border-[#2A2A2A]">
        {legend.cover_url && (
          <div className="absolute inset-0">
            <img loading="lazy" decoding="async"
              src={legend.cover_url}
              alt=""
              className="h-full w-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/80 to-transparent" />
          </div>
        )}
        <div className="relative mx-auto max-w-6xl px-4 md:px-6 py-10">
          <Link
            to="/salon-de-la-fama"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#D4A017] hover:text-[#F5F5F5]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Salón de la Fama
          </Link>

          <div className="mt-6 grid gap-6 md:grid-cols-[260px_1fr] items-end">
            <div className="overflow-hidden rounded-[10px] border-2 border-[#D4A017] bg-[#1a1610] aspect-[4/5]">
              {legend.photo_url ? (
                <img loading="lazy" decoding="async"
                  src={legend.photo_url}
                  alt={legend.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#3a2e0d] font-display text-7xl font-black">
                  {legend.full_name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">
                <Crown className="h-4 w-4" /> Leyenda del Patinaje
                {legend.induction_year && <span>· Inducción {legend.induction_year}</span>}
              </div>
              <h1 className="mt-2 font-display text-4xl md:text-6xl font-black uppercase text-[#F5F5F5]">
                {legend.full_name}
              </h1>
              {legend.nickname && (
                <div className="mt-1 font-display text-lg md:text-xl italic text-[#D4A017]">
                  {legend.nickname}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#B5B5B5]">
                {legend.nationality && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#D4A017]" /> {legend.nationality}
                  </span>
                )}
                {legend.specialty && (
                  <span className="inline-flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5 text-[#D4A017]" /> {legend.specialty}
                  </span>
                )}
                {legend.club && <span>· {legend.club}</span>}
                {legend.career_years && <span className="text-[#888]">· {legend.career_years}</span>}
                {!legend.career_years && (legend.birth_year || legend.death_year) && (
                  <span className="text-[#888]">
                    {legend.birth_year ?? "?"}
                    {legend.death_year ? ` — ${legend.death_year}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 grid gap-10 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          {legend.bio && (
            <section>
              <h2 className="font-display text-2xl font-black uppercase text-[#F5F5F5] mb-3">
                Biografía
              </h2>
              <div className="prose prose-invert max-w-none text-[#B5B5B5] whitespace-pre-line">
                {legend.bio}
              </div>
            </section>
          )}

          {legend.achievements?.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-black uppercase text-[#F5F5F5] mb-3">
                Palmarés
              </h2>
              {availableCats.length > 1 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {(["todos", ...availableCats] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCatFilter(c as typeof catFilter)}
                      className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest rounded border transition ${
                        catFilter === c
                          ? "border-[#D4A017] bg-[#D4A017]/20 text-[#D4A017]"
                          : "border-[#2a2a2a] text-[#888] hover:text-[#F5F5F5]"
                      }`}
                    >
                      {c === "todos" ? "Todos" : CAT_LABEL[c]}
                    </button>
                  ))}
                </div>
              )}
              <ul className="space-y-2">
                {filteredAchievements.map((a, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-[6px] border border-[#2a2a2a] bg-[#161616] p-3"
                  >
                    <Award className="h-5 w-5 text-[#D4A017] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {a.year && (
                          <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4A017]">
                            {a.year}
                          </span>
                        )}
                        {a.category && (
                          <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border border-[#3a2e0d] bg-[#1a1610] text-[#D4A017]">
                            {CAT_LABEL[a.category]}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-[#F5F5F5] mt-0.5">{a.title}</div>
                      {a.description && (
                        <div className="text-xs text-[#888] mt-0.5">{a.description}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {legend.gallery?.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-black uppercase text-[#F5F5F5] mb-3">
                Galería
              </h2>
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                {legend.gallery.map((url, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-[6px] border border-[#2a2a2a]">
                    <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          {(legend.nickname || legend.birth_date || legend.birth_place || legend.national_team || legend.career_years || legend.induction_year) && (
            <div className="rounded-[8px] border border-[#2a2a2a] bg-[#161616] p-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[#D4A017] mb-3">
                Ficha personal
              </h3>
              <dl className="space-y-2 text-sm">
                {legend.nickname && (
                  <div className="flex justify-between gap-3 border-b border-[#2a2a2a] pb-1.5">
                    <dt className="text-[11px] uppercase tracking-widest text-[#888]">Apodo</dt>
                    <dd className="text-[#F5F5F5] text-right">{legend.nickname}</dd>
                  </div>
                )}
                {legend.birth_date && (
                  <div className="flex justify-between gap-3 border-b border-[#2a2a2a] pb-1.5">
                    <dt className="text-[11px] uppercase tracking-widest text-[#888]">Nacimiento</dt>
                    <dd className="text-[#F5F5F5] text-right">{new Date(legend.birth_date + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</dd>
                  </div>
                )}
                {legend.birth_place && (
                  <div className="flex justify-between gap-3 border-b border-[#2a2a2a] pb-1.5">
                    <dt className="text-[11px] uppercase tracking-widest text-[#888]">Lugar</dt>
                    <dd className="text-[#F5F5F5] text-right">{legend.birth_place}</dd>
                  </div>
                )}
                {legend.national_team && (
                  <div className="flex justify-between gap-3 border-b border-[#2a2a2a] pb-1.5">
                    <dt className="text-[11px] uppercase tracking-widest text-[#888]">Selección</dt>
                    <dd className="text-[#F5F5F5] text-right">{legend.national_team}</dd>
                  </div>
                )}
                {legend.career_years && (
                  <div className="flex justify-between gap-3 border-b border-[#2a2a2a] pb-1.5">
                    <dt className="text-[11px] uppercase tracking-widest text-[#888]">Trayectoria</dt>
                    <dd className="text-[#F5F5F5] text-right">{legend.career_years}</dd>
                  </div>
                )}
                {legend.induction_year && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-[11px] uppercase tracking-widest text-[#888]">Inducción</dt>
                    <dd className="text-[#D4A017] font-semibold text-right">{legend.induction_year}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {legend.highlights?.length > 0 && (
            <div className="rounded-[8px] border border-[#3a2e0d] bg-[#1a1610] p-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[#D4A017] mb-3">
                Datos destacados
              </h3>
              <ul className="space-y-2 text-sm text-[#B5B5B5]">
                {legend.highlights.map((h, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[#D4A017]">▸</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {legend.clubs_history?.length > 0 && (
            <div className="rounded-[8px] border border-[#2a2a2a] bg-[#161616] p-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[#D4A017] mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" /> Trayectoria por clubes
              </h3>
              <ul className="space-y-2 text-sm">
                {legend.clubs_history.map((c, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 border-b border-[#2a2a2a] pb-1.5 last:border-0">
                    <span className="text-[#F5F5F5] font-semibold">{c.name}</span>
                    {c.years && <span className="text-[11px] text-[#888] whitespace-nowrap">{c.years}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
