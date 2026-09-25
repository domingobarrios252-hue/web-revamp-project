/** Navegación compacta de Rollerzone TV (solo móvil/tablet). Anclas a secciones con contenido. */
export function TvMobileNav({ items, live }: { items: { id: string; label: string }[]; live: boolean }) {
  if (items.length <= 1) return null;
  return (
    <nav
      aria-label="Secciones de Rollerzone TV"
      className="sticky top-[57px] z-30 border-b border-border bg-background/95 backdrop-blur lg:hidden"
    >
      <div className="flex max-w-full snap-x overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((it) => (
          <a
            key={it.id}
            href={`#${it.id}`}
            className="font-condensed flex min-h-11 shrink-0 snap-start items-center gap-1.5 border-b-2 border-transparent px-3 text-[11px] font-bold uppercase tracking-[2px] text-muted-foreground transition-colors hover:text-gold focus-visible:text-gold"
          >
            {it.id === "directo" && live && (
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-destructive" aria-hidden="true" />
            )}
            {it.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
