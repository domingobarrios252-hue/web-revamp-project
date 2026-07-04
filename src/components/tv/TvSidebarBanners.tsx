import { useAdBanners } from "@/lib/useAdBanners";

export function TvSidebarBanners() {
  const items = useAdBanners("tv_sidebar");

  if (items.length === 0) return null;

  // Muestra un máximo de 3 banners laterales (300×200 recomendado)
  const visible = items.slice(0, 3);

  return (
    <aside aria-label="Publicidad" className="flex flex-col gap-4">
      <div className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground/60">
        Publicidad
      </div>
      {visible.map((b) => {
        const img = (
          <img
            src={b.image_url}
            alt={b.alt_text ?? b.name}
            loading="lazy"
            width={300}
            height={200}
            className="block aspect-[3/2] w-full object-cover"
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
