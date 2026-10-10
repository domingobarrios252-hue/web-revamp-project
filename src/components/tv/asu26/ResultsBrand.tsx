import veloproLogo from "@/assets/logo-velopro-tight.png.asset.json";
import rzLogo from "@/assets/rollerzone-logo.png";

/** Marca ROLLERZONE.ES (esquina superior derecha de cada clasificación). */
export function RollerzoneMark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex shrink-0 flex-col items-end leading-none ${className}`}>
      <img src={rzLogo} alt="Rollerzone" className="h-5 w-auto max-w-[110px] object-contain sm:h-6 sm:max-w-[130px]" />
      <span className="font-condensed mt-0.5 text-[10px] font-bold uppercase tracking-[2px] text-gold">rollerzone.es</span>
    </span>
  );
}

/** Crédito «Resultados ofrecidos por VeloPro» junto al título de la prueba. */
export function VeloproCredit({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="inline-flex h-6 items-center rounded bg-foreground px-1.5">
        <img src={veloproLogo.url} alt="VeloPro" className="h-4 w-auto max-w-[72px] object-contain" />
      </span>
      <span className="font-condensed text-[10px] font-bold uppercase leading-tight tracking-[1.5px] text-asu-light">
        Resultados ofrecidos por VeloPro
      </span>
    </span>
  );
}
