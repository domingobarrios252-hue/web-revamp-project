import { Link } from "@tanstack/react-router";
import { PIECES, SPECIAL_BASE_PATH, piecePath, type PieceSlug } from "@/lib/specials/europeo-2026";

export function SpecialSubNav({ active }: { active?: PieceSlug | "landing" }) {
  return (
    <nav
      aria-label="Navegación del especial Camino al Europeo 2026"
      className="sticky top-0 z-20 border-y border-border bg-surface/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 md:px-6">
        <Link
          to={SPECIAL_BASE_PATH}
          className={
            "font-condensed shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[2.5px] transition-colors " +
            (active === "landing"
              ? "border-gold bg-gold text-background"
              : "border-border text-muted-foreground hover:border-gold hover:text-gold")
          }
        >
          Portada del especial
        </Link>
        {PIECES.map((p) => (
          <Link
            key={p.slug}
            to={piecePath(p.slug)}
            className={
              "font-condensed shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[2.5px] transition-colors " +
              (active === p.slug
                ? "border-gold bg-gold text-background"
                : "border-border text-muted-foreground hover:border-gold hover:text-gold")
            }
          >
            {p.kicker} · {p.number}
          </Link>
        ))}
      </div>
    </nav>
  );
}
