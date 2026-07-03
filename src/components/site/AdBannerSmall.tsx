import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Banner = {
  id: string;
  name: string;
  image_url: string;
  link_url: string | null;
  alt_text: string | null;
};

/**
 * Small ad banner (300x100). Renders all active banners for the given
 * placement, stacked vertically with separation. Designed to be unobtrusive.
 */
export function AdBannerSmall({
  placement,
  className = "",
}: {
  placement: string;
  className?: string;
}) {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      supabase
        .from("ad_banners")
        .select("id, name, image_url, link_url, alt_text")
        .eq("active", true)
        .eq("placement", placement)
        .order("sort_order", { ascending: true })
        .then(({ data }) => {
          if (!cancelled) setBanners((data as Banner[]) ?? []);
        });
    };
    load();

    const channel = supabase
      .channel(`ad-banners-small-${placement}`)
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

  if (banners.length === 0) return null;

  const renderBanner = (banner: Banner) => {
    const img = (
      <img
        src={banner.image_url}
        alt={banner.alt_text ?? banner.name}
        width={300}
        height={100}
        loading="lazy"
        className="block h-[100px] w-[300px] object-cover"
      />
    );

    const card = (
      <div className="overflow-hidden border border-border bg-surface transition-opacity hover:opacity-90">
        {img}
      </div>
    );

    if (!banner.link_url) return card;
    if (/^https?:\/\//i.test(banner.link_url)) {
      return (
        <a
          href={banner.link_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          aria-label={banner.alt_text ?? banner.name}
          className="block"
        >
          {card}
        </a>
      );
    }
    return (
      <a
        href={banner.link_url}
        aria-label={banner.alt_text ?? banner.name}
        className="block"
      >
        {card}
      </a>
    );
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="font-condensed mb-1.5 text-[9px] uppercase tracking-widest text-muted-foreground/60">
        Publicidad
      </div>
      <div className="flex w-full flex-col items-center gap-3">
        {banners.map((banner) => (
          <div key={banner.id} className="flex w-full justify-center">
            {renderBanner(banner)}
          </div>
        ))}
      </div>
    </div>
  );
}
