import { useAdBanners, type AdBanner as AdBannerType } from "@/lib/useAdBanners";

export function AdBanner({ placement = "home_top" }: { placement?: string }) {
  const banners = useAdBanners(placement);

  if (banners.length === 0) return null;

  const renderBanner = (banner: AdBannerType) => {
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
    if (!banner.link_url) return card;
    if (isExternal(banner.link_url)) {
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
      <a href={banner.link_url} aria-label={banner.alt_text ?? banner.name} className="block">
        {card}
      </a>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 sm:pt-4 md:pt-6">
      <div className="font-condensed mb-1 text-[10px] uppercase tracking-widest text-muted-foreground/60 md:mb-2">
        Publicidad
      </div>
      <div className="space-y-3">
        {banners.map((b) => (
          <div key={b.id}>{renderBanner(b)}</div>
        ))}
      </div>
    </div>
  );
}

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}
