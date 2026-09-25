import { AdCreative, bannerVisibilityClass } from "@/components/site/AdCreative";
import { useAdBanners, type AdBanner } from "@/lib/useAdBanners";

/**
 * Small ad banner (300x100). Renders all active banners for the given
 * placement, stacked vertically with separation.
 */
export function AdBannerSmall({
  placement,
  className = "",
}: {
  placement: string;
  className?: string;
}) {
  const banners = useAdBanners(placement);

  if (banners.length === 0) return null;

  const renderBanner = (banner: AdBanner) => (
    <div className="overflow-hidden border border-border bg-surface transition-opacity hover:opacity-90">
      <AdCreative
        banner={banner}
        placement={placement}
        width={300}
        height={100}
        imgClassName="block h-[100px] w-[300px] object-cover"
      />
    </div>
  );

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="font-condensed mb-1.5 text-[9px] uppercase tracking-widest text-muted-foreground/60">
        Publicidad
      </div>
      <div className="flex w-full flex-col items-center gap-3">
        {banners.map((banner) => (
          <div key={banner.id} className={`w-full justify-center ${bannerVisibilityClass(banner).replace("block", "flex") || "flex"} ${bannerVisibilityClass(banner) === "md:hidden" ? "flex" : ""}`}>
            {renderBanner(banner)}
          </div>
        ))}
      </div>
    </div>
  );
}
