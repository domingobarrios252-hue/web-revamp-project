import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Banner = {
  id: string;
  image_url: string;
  link_url: string | null;
  alt_text: string | null;
  name: string;
};

export function TvSidebarBanners() {
  const [items, setItems] = useState<Banner[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      supabase
        .from("ad_banners")
        .select("id, image_url, link_url, alt_text, name")
        .eq("placement", "tv_sidebar")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .then(({ data }) => {
          if (!cancelled) setItems((data as Banner[]) ?? []);
        });
    load();
    const ch = supabase
      .channel("tv_sidebar_banners")
      .on("postgres_changes", { event: "*", schema: "public", table: "ad_banners" }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <aside aria-label="Publicidad" className="flex flex-col gap-4">
      <div className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground/60">
        Publicidad
      </div>
      {items.map((b) => {
        const img = (
          <img
            src={b.image_url}
            alt={b.alt_text ?? b.name}
            loading="lazy"
            className="h-auto w-full object-contain"
          />
        );
        return (
          <div
            key={b.id}
            className="overflow-hidden border border-border bg-surface transition-colors hover:border-gold"
          >
            {b.link_url ? (
              b.link_url.startsWith("/") ? (
                <a href={b.link_url}>{img}</a>
              ) : (
                <a href={b.link_url} target="_blank" rel="noopener noreferrer">
                  {img}
                </a>
              )
            ) : (
              img
            )}
          </div>
        );
      })}
    </aside>
  );
}
