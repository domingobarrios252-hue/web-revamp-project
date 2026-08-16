import type { ReactNode } from "react";
import { ExternalLink, ShieldQuestion } from "lucide-react";
import { useConsent } from "@/lib/consent";

type Props = {
  children: ReactNode;
  /** Nombre del proveedor mostrado en el aviso (YouTube, World Skate Europe TV…). */
  provider?: string;
  /** Enlace opcional para ver el contenido en el origen. */
  sourceUrl?: string | null;
  className?: string;
};

/**
 * Bloquea contenido incrustado de terceros hasta que el visitante permita la
 * categoría "Contenido externo". No elimina ningún vídeo: solo retrasa la carga
 * del iframe hasta que hay consentimiento.
 */
export function ExternalEmbedGate({ children, provider, sourceUrl, className = "" }: Props) {
  const { categories, ready, save, openPreferences } = useConsent();

  if (!ready || categories.external) {
    // Antes de hidratar no renderizamos el iframe (estado por defecto: denegado).
    if (!ready) {
      return (
        <div
          className={`flex h-full w-full items-center justify-center bg-black/60 ${className}`}
          aria-hidden="true"
        />
      );
    }
    return <>{children}</>;
  }

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-surface p-5 text-center ${className}`}
    >
      <ShieldQuestion className="h-8 w-8 text-gold" aria-hidden="true" />
      <p className="max-w-md text-sm leading-relaxed text-foreground/85">
        Este contenido pertenece a un proveedor externo
        {provider ? ` (${provider})` : ""}. Para visualizarlo debes permitir el contenido externo.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => save({ external: true })}
          className="font-condensed min-h-[44px] bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Permitir y ver contenido
        </button>
        <button
          type="button"
          onClick={openPreferences}
          className="font-condensed min-h-[44px] border border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest text-foreground/85 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Gestionar cookies
        </button>
      </div>
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-gold underline underline-offset-2 hover:text-gold-dark"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Ver en el proveedor
        </a>
      ) : null}
    </div>
  );
}
