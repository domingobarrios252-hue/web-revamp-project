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
  const box = size === "lg" ? "h-20 md:h-24" : "h-12 md:h-14";
  const inner = p.logo_url ? (
    <img
      src={p.logo_url}
      alt={p.name}
      loading="lazy"
      decoding="async"
      className="h-full w-full object-contain"
    />
  ) : (
    <span className="font-display text-center text-sm tracking-widest text-foreground">{p.name}</span>
  );
  const cls = `flex ${box} min-h-11 w-full items-center justify-center rounded-sm bg-white/[0.03] px-3 py-2 transition-opacity hover:opacity-80`;
  return p.website_url ? (
    <a href={p.website_url} target="_blank" rel="noopener noreferrer sponsored" aria-label={p.name} className={cls}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** Columnas equilibradas según número de logos (sin scroll horizontal). */
function cols(n: number, tier: "lg" | "sm") {
  if (tier === "lg") {
    if (n === 1) return "grid-cols-1 max-w-xs";
    if (n === 2 || n === 4) return "grid-cols-2 max-w-2xl";
    return "grid-cols-2 sm:grid-cols-3 max-w-4xl";
  }
  if (n <= 2) return "grid-cols-2 max-w-md";
  if (n === 4) return "grid-cols-2 sm:grid-cols-4 max-w-3xl";
  return "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 max-w-5xl";
}

/** Un único bloque premium construido con los logos existentes (Admin → Patrocinadores). */
export function TvPartners({ items }: { items: Partner[] }) {
  if (!items.length) return null;
  const main = items.filter((p) => p.tv_tier === "principal");
  const collab = items.filter((p) => p.tv_tier !== "principal");
  return (
    <section id="partners" aria-label="Partners de Rollerzone TV" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="border border-gold/30 bg-gradient-to-b from-surface/80 to-background px-4 py-6 md:px-8 md:py-8">
          <p className="font-display text-center text-base tracking-[4px] text-foreground md:text-xl">
            PARTNERS DE <span className="text-gold">ROLLERZONE TV</span>
          </p>
          <div className="mx-auto mt-2 h-px w-12 bg-gold/60" aria-hidden="true" />
          {main.length > 0 && (
            <div className={`mx-auto mt-6 grid gap-4 ${cols(main.length, "lg")}`}>
              {main.map((p) => (
                <Logo key={p.id} p={p} size="lg" />
              ))}
            </div>
          )}
          {collab.length > 0 && (
            <div className={`mx-auto grid gap-3 ${main.length ? "mt-6 border-t border-border pt-6" : "mt-6"} ${cols(collab.length, "sm")}`}>
              {collab.map((p) => (
                <Logo key={p.id} p={p} size="sm" />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
