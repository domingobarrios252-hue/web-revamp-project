import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type BannerValue = {
  enabled?: boolean;
  image_url?: string | null;
  link_url?: string | null;
  alt?: string | null;
};

export function AdBanner() {
  const [banner, setBanner] = useState<BannerValue | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "home_ad_banner")
        .maybeSingle();
      if (cancelled) return;
      const v = (data?.value ?? null) as BannerValue | null;
      setBanner(v);
      setLoaded(true);
    };
    load();

    const channel = supabase
      .channel("ad-banner-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings", filter: "key=eq.home_ad_banner" },
        load,
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  if (!loaded) return null;
  if (!banner || banner.enabled === false) return null;
  if (!banner.image_url) return null;

  const isExternal = banner.link_url ? /^https?:\/\//i.test(banner.link_url) : false;
  const img = (
    <img
      src={banner.image_url}
      alt={banner.alt || "Publicidad"}
      className="h-auto w-full object-cover"
      loading="lazy"
    />
  );

  return (
    <section aria-label="Publicidad" className="mx-auto max-w-7xl px-6 pt-8">
      <div className="font-condensed mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        Publicidad
      </div>
      <div className="overflow-hidden border border-border bg-surface">
        {banner.link_url ? (
          <a
            href={banner.link_url}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="block"
          >
            {img}
          </a>
        ) : (
          img
        )}
      </div>
    </section>
  );
}
