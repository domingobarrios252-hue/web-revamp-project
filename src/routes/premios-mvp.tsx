import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Trophy, Award, Medal, Star, Sparkles, Crown } from "lucide-react";
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
  { key: "elite", label: "Élite", subtitle: "La cúspide del podio", icon: Crown },
  { key: "estrella", label: "Estrella", subtitle: "Brillan con luz propia", icon: Sparkles },
  { key: "promesa", label: "Promesa", subtitle: "El futuro del patinaje", icon: Star },
];

const searchSchema = z.object({
  temporada: z.coerce.number().int().min(1900).max(2100).optional(),
});

export const Route = createFileRoute("/premios-mvp")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Premios MVP — RollerZone" },
      { name: "description", content: "Premios MVP del patinaje de velocidad: Élite, Estrella y Promesa, masculino y femenino. Top 3 de cada categoría por temporada." },
      { property: "og:title", content: "Premios MVP — RollerZone" },
      { property: "og:description", content: "Top 3 de cada categoría MVP por temporada." },
    ],
  }),
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
      .order("position", { ascending: true })
      .then(({ data }) => { if (!cancelled) setAwards((data as Award[]) ?? []); });
    return () => { cancelled = true; };
  }, [activeSeason]);

  const byTierGender = useMemo(() => {
    const map = new Map<string, Award[]>();
    (awards ?? []).forEach((a) => {
      const k = `${a.tier}:${a.gender}`;
      const arr = map.get(k) ?? [];
      arr.push(a);
      map.set(k, arr);
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
          Reconocemos a los patinadores más destacados de la temporada en tres categorías: Élite, Estrella y Promesa, separados por género. Top 3 en cada categoría.
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
              masculino={byTierGender.get(`${t.key}:masculino`) ?? []}
              femenino={byTierGender.get(`${t.key}:femenino`) ?? []}
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
  masculino: Award[];
  femenino: Award[];
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

      <div className="grid gap-10 lg:grid-cols-2">
        <GenderColumn label="Masculino" awards={masculino} />
        <GenderColumn label="Femenino" awards={femenino} />
      </div>
    </section>
  );
}

function GenderColumn({ label, awards }: { label: string; awards: Award[] }) {
  // Order: 2nd · 1st · 3rd for podium effect
  const podium = [...awards].sort((a, b) => a.position - b.position);
  const ordered = [
    podium.find((a) => a.position === 2),
    podium.find((a) => a.position === 1),
    podium.find((a) => a.position === 3),
  ];

  return (
    <div>
      <h3 className="font-display mb-4 text-center text-lg tracking-widest text-foreground/90">{label}</h3>
      {awards.length === 0 ? (
        <div className="border border-dashed border-border bg-surface/40 p-8 text-center text-sm text-muted-foreground">
          Aún sin podio para esta categoría.
        </div>
      ) : (
        <div className="grid grid-cols-3 items-end gap-3">
          {ordered.map((a, idx) => {
            const slotPos = [2, 1, 3][idx];
            return a ? (
              <PodiumCard key={a.id} award={a} />
            ) : (
              <EmptySlot key={`empty-${slotPos}`} position={slotPos} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function PodiumCard({ award }: { award: Award }) {
  const isFirst = award.position === 1;
  const isSecond = award.position === 2;
  const isThird = award.position === 3;
  const heightClass = isFirst ? "min-h-[340px]" : isSecond ? "min-h-[300px]" : "min-h-[280px]";
  const ringClass = isFirst ? "border-gold" : isSecond ? "border-gold/60" : "border-gold/40";
  const PositionIcon = isFirst ? Trophy : isSecond ? Award : Medal;

  return (
    <article className={`relative flex flex-col border ${ringClass} bg-surface p-3 ${heightClass}`}>
      <div className={`absolute -top-3 left-1/2 z-10 -translate-x-1/2 border ${ringClass} bg-background px-3 py-1`}>
        <span className={`font-display flex items-center gap-1 text-xs tracking-widest ${isFirst ? "text-gold" : "text-foreground/80"}`}>
          <PositionIcon className="h-3.5 w-3.5" /> {award.position}º
        </span>
      </div>

      <div className={`relative mt-3 mb-3 ${isFirst ? "aspect-square" : "aspect-[4/5]"} overflow-hidden border border-border bg-background`}>
        {award.photo_url ? (
          <img src={award.photo_url} alt={award.full_name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gold/30">
            <Trophy className="h-12 w-12" />
          </div>
        )}
      </div>

      <h4 className={`font-display text-center leading-tight tracking-wider ${isFirst ? "text-base md:text-lg" : "text-sm"}`}>
        {award.full_name}
      </h4>
      {award.club && (
        <p className="font-condensed mt-1 text-center text-[10px] uppercase tracking-widest text-gold">{award.club}</p>
      )}
      <div className="font-condensed mt-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
        {[award.region, award.category_age].filter(Boolean).join(" · ")}
      </div>
      {award.merit && (
        <p className="mt-3 line-clamp-3 text-center text-xs italic text-foreground/70">«{award.merit}»</p>
      )}
    </article>
  );
}

function EmptySlot({ position }: { position: number }) {
  const heightClass = position === 1 ? "min-h-[340px]" : position === 2 ? "min-h-[300px]" : "min-h-[280px]";
  return (
    <div className={`flex flex-col items-center justify-center border border-dashed border-border bg-surface/40 p-3 ${heightClass}`}>
      <span className="font-display text-2xl text-muted-foreground/40">{position}º</span>
      <span className="font-condensed mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">Sin asignar</span>
    </div>
  );
}
