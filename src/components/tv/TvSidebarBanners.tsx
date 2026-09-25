import { useAdBanners } from "@/lib/useAdBanners";
import { AdCreative, bannerVisibilityClass } from "@/components/site/AdCreative";

export function TvSidebarBanners() {
  const large = useAdBanners("tv_sidebar"); // 300×200
  const small = useAdBanners("tv_side");    // 300×100

  const items = [
    ...large.map((b) => ({ b, size: "large" as const })),
    ...small.map((b) => ({ b, size: "small" as const })),
  ];

  if (items.length === 0) return null;

  // Muestra un máximo de 4 banners laterales en total
  const visible = items.slice(0, 4);

  return (
    <aside aria-label="Publicidad" className="flex flex-col gap-4">
      <div className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground/60">
        Publicidad
      </div>
      {visible.map(({ b, size }) => (
        <div
          key={`${size}-${b.id}`}
          className={`overflow-hidden border border-border bg-surface transition-colors hover:border-gold ${bannerVisibilityClass(b)}`}
        >
          <AdCreative
            banner={b}
            placement={size === "large" ? "tv_sidebar" : "tv_side"}
            width={300}
            height={size === "large" ? 200 : 100}
            imgClassName={size === "large" ? "block aspect-[3/2] w-full object-cover" : "block aspect-[3/1] w-full object-cover"}
          />
        </div>
      ))}
    </aside>
  );
}
