import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Trophy, Star, Sparkles, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

type Season = { id: string; year: number; label: string; is_current: boolean };
type Award = {
  id: string;
  season_id: string;
  tier: "elite" | "estrella" | "promesa";
  gender: "masculino" | "femenino";
  position: number;
  full_name: string;
  photo_url: string | null;
  club: string | null;
  region: string | null;
  category_age: string | null;
  merit: string | null;
};

const TIERS: { key: Award["tier"]; label: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "elite", label: "Élite", subtitle: "La cúspide del patinaje", icon: Crown },
  { key: "estrella", label: "Estrella", subtitle: "Brillan con luz propia", icon: Sparkles },
  { key: "promesa", label: "Promesa", subtitle: "El futuro del patinaje", icon: Star },
];

const searchSchema = z.object({
  temporada: z.coerce.number().int().min(1900).max(2100).optional(),
});

export const Route = createFileRoute("/premios-mvp")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => {
    const ogImage = "https://rollerzonenews.lovable.app/api/og/premios-mvp.svg";
    return {
      meta: [
        { title: "Premios MVP — RollerZone" },
        { name: "description", content: "Premios MVP del patinaje de velocidad: Élite, Estrella y Promesa, masculino y femenino. Un ganador por categoría y temporada." },
        { property: "og:title", content: "Premios MVP — RollerZone" },
        { property: "og:description", content: "Cuadro de honor MVP por temporada: Élite, Estrella y Promesa." },
        { property: "og:image", content: ogImage },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Premios MVP — RollerZone" },
        { name: "twitter:description", content: "Cuadro de honor MVP por temporada." },
        { name: "twitter:image", content: ogImage },
      ],
    };
  },
  component: PremiosMvpPage,
});

function PremiosMvpPage() {
  const navigate = useNavigate({ from: "/premios-mvp" });
  const search = Route.useSearch();
  const [seasons, setSeasons] = useState<Season[] | null>(null);
  const [awards, setAwards] = useState<Award[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("mvp_seasons")
      .select("id, year, label, is_current")
      .order("year", { ascending: false })
      .then(({ data }) => { if (!cancelled) setSeasons((data as Season[]) ?? []); });
    return () => { cancelled = true; };
  }, []);

  const activeSeason = useMemo(() => {
    if (!seasons || seasons.length === 0) return null;
    if (search.temporada) {
      return seasons.find((s) => s.year === search.temporada) ?? seasons.find((s) => s.is_current) ?? seasons[0];
    }
    return seasons.find((s) => s.is_current) ?? seasons[0];
  }, [seasons, search.temporada]);

  useEffect(() => {
    if (!activeSeason) return;
    let cancelled = false;
    setAwards(null);
    supabase
      .from("mvp_awards")
      .select("id, season_id, tier, gender, position, full_name, photo_url, club, region, category_age, merit")
      .eq("season_id", activeSeason.id)
      .eq("published", true)
      .then(({ data }) => { if (!cancelled) setAwards((data as Award[]) ?? []); });
    return () => { cancelled = true; };
  }, [activeSeason]);

  const byTierGender = useMemo(() => {
    const map = new Map<string, Award>();
    (awards ?? []).forEach((a) => {
      map.set(`${a.tier}:${a.gender}`, a);
    });
    return map;
  }, [awards]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <header className="mb-10 text-center">
        <div className="font-condensed inline-flex items-center gap-2 border border-gold/40 bg-gold/5 px-3 py-1 text-[10px] uppercase tracking-widest text-gold">
          <Trophy className="h-3.5 w-3.5" /> Premios MVP RollerZone
        </div>
        <h1 className="font-display mt-4 text-4xl tracking-widest md:text-6xl">
          Premios <span className="text-gold">MVP</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
          Reconocemos al patinador más destacado de la temporada en tres categorías: Élite, Estrella y Promesa, separados por género.
        </p>

        {seasons && seasons.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="font-condensed text-xs uppercase tracking-widest text-muted-foreground">Temporada:</span>
            <select
              value={activeSeason?.year ?? ""}
              onChange={(e) => navigate({ search: { temporada: Number(e.target.value) } })}
              className="font-condensed border border-border bg-background px-3 py-1.5 text-xs uppercase tracking-widest text-foreground"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.year}>
                  {s.label}{s.is_current ? " · Actual" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {!activeSeason ? (
        <p className="py-20 text-center text-muted-foreground">Aún no hay temporadas configuradas. Pide al admin que añada una desde el panel.</p>
      ) : awards === null ? (
        <div className="space-y-12">
          {TIERS.map((t) => (
            <div key={t.key} className="h-64 animate-pulse bg-surface" />
          ))}
        </div>
      ) : awards.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          Aún no hay premios publicados para {activeSeason.label}.
        </p>
      ) : (
        <div className="space-y-16">
          {TIERS.map((t) => (
            <TierBlock
              key={t.key}
              tier={t}
              masculino={byTierGender.get(`${t.key}:masculino`) ?? null}
              femenino={byTierGender.get(`${t.key}:femenino`) ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TierBlock({
  tier,
  masculino,
  femenino,
}: {
  tier: { key: Award["tier"]; label: string; subtitle: string; icon: React.ComponentType<{ className?: string }> };
  masculino: Award | null;
  femenino: Award | null;
}) {
  const Icon = tier.icon;
  return (
    <section>
      <div className="mb-6 flex items-end justify-between border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <div className="border border-gold/40 bg-gold/5 p-2 text-gold">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl tracking-widest md:text-3xl">
              <span className="text-gold">{tier.label}</span>
            </h2>
            <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">{tier.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <GenderColumn label="Masculino" award={masculino} />
        <GenderColumn label="Femenino" award={femenino} />
      </div>
    </section>
  );
}

function GenderColumn({ label, award }: { label: string; award: Award | null }) {
  return (
    <div>
      <h3 className="font-display mb-4 text-center text-lg tracking-widest text-foreground/90">{label}</h3>
      {!award ? (
        <div className="border border-dashed border-border bg-surface/40 p-12 text-center text-sm text-muted-foreground">
          Aún sin ganador para esta categoría.
        </div>
      ) : (
        <WinnerCard award={award} />
      )}
    </div>
  );
}

function WinnerCard({ award }: { award: Award }) {
  return (
    <article className="relative flex flex-col border border-gold bg-surface p-4">
      <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 border border-gold bg-background px-3 py-1">
        <span className="font-display flex items-center gap-1 text-xs tracking-widest text-gold">
          <Trophy className="h-3.5 w-3.5" /> MVP
        </span>
      </div>

      <div className="relative mt-3 mb-4 aspect-[4/5] overflow-hidden border border-border bg-background">
        {award.photo_url ? (
          <img src={award.photo_url} alt={award.full_name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gold/30">
            <Trophy className="h-16 w-16" />
          </div>
        )}
      </div>

      <h4 className="font-display text-center text-lg leading-tight tracking-wider md:text-xl">
        {award.full_name}
      </h4>
      {award.club && (
        <p className="font-condensed mt-1 text-center text-xs uppercase tracking-widest text-gold">{award.club}</p>
      )}
      {(award.region || award.category_age) && (
        <div className="font-condensed mt-1 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
          {[award.region, award.category_age].filter(Boolean).join(" · ")}
        </div>
      )}
      {award.merit && (
        <p className="mt-3 line-clamp-4 text-center text-sm italic text-foreground/80">«{award.merit}»</p>
      )}
    </article>
  );
}
