import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon = Inbox,
  title = "Próximamente",
  message = "Estamos preparando este contenido. Vuelve pronto para descubrir las novedades.",
  action,
  className = "",
}: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center border border-dashed border-border bg-surface px-6 py-16 text-center ${className}`}
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-gold/40 bg-background">
        <Icon className="h-9 w-9 text-gold" aria-hidden="true" />
      </div>
      <h2 className="font-display text-2xl tracking-widest text-foreground">{title}</h2>
      <p className="font-condensed mt-3 max-w-md text-sm uppercase tracking-wider text-muted-foreground">
        {message}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
