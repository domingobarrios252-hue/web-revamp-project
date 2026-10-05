import { useEffect, useState } from "react";
import { ASU26_TZ } from "@/lib/tv/asu26Streaming";

/** Zona horaria del visitante (solo tras hidratar; null en SSR). */
export function useViewerTz() {
  const [tz, setTz] = useState<string | null>(null);
  useEffect(() => {
    try {
      setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || null);
    } catch {
      setTz(null);
    }
  }, []);
  return tz;
}

export function hhmm(iso: string, tz: string) {
  return new Intl.DateTimeFormat("es-ES", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

/** Día del visitante distinto del día en Asunción → "+1"/"-1". */
function dayShift(iso: string, tz: string) {
  const f = (z: string) => new Intl.DateTimeFormat("en-CA", { timeZone: z, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
  const a = f(ASU26_TZ), b = f(tz);
  if (a === b) return "";
  return b > a ? " +1" : " -1";
}

/**
 * Hora oficial (Asunción) con jerarquía principal + hora del visitante
 * secundaria. Conversión solo en interfaz, por zona IANA (sin offsets fijos).
 */
export function DualTime({ iso, variant = "stack" }: { iso: string; variant?: "stack" | "compact" | "inline" }) {
  const tz = useViewerTz();
  const official = hhmm(iso, ASU26_TZ);
  const showLocal = !!tz && tz !== ASU26_TZ;
  const local = showLocal ? hhmm(iso, tz!) + dayShift(iso, tz!) : "";

  if (variant === "compact")
    return (
      <div className="text-center leading-none">
        <p className="font-display text-2xl text-foreground">{official}</p>
        <p className="font-condensed mt-0.5 text-[9px] font-bold uppercase tracking-[2px] text-gold">PY</p>
        {showLocal && (
          <p className="font-condensed mt-1.5 text-[11px] text-muted-foreground">
            {local} <span className="text-[9px] uppercase tracking-[1.5px]">local</span>
          </p>
        )}
      </div>
    );

  if (variant === "inline")
    return (
      <span>
        {official} PY{showLocal && <span className="text-muted-foreground"> · {local} tu hora</span>}
      </span>
    );

  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
      <div>
        <p className="font-display text-4xl leading-none text-foreground md:text-5xl">{official}</p>
        <p className="font-condensed mt-1 text-[10px] font-bold uppercase tracking-[2.5px] text-gold">
          <span className="md:hidden">Hora PY</span>
          <span className="hidden md:inline">Hora Asunción</span>
        </p>
      </div>
      {showLocal && (
        <div>
          <p className="font-display text-2xl leading-none text-muted-foreground md:text-3xl">{local}</p>
          <p className="font-condensed mt-1 text-[10px] uppercase tracking-[2.5px] text-muted-foreground">Tu hora</p>
        </div>
      )}
    </div>
  );
}

export function TzLegend({ className = "" }: { className?: string }) {
  return (
    <p className={`font-condensed inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[2.5px] text-asu-light ${className}`}>
      Horarios oficiales · Hora local de Asunción (PY)
    </p>
  );
}
