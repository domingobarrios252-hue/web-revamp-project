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
import { ASU26_TZ } from "@/lib/tv/asu26Streaming";
import { hhmm, useViewerTz } from "./Asu26Time";

/**
 * Reproductor ASU26. Solo existe UN iframe montado: el de la señal
 * seleccionada. Al cambiar de señal se desmonta el anterior (key) y se monta
 * el nuevo. No se carga nada hasta que el usuario pulsa Play.
 */
export function Asu26Player({ cfg, nextIso }: { cfg: Asu26StreamingConfig; nextIso?: string | null }) {
  const vtz = useViewerTz();
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
      <div className="flex aspect-video w-full items-center justify-center asu-dark rounded-2xl border border-border bg-asu-deep p-6 text-center text-sm text-muted-foreground">
        Señal no disponible en este momento.
      </div>
    );
  }

  return (
    <div className="asu-dark overflow-hidden rounded-2xl bg-background">
      {tabs.length > 1 && (
        <div role="tablist" aria-label="Seleccionar señal" className="grid grid-cols-4 gap-1 border-b border-border/60 px-2">
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
                className={`font-condensed min-h-11 -mb-px border-b-2 px-2 text-xs font-bold uppercase tracking-[2px] transition-all duration-200 sm:text-sm ${
                  on ? "border-asu-coral text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="relative aspect-video w-full overflow-hidden bg-asu-deep">
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
            className="asu-player-bg group absolute inset-0 flex flex-col items-center justify-center gap-4"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold text-background shadow-2xl transition-transform duration-300 group-hover:scale-110 md:h-20 md:w-20">
              <Play className="ml-1 h-7 w-7 md:h-9 md:w-9" fill="currentColor" />
            </span>
            <span className="font-condensed text-xs font-bold uppercase tracking-[3px] text-foreground/90">
              Señal {label}
            </span>
            {nextIso && cfg.streamStatus !== "live" && (
              <span className="font-condensed rounded-lg border border-foreground/15 bg-background/50 px-4 py-2 text-center text-[11px] uppercase tracking-[2px] text-foreground/85 backdrop-blur">
                <span className="block font-bold text-gold">Próxima transmisión</span>
                <span className="mt-0.5 block">
                  {new Intl.DateTimeFormat("es-ES", { timeZone: ASU26_TZ, day: "numeric", month: "short" }).format(new Date(nextIso))} · {hhmm(nextIso, ASU26_TZ)} Asunción
                </span>
                {vtz && vtz !== ASU26_TZ && <span className="block text-muted-foreground">Tu hora: {hhmm(nextIso, vtz)}</span>}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
