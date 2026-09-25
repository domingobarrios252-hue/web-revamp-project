import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Partner = {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  tv_tier: string;
  tv_sort_order: number;
};

/** Partners de Rollerzone TV: solo patrocinadores publicados marcados "Mostrar en Rollerzone TV". */
export function useTvPartners() {
  const [items, setItems] = useState<Partner[]>([]);
  useEffect(() => {
    supabase
      .from("sponsors")
      .select("id, name, logo_url, website_url, tv_tier, tv_sort_order")
      .eq("published", true)
      .eq("show_on_tv", true)
      .order("tv_sort_order", { ascending: true })
      .order("name", { ascending: true })
      .then(({ data }) => setItems(((data as Partner[]) ?? []).filter((p) => p.logo_url || p.name)));
  }, []);
  return items;
}

function Logo({ p, size }: { p: Partner; size: "lg" | "sm" }) {
  const box =
    size === "lg"
      ? "h-24 w-full max-w-[320px] px-6 md:h-28"
      : "h-16 w-full max-w-[200px] px-4 md:h-20";
  const inner = p.logo_url ? (
    <img src={p.logo_url} alt={p.name} loading="lazy" decoding="async" className="max-h-full max-w-full object-contain" />
  ) : (
    <span className="font-display text-center text-sm tracking-widest text-foreground">{p.name}</span>
  );
  const cls = `flex ${box} items-center justify-center border border-border bg-surface/60 py-3 transition-colors hover:border-gold/60`;
  return p.website_url ? (
    <a href={p.website_url} target="_blank" rel="noopener noreferrer sponsored" aria-label={p.name} className={cls}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function TvPartners({ items }: { items: Partner[] }) {
  if (!items.length) return null;
  const main = items.filter((p) => p.tv_tier === "principal");
  const collab = items.filter((p) => p.tv_tier !== "principal");
  return (
    <section id="partners" aria-label="Partners de Rollerzone TV" className="border-t border-gold/30 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <p className="font-display text-center text-lg tracking-[4px] text-foreground md:text-xl">
          PARTNERS DE <span className="text-gold">ROLLERZONE TV</span>
        </p>
        {main.length > 0 && (
          <div className="mt-6">
            <p className="font-condensed text-center text-[10px] uppercase tracking-[3px] text-gold">
              {main.length > 1 ? "Partners principales" : "Partner principal"}
            </p>
            <div className="mt-3 grid grid-cols-1 justify-items-center gap-3 sm:flex sm:flex-wrap sm:justify-center">
              {main.map((p) => (
                <Logo key={p.id} p={p} size="lg" />
              ))}
            </div>
          </div>
        )}
        {collab.length > 0 && (
          <div className="mt-8">
            <p className="font-condensed text-center text-[10px] uppercase tracking-[3px] text-muted-foreground">
              Colaboradores
            </p>
            <div className="mt-3 grid grid-cols-2 justify-items-center gap-3 sm:flex sm:flex-wrap sm:justify-center">
              {collab.map((p) => (
                <Logo key={p.id} p={p} size="sm" />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
