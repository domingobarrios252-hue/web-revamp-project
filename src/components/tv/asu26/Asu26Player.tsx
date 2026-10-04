import { useState } from "react";
import { Play } from "lucide-react";
import { ExternalEmbedGate } from "@/components/site/ExternalEmbedGate";
import { TvPlayBeacon } from "@/components/tv/TvPlayBeacon";
import {
  STREAM_TABS,
  httpsOnly,
  type Asu26StreamKey,
  type Asu26StreamingConfig,
} from "@/lib/tv/asu26Streaming";

/**
 * Reproductor ASU26. Solo existe UN iframe montado: el de la señal
 * seleccionada. Al cambiar de señal se desmonta el anterior (key) y se monta
 * el nuevo. No se carga nada hasta que el usuario pulsa Play.
 */
export function Asu26Player({ cfg }: { cfg: Asu26StreamingConfig }) {
  const tabs = STREAM_TABS.filter((t) => cfg[t.show] && httpsOnly(cfg[t.url] as string));
  const initial = tabs.find((t) => t.key === cfg.defaultStream)?.key ?? tabs[0]?.key ?? null;
  const [active, setActive] = useState<Asu26StreamKey | null>(initial);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const tab = tabs.find((t) => t.key === active) ?? tabs[0];
  const src = tab ? httpsOnly(cfg[tab.url] as string) : "";
  const label = tab?.label ?? "";

  if (!tab) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-border bg-asu-deep p-6 text-center text-sm text-muted-foreground">
        Señal no disponible en este momento.
      </div>
    );
  }

  return (
    <div>
      {tabs.length > 1 && (
        <div role="tablist" aria-label="Seleccionar señal" className="mb-3 grid grid-cols-4 gap-1.5 rounded-xl border border-border bg-background/70 p-1.5">
          {tabs.map((t) => {
            const on = t.key === tab.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  if (t.key === tab.key) return;
                  setActive(t.key);
                  setLoading(true);
                }}
                className={`font-condensed min-h-11 rounded-lg px-2 text-xs font-bold uppercase tracking-[2px] transition-all duration-200 sm:text-sm ${
                  on ? "bg-asu text-foreground shadow-md" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-asu/50 bg-asu-deep shadow-2xl">
        {started ? (
          <ExternalEmbedGate provider="World Skate" sourceUrl={src}>
            {loading && <div className="absolute inset-0 animate-pulse bg-surface-2" aria-hidden="true" />}
            <iframe
              key={tab.key}
              src={src}
              title={`World Skate Games ASU26 · ${label}`}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setLoading(false)}
            />
            <TvPlayBeacon title={`ASU26 · ${label}`} eventRef={`asu26-${tab.key}`} status={cfg.streamStatus} />
          </ExternalEmbedGate>
        ) : (
          <button
            type="button"
            onClick={() => setStarted(true)}
            aria-label={`Reproducir señal ${label}`}
            className="asu-hero-bg group absolute inset-0 flex flex-col items-center justify-center gap-4"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold text-background shadow-2xl transition-transform duration-300 group-hover:scale-110 md:h-20 md:w-20">
              <Play className="ml-1 h-7 w-7 md:h-9 md:w-9" fill="currentColor" />
            </span>
            <span className="font-condensed text-xs font-bold uppercase tracking-[3px] text-foreground/90">
              Señal {label}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
