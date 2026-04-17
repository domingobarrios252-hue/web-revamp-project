import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Sponsor = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  tier: string;
};

export const Route = createFileRoute("/patrocinadores")({
  head: () => ({
    meta: [
      { title: "Patrocinadores — RollerZone" },
      { name: "description", content: "Marcas y patrocinadores que hacen posible RollerZone." },
      { property: "og:title", content: "Patrocinadores — RollerZone" },
      { property: "og:description", content: "Marcas que apoyan al patinaje de velocidad." },
    ],
  }),
  component: SponsorsPage,
});

function PatrocinadorCard({ s }: { s: Sponsor }) {
  const Wrapper = s.website_url
    ? ({ children }: { children: React.ReactNode }) => (
        <a href={s.website_url!} target="_blank" rel="noopener noreferrer" className="group block">
          {children}
        </a>
      )
    : ({ children }: { children: React.ReactNode }) => <div className="block">{children}</div>;

  return (
    <Wrapper>
      <div className="flex flex-col border border-border bg-surface transition-colors hover:border-gold">
        {/* Logo zone — formato 500x200 (ratio 5:2) */}
        <div className="flex aspect-[5/2] items-center justify-center bg-white p-6">
          {s.logo_url ? (
            <img src={s.logo_url} alt={s.name} loading="lazy" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="font-display text-xl tracking-widest text-muted-foreground">{s.name}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border p-3">
          <div>
            <div className="font-display text-sm tracking-wide">{s.name}</div>
            {s.description && <div className="line-clamp-1 text-xs text-muted-foreground">{s.description}</div>}
          </div>
          {s.website_url && <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-gold" />}
        </div>
      </div>
    </Wrapper>
  );
}

function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("sponsors")
      .select("id, name, slug, description, logo_url, website_url, tier")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .limit(200)
      .then(({ data }) => {
        if (!cancelled) setSponsors((data as Sponsor[]) ?? []);
      });
    return () => { cancelled = true; };
  }, []);

  const principal = (sponsors ?? []).filter((s) => s.tier === "principal" || s.tier === "platino");
  const standard = (sponsors ?? []).filter((s) => s.tier !== "principal" && s.tier !== "platino");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8 flex items-center gap-3 border-b border-border pb-4">
        <Heart className="h-7 w-7 text-gold" />
        <h1 className="font-display text-3xl tracking-widest">PATROCINADORES</h1>
      </div>
      <p className="mb-8 max-w-2xl text-sm text-muted-foreground">
        Estas son las marcas que apoyan a RollerZone y al patinaje de velocidad. Logos en formato 500×200 px.
      </p>

      {sponsors === null ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : sponsors.length === 0 ? (
        <p className="text-muted-foreground">Aún no hay patrocinadores publicados.</p>
      ) : (
        <>
          {principal.length > 0 && (
            <div className="mb-10">
              <h2 className="font-display mb-4 text-lg tracking-widest text-gold">Principales</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {principal.map((s) => (<PatrocinadorCard key={s.id} s={s} />))}
              </div>
            </div>
          )}
          {standard.length > 0 && (
            <div>
              {principal.length > 0 && <h2 className="font-display mb-4 text-lg tracking-widest text-gold">Colaboradores</h2>}
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {standard.map((s) => (<PatrocinadorCard key={s.id} s={s} />))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
