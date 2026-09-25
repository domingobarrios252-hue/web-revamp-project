import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AdBanner } from "@/lib/useAdBanners";

/** Breakpoint desktop/mobile compartido por render y analítica (Tailwind md = 768px). */
const DESKTOP_MQ = "(min-width: 768px)";

function currentDevice(): "desktop" | "mobile" {
  return typeof window !== "undefined" && window.matchMedia(DESKTOP_MQ).matches ? "desktop" : "mobile";
}

/** Clases de visibilidad por dispositivo (CSS, sin desajustes de hidratación). */
export function bannerVisibilityClass(b: AdBanner): string {
  const target = b.device_target ?? "all";
  const hideMobile = target === "desktop" || (!b.image_mobile_url && b.mobile_fallback === "hide");
  if (target === "mobile") return "md:hidden";
  if (hideMobile) return "hidden md:block";
  return "";
}

/** ¿Debe verse este banner en el dispositivo indicado? */
export function bannerVisibleOn(b: AdBanner, device: "desktop" | "mobile"): boolean {
  const target = b.device_target ?? "all";
  if (target !== "all" && target !== device) return false;
  if (device === "mobile" && !b.image_mobile_url && b.mobile_fallback === "hide") return false;
  return true;
}

const seen = new Set<string>();

function record(bannerId: string, placement: string, kind: "impression" | "click") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  void (supabase.rpc as any)("record_ad_event", {
    _banner_id: bannerId,
    _placement: placement,
    _device: currentDevice(),
    _kind: kind,
  });
}

/**
 * Registra una impresión cuando ≥50 % del banner está visible ≥1 s,
 * máximo una vez por visita (sesión) + banner + posición.
 */
function useImpression(ref: React.RefObject<HTMLElement | null>, bannerId: string, placement: string | undefined) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !placement || typeof IntersectionObserver === "undefined") return;
    const key = `rz-ad:${bannerId}:${placement}`;
    const already = () => {
      if (seen.has(key)) return true;
      try {
        return sessionStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    };
    if (already()) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.5 && el.offsetParent !== null;
        if (visible && !timer) {
          timer = setTimeout(() => {
            if (already()) return;
            seen.add(key);
            try {
              sessionStorage.setItem(key, "1");
            } catch {
              /* sin almacenamiento: basta con memoria */
            }
            record(bannerId, placement, "impression");
            io.disconnect();
          }, 1000);
        } else if (!visible && timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    io.observe(el);
    return () => {
      if (timer) clearTimeout(timer);
      io.disconnect();
    };
  }, [ref, bannerId, placement]);
}

/**
 * Creatividad de banner: imagen Desktop + Mobile opcional (<picture>),
 * enlace y analítica agregada. Sin placement no registra (p. ej. vistas previas).
 */
export function AdCreative({
  banner,
  placement,
  imgClassName = "block h-auto w-full",
  width,
  height,
  className = "block",
  forceDevice,
}: {
  banner: AdBanner;
  placement?: string;
  imgClassName?: string;
  width?: number;
  height?: number;
  className?: string;
  /** Solo para vista previa en Admin. */
  forceDevice?: "desktop" | "mobile";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useImpression(ref, banner.id, forceDevice ? undefined : placement);
  const alt = banner.alt_text ?? banner.name;
  const mobileSrc = banner.image_mobile_url || null;

  const img =
    forceDevice === "mobile" ? (
      <img src={mobileSrc ?? banner.image_url} alt={alt} className={imgClassName} />
    ) : forceDevice === "desktop" ? (
      <img src={banner.image_url} alt={alt} className={imgClassName} />
    ) : (
      <picture>
        {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
        <img src={banner.image_url} alt={alt} width={width} height={height} loading="lazy" decoding="async" className={imgClassName} />
      </picture>
    );

  const onClick = () => {
    if (placement && !forceDevice) record(banner.id, placement, "click");
  };

  let body: React.ReactNode = img;
  if (banner.link_url) {
    const ext = /^https?:\/\//i.test(banner.link_url);
    body = (
      <a
        href={banner.link_url}
        onClick={onClick}
        aria-label={alt}
        className="block h-full w-full"
        {...(ext ? { target: "_blank", rel: "noopener noreferrer sponsored" } : {})}
      >
        {img}
      </a>
    );
  }
  return (
    <div ref={ref} className={className}>
      {body}
    </div>
  );
}
