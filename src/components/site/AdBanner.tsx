import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Banner = {
  id: string;
  name: string;
  image_url: string;
  link_url: string | null;
  alt_text: string | null;
};

export function AdBanner({ placement = "home_top" }: { placement?: string }) {
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      supabase
        .from("ad_banners")
        .select("id, name, image_url, link_url, alt_text")
        .eq("active", true)
        .eq("placement", placement)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (!cancelled) setBanner((data as Banner) ?? null);
        });
    };
    load();

    const channel = supabase
      .channel(`ad-banners-${placement}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ad_banners" },
        () => load()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [placement]);

  if (!banner) return null;

  const img = (
    <img
      src={banner.image_url}
      alt={banner.alt_text ?? banner.name}
      className="mx-auto h-auto max-h-[80px] w-full object-contain sm:max-h-[120px] md:max-h-none md:object-cover"
      loading="lazy"
    />
  );

  const card = (
    <div className="overflow-hidden border border-border bg-surface transition-opacity hover:opacity-90">
      {img}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 sm:pt-4 md:pt-6">
      <div className="font-condensed mb-1 text-[10px] uppercase tracking-widest text-muted-foreground/60 md:mb-2">
        Publicidad
      </div>
      {banner.link_url ? (
        isExternal(banner.link_url) ? (
          <a
            href={banner.link_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label={banner.alt_text ?? banner.name}
            className="block"
          >
            {card}
          </a>
        ) : (
          <a
            href={banner.link_url}
            aria-label={banner.alt_text ?? banner.name}
            className="block"
          >
            {card}
          </a>
        )
      ) : (
        card
      )}
    </div>
  );
}

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}
