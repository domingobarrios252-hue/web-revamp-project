import { AdCreative, bannerVisibilityClass } from "@/components/site/AdCreative";
import { useAdBanners, type AdBanner as AdBannerType } from "@/lib/useAdBanners";

export function AdBanner({ placement = "home_top" }: { placement?: string }) {
  const banners = useAdBanners(placement);

  if (banners.length === 0) return null;

  const renderBanner = (banner: AdBannerType) => (
    <div className="overflow-hidden border border-border bg-surface transition-opacity hover:opacity-90">
      <AdCreative
        banner={banner}
        placement={placement}
        imgClassName="mx-auto h-auto max-h-[80px] w-full object-contain sm:max-h-[120px] md:max-h-none md:object-cover"
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 sm:pt-4 md:pt-6">
      <div className="font-condensed mb-1 text-[10px] uppercase tracking-widest text-muted-foreground/60 md:mb-2">
        Publicidad
      </div>
      <div className="space-y-3">
        {banners.map((b) => (
          <div key={b.id} className={bannerVisibilityClass(b)}>{renderBanner(b)}</div>
        ))}
      </div>
    </div>
  );
}

