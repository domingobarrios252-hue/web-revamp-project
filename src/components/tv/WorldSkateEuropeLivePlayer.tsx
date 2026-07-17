import { useEffect, useRef } from "react";
import { Radio } from "lucide-react";

const PLAYER_ID = "A217BCEBB2594BDF8FE2E65131DBF663";
const PLAYER_SRC = `https://players.cdn.enetres.net/live/${PLAYER_ID}022829`;

type Props = {
  /** Marca si la retransmisión está activa en este momento. Si es false, muestra un aviso
   * sobre el reproductor sin ocultarlo. */
  isLive?: boolean;
  className?: string;
};

/**
 * Reproductor oficial de World Skate Europe TV para el Europeo 2026.
 * Responsive 16:9, no provoca scroll horizontal en móviles.
 */
export function WorldSkateEuropeLivePlayer({ isLive = false, className = "" }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // El proveedor requiere asignar el src vía JS tras montar el iframe.
    if (iframeRef.current && !iframeRef.current.src) {
      iframeRef.current.src = PLAYER_SRC;
    }
  }, []);

  return (
    <section className={`mx-auto w-full max-w-5xl ${className}`}>
      <div className="mb-4 text-center">
        <p className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
          World Skate Europe TV
        </p>
        <h2 className="font-display mt-2 text-2xl uppercase leading-tight tracking-wider text-foreground md:text-3xl lg:text-4xl">
          Europeo de Patinaje de Velocidad 2026 – En directo
        </h2>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl border border-gold/40 bg-black shadow-[0_0_40px_oklch(0.78_0.16_70/0.18)]">
        <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
          <iframe
            ref={iframeRef}
            id={PLAYER_ID}
            title="World Skate Europe TV — Europeo 2026 en directo"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            frameBorder={0}
            className="absolute inset-0 h-full w-full"
          />
          {!isLive && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-6 text-center">
              <Radio className="mb-3 h-10 w-10 text-gold" />
              <p className="font-display text-lg uppercase tracking-widest text-white md:text-xl">
                La retransmisión comenzará próximamente
              </p>
              <p className="font-condensed mt-2 text-[11px] uppercase tracking-widest text-white/70">
                Vuelve al inicio del evento para verlo en directo
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-center text-sm text-muted-foreground">
        Retransmisión oficial ofrecida por{" "}
        <span className="font-semibold text-foreground">World Skate Europe TV</span>.
      </p>
    </section>
  );
}
