import { useEffect, useState } from "react";

/**
 * Cuenta atrás reutilizable hasta una fecha objetivo.
 * Devuelve días / horas / minutos / segundos.
 * Si la fecha ya pasó, muestra "EN CURSO".
 */
export function Countdown({ target, compact = false }: { target: string | Date; compact?: boolean }) {
  const targetMs = typeof target === "string" ? new Date(target).getTime() : target.getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = targetMs - now;

  if (diff <= 0) {
    return (
      <span className="font-condensed inline-flex items-center gap-1.5 bg-tv-red px-2 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-white">
        <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
        En curso
      </span>
    );
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  if (compact) {
    return (
      <span className="font-condensed inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-gold">
        {days > 0 && <span className="font-display text-sm">{days}d</span>}
        <span className="font-display text-sm">{String(hours).padStart(2, "0")}h</span>
        <span className="font-display text-sm">{String(minutes).padStart(2, "0")}m</span>
      </span>
    );
  }

  return (
    <div className="flex items-stretch gap-1.5">
      <CountUnit value={days} label="días" />
      <CountUnit value={hours} label="hrs" />
      <CountUnit value={minutes} label="min" />
      <CountUnit value={seconds} label="seg" />
    </div>
  );
}

function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[44px] flex-col items-center justify-center border border-gold/40 bg-background/80 px-2 py-1.5 leading-none">
      <span className="font-display text-lg tracking-wider text-gold">
        {String(value).padStart(2, "0")}
      </span>
      <span className="font-condensed mt-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
