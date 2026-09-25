import { Link } from "@tanstack/react-router";
import type { NavItem } from "@/lib/specials/liveEvent";

/** Navegación LIVE: horizontal, deslizable, sticky y compacta. */
export function LiveEventNav({ slug, items, live }: { slug: string; items: NavItem[]; live: boolean }) {
  if (items.length <= 1) return null;
  const cls =
    "font-condensed flex min-h-11 shrink-0 snap-start items-center gap-1.5 border-b-2 border-transparent px-3 text-[11px] font-bold uppercase tracking-[2px] text-muted-foreground transition-colors hover:text-gold";
  return (
    <nav
      aria-label="Navegación del evento"
      className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl snap-x overflow-x-auto px-2 [scrollbar-width:none] md:px-4 [&::-webkit-scrollbar]:hidden">
        {items.map((it) =>
          it.pieceSlug ? (
            <Link
              key={it.key}
              to="/especiales/$slug/$piece"
              params={{ slug, piece: it.pieceSlug }}
              className={cls}
            >
              {it.key === "directo" && live && (
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-destructive" aria-hidden="true" />
              )}
              {it.label}
            </Link>
          ) : (
            <a key={it.key} href={it.anchor ?? "#hoy"} className={it.anchor ? cls : cls + " border-gold text-gold"}>
              {it.label}
            </a>
          ),
        )}
      </div>
    </nav>
  );
}
