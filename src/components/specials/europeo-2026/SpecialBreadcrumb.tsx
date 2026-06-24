import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { SPECIAL_BASE_PATH } from "@/lib/specials/europeo-2026";

export function SpecialBreadcrumb({ current }: { current: string }) {
  return (
    <nav
      aria-label="Migas de pan del especial"
      className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-4 text-[11px] uppercase tracking-[2px] text-muted-foreground md:px-6"
    >
      <Link to="/" className="hover:text-gold">Inicio</Link>
      <ChevronRight className="h-3 w-3" />
      <span className="text-gold">Cobertura especial</span>
      <ChevronRight className="h-3 w-3" />
      <Link to={SPECIAL_BASE_PATH} className="hover:text-gold">
        Camino al Europeo 2026
      </Link>
      <ChevronRight className="h-3 w-3" />
      <span className="text-foreground/80">{current}</span>
    </nav>
  );
}
