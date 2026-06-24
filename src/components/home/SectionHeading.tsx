import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Encabezado editorial reutilizable para los bloques de la home.
 * Kicker dorado + título display + filete dorado + acción opcional.
 */
export function SectionHeading({
  kicker,
  title,
  accent,
  action,
  icon,
}: {
  kicker?: string;
  title: ReactNode;
  accent?: ReactNode;
  action?: { to: string; label: string };
  icon?: ReactNode;
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker && (
          <div className="font-condensed mb-2 inline-flex items-center gap-2 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background">
            {icon}
            <span>{kicker}</span>
          </div>
        )}
        <h2 className="font-display text-2xl uppercase tracking-widest text-foreground md:text-4xl">
          {title}
          {accent ? <span className="text-gold"> {accent}</span> : null}
        </h2>
        <div className="mt-3 h-[3px] w-16 bg-gold" aria-hidden="true" />
      </div>
      {action && (
        <Link
          to={action.to}
          className="font-condensed shrink-0 text-xs font-bold uppercase tracking-widest text-gold hover:text-gold-light"
        >
          {action.label} →
        </Link>
      )}
    </div>
  );
}
