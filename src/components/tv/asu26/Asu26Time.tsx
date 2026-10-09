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

/** Zona IANA → país legible (sin geolocalización: solo la zona del navegador). */
const TZ_COUNTRY: Record<string, [string, string]> = {
  "Europe/Madrid": ["España peninsular", "es"], "Atlantic/Canary": ["Canarias", "es"], "Africa/Ceuta": ["España", "es"],
  "Europe/Lisbon": ["Portugal", "pt"], "Atlantic/Madeira": ["Portugal", "pt"], "Atlantic/Azores": ["Azores", "pt"],
  "America/Bogota": ["Colombia", "co"], "America/Asuncion": ["Paraguay", "py"],
  "Europe/Rome": ["Italia", "it"], "Europe/Paris": ["Francia", "fr"], "Europe/Brussels": ["Bélgica", "be"],
  "Europe/Amsterdam": ["Países Bajos", "nl"], "Europe/Berlin": ["Alemania", "de"], "Europe/Zurich": ["Suiza", "ch"],
  "Europe/Vienna": ["Austria", "at"], "Europe/London": ["Reino Unido", "gb"], "Europe/Dublin": ["Irlanda", "ie"],
  "Europe/Warsaw": ["Polonia", "pl"], "Europe/Prague": ["Chequia", "cz"], "Europe/Stockholm": ["Suecia", "se"],
  "Europe/Oslo": ["Noruega", "no"], "Europe/Copenhagen": ["Dinamarca", "dk"], "Europe/Helsinki": ["Finlandia", "fi"],
  "Europe/Tallinn": ["Estonia", "ee"], "Europe/Riga": ["Letonia", "lv"], "Europe/Vilnius": ["Lituania", "lt"],
  "Europe/Kyiv": ["Ucrania", "ua"], "Europe/Kiev": ["Ucrania", "ua"], "Europe/Istanbul": ["Turquía", "tr"],
  "Europe/Budapest": ["Hungría", "hu"], "Europe/Athens": ["Grecia", "gr"], "Asia/Jerusalem": ["Israel", "il"],
  "America/Mexico_City": ["México", "mx"], "America/Guatemala": ["Guatemala", "gt"], "America/Costa_Rica": ["Costa Rica", "cr"],
  "America/Panama": ["Panamá", "pa"], "America/Puerto_Rico": ["Puerto Rico", "pr"], "America/Santo_Domingo": ["R. Dominicana", "do"],
  "America/Havana": ["Cuba", "cu"], "America/Caracas": ["Venezuela", "ve"], "America/Guayaquil": ["Ecuador", "ec"],
  "America/Lima": ["Perú", "pe"], "America/Santiago": ["Chile", "cl"], "America/Argentina/Buenos_Aires": ["Argentina", "ar"],
  "America/Buenos_Aires": ["Argentina", "ar"], "America/Montevideo": ["Uruguay", "uy"], "America/La_Paz": ["Bolivia", "bo"],
  "America/Sao_Paulo": ["Brasil", "br"], "America/El_Salvador": ["El Salvador", "sv"], "America/Tegucigalpa": ["Honduras", "hn"],
  "America/Managua": ["Nicaragua", "ni"], "America/New_York": ["EE. UU. (Este)", "us"], "America/Chicago": ["EE. UU. (Centro)", "us"],
  "America/Denver": ["EE. UU. (Montaña)", "us"], "America/Los_Angeles": ["EE. UU. (Pacífico)", "us"], "America/Toronto": ["Canadá", "ca"],
  "Asia/Taipei": ["Taiwán", "tw"], "Asia/Seoul": ["Corea del Sur", "kr"], "Asia/Tokyo": ["Japón", "jp"], "Asia/Shanghai": ["China", "cn"],
  "Asia/Hong_Kong": ["Hong Kong", "hk"], "Asia/Kolkata": ["India", "in"], "Asia/Calcutta": ["India", "in"], "Asia/Jakarta": ["Indonesia", "id"],
  "Asia/Manila": ["Filipinas", "ph"], "Asia/Singapore": ["Singapur", "sg"], "Australia/Sydney": ["Australia", "au"],
  "Pacific/Auckland": ["Nueva Zelanda", "nz"], "Africa/Johannesburg": ["Sudáfrica", "za"], "Africa/Cairo": ["Egipto", "eg"],
  "Africa/Casablanca": ["Marruecos", "ma"], "Africa/Algiers": ["Argelia", "dz"],
};

export type ViewerZone = { tz: string; label: string; flag: string };

/** País del visitante a partir de su zona horaria; si no se reconoce, «Hora local». */
export function zoneInfo(tz: string): ViewerZone {
  const c = TZ_COUNTRY[tz];
  return c ? { tz, label: c[0], flag: `https://flagcdn.com/w40/${c[1]}.png` } : { tz, label: "Hora local", flag: "" };
}

export function useViewerZone(): ViewerZone | null {
  const tz = useViewerTz();
  return tz && tz !== ASU26_TZ ? zoneInfo(tz) : null;
}

export function ZoneTag({ zone, className = "" }: { zone: ViewerZone | { label: string; flag: string }; className?: string }) {
  return (
    <span className={`font-condensed inline-flex items-center gap-1.5 font-bold uppercase ${className}`}>
      {zone.flag && <img src={zone.flag} alt="" className="h-[0.8em] w-auto rounded-[1px]" loading="lazy" />}
      {zone.label}
    </span>
  );
}

export const ASU_ZONE = { label: "Asunción · PY", flag: "https://flagcdn.com/w40/py.png" };

export function hhmm(iso: string, tz: string) {
  return new Intl.DateTimeFormat("es-ES", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

/** Día del visitante distinto del día en Asunción → "+1"/"-1". */
export function dayShift(iso: string, tz: string) {
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
        <p className="font-display text-[1.6rem] font-bold text-foreground">
          {official}
          <span className="font-condensed ml-1 align-top text-[10px] font-bold tracking-[1.5px] text-gold">PY</span>
        </p>
        {showLocal && (
          <p className="font-display mt-1.5 text-[1.3rem] text-muted-foreground">
            {local}
            <span className="font-condensed ml-1 align-top text-[9px] font-bold uppercase tracking-[1.5px]">{zoneInfo(tz!).label}</span>
          </p>
        )}
      </div>
    );

  if (variant === "inline")
    return (
      <span>
        {official} PY{showLocal && <span className="text-muted-foreground"> · {local} {zoneInfo(tz!).label}</span>}
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
          <p className="mt-1 text-[10px] tracking-[2.5px] text-muted-foreground"><ZoneTag zone={zoneInfo(tz!)} /></p>
        </div>
      )}
    </div>
  );
}

/** Hora del visitante (24 h, con +1/-1 si cambia de día respecto a Asunción). Función única para todo ASU26. */
export function localHhmm(iso: string, tz: string) {
  return hhmm(iso, tz) + dayShift(iso, tz);
}

/** Sufijo " · HH:MM Zona" para textos; vacío si el visitante está en Asunción o su zona no se identifica. */
export function localSuffix(iso: string, zone: ViewerZone | null) {
  return zone ? ` · ${localHhmm(iso, zone.tz)} ${zone.label}` : "";
}

export function TzLegend({ className = "" }: { className?: string }) {
  return (
    <p className={`font-condensed inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[2.5px] text-asu-light ${className}`}>
      Horarios oficiales · Hora local de Asunción (PY)
    </p>
  );
}
