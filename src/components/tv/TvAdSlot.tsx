import { useEffect, useState } from "react";
import { useAdBanners, type AdBanner } from "@/lib/useAdBanners";
import { AdCreative, bannerVisibleOn } from "@/components/site/AdCreative";

/** Dispositivo actual (null hasta montar en cliente, para no reservar huecos en SSR). */
export function useDevice(): "desktop" | "mobile" | null {
  const [device, setDevice] = useState<"desktop" | "mobile" | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const on = () => setDevice(mq.matches ? "desktop" : "mobile");
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return device;
}

/** Banners activos de una posición que realmente se ven en el dispositivo actual. */
export function useVisibleBanners(placement: string): AdBanner[] {
  const all = useAdBanners(placement);
  const device = useDevice();
  if (!device) return [];
  return all.filter((b) => bannerVisibleOn(b, device));
}

/**
 * Posición publicitaria de Rollerzone TV (TV-04/05/06). Sin banner = no renderiza nada.
 * Proporciones según tamaño recomendado Desktop / Mobile.
 */
export function TvAdSlot({
  banner,
  placement,
  desktop,
  mobile,
}: {
  banner: AdBanner | undefined;
  placement: string;
  desktop: { w: number; h: number };
  mobile: { w: number; h: number };
}) {
  if (!banner) return null;
  return (
    <section aria-label="Publicidad" className="bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
        <div className="font-condensed mb-1 text-[9px] uppercase tracking-widest text-muted-foreground/60">
          Publicidad
        </div>
        <div
          className="tv-ad-slot mx-auto w-full overflow-hidden border border-border bg-surface"
          style={
            {
              "--ar-m": `${mobile.w} / ${mobile.h}`,
              "--ar-d": `${desktop.w} / ${desktop.h}`,
              maxWidth: `max(${mobile.w}px, min(100%, ${desktop.w}px))`,
            } as React.CSSProperties
          }
        >
          <AdCreative
            banner={banner}
            placement={placement}
            className="block h-full w-full"
            width={desktop.w}
            height={desktop.h}
            imgClassName="block h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
