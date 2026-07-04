import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Banner = {
  id: string;
  image_url: string;
  link_url: string | null;
  alt_text: string | null;
  name: string;
};

type Props = {
  autoplay: boolean;
  intervalMs: number;
  showArrows: boolean;
  showDots: boolean;
};

export function TvPremiumBanner({ autoplay, intervalMs, showArrows, showDots }: Props) {
  const [items, setItems] = useState<Banner[]>([]);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      supabase
        .from("ad_banners")
        .select("id, image_url, link_url, alt_text, name")
        .eq("placement", "tv_premium")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .then(({ data }) => {
          if (!cancelled) setItems((data as Banner[]) ?? []);
        });
    load();
    const ch = supabase
      .channel("tv_premium_banners")
      .on("postgres_changes", { event: "*", schema: "public", table: "ad_banners" }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, []);

  useEffect(() => {
    if (!autoplay || paused || items.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, Math.max(1500, intervalMs));
    return () => clearInterval(t);
  }, [autoplay, paused, intervalMs, items.length]);

  if (items.length === 0) return null;
  const current = items[idx % items.length];
  const multi = items.length > 1;

  const wrap = (child: React.ReactNode, b: Banner) =>
    b.link_url ? (
      b.link_url.startsWith("/") ? (
        <a href={b.link_url} className="block h-full w-full">
          {child}
        </a>
      ) : (
        <a
          href={b.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full w-full"
        >
          {child}
        </a>
      )
    ) : (
      <div className="block h-full w-full">{child}</div>
    );

  return (
    <section aria-label="Publicidad premium" className="w-full">
      <div className="font-condensed mb-2 text-[10px] uppercase tracking-widest text-muted-foreground/60">
        Publicidad
      </div>
      <div
        className="relative w-full overflow-hidden border border-gold/30 bg-surface shadow-[0_0_30px_oklch(0.78_0.16_70/0.15)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Tamaño recomendado 1200x200 (relación 6:1) */}
        <div className="relative aspect-[6/1] min-h-[120px] w-full">
          {items.map((b, i) => (
            <div
              key={b.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                i === idx ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              aria-hidden={i !== idx}
            >
              {wrap(
                <img
                  src={b.image_url}
                  alt={b.alt_text ?? b.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />,
                b,
              )}
            </div>
          ))}

          {multi && showArrows && (
            <>
              <button
                type="button"
                onClick={() => setIdx((i) => (i - 1 + items.length) % items.length)}
                aria-label="Anterior"
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 border border-gold/60 bg-background/80 p-1.5 text-gold backdrop-blur transition-colors hover:bg-gold hover:text-primary-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIdx((i) => (i + 1) % items.length)}
                aria-label="Siguiente"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 border border-gold/60 bg-background/80 p-1.5 text-gold backdrop-blur transition-colors hover:bg-gold hover:text-primary-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {multi && showDots && (
          <div className="flex items-center justify-center gap-1.5 border-t border-border bg-background/60 py-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Ir al slide ${i + 1}`}
                className={`h-1.5 w-6 transition-colors ${i === idx ? "bg-gold" : "bg-border"}`}
              />
            ))}
          </div>
        )}
      </div>
      {/* Suppress unused warning for current if compiler complains */}
      <span className="hidden">{current.id}</span>
    </section>
  );
}
