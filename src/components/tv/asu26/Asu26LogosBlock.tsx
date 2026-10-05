import rzLogo from "@/assets/rollerzone-logo.png";
import type { Asu26StreamingConfig } from "@/lib/tv/asu26Streaming";

function Mark({ url, text }: { url: string; text: string }) {
  return url ? (
    <img src={url} alt={text} loading="lazy" decoding="async" className="h-auto max-h-12 w-auto max-w-[8rem] sm:max-h-14 sm:max-w-[170px] object-contain md:max-h-16 md:max-w-[200px]" />
  ) : (
    <span className="font-display text-base uppercase sm:text-xl tracking-wider text-asu-cream md:text-3xl">{text}</span>
  );
}

/** Bloque bajo el reproductor: imagen personalizada (panel) o diseño nativo con 3 marcas. */
export function Asu26LogosBlock({ cfg }: { cfg: Asu26StreamingConfig }) {
  if (cfg.logosImageUrl)
    return (
      <figure className="mt-6 overflow-hidden rounded-2xl bg-asu-deep/60">
        <img src={cfg.logosImageUrl} alt="World Skate Games ASU26 · VeloPro · Rollerzone TV" loading="lazy" decoding="async" className="h-auto w-full object-contain" />
      </figure>
    );
  const items = [
    { logo: <Mark url={cfg.logoAsu26Url} text="ASU26" />, a: "World Skate Games ASU26", b: "Patinaje de Velocidad · 10–18 octubre 2026 · Asunción · Paraguay" },
    { logo: <Mark url={cfg.logoVeloproUrl} text="VeloPro" />, a: "VeloPro", b: "Proveedor de resultados oficiales" },
    { logo: <Mark url={rzLogo} text="Rollerzone TV" />, a: "Rollerzone TV", b: "Cobertura digital oficial del patinaje de velocidad" },
  ];
  return (
    <div className="mt-6 overflow-hidden rounded-2xl bg-asu-deep/60">
      <div className="asu-stripe h-[3px]" aria-hidden="true" />
      <ul className="grid divide-y divide-border/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((x) => (
          <li key={x.a} className="flex items-center gap-4 p-4 sm:flex-col sm:p-6 sm:text-center">
            <div className="flex h-14 w-28 shrink-0 items-center justify-center overflow-hidden sm:h-20 sm:w-full">{x.logo}</div>
            <div className="min-w-0">
              <p className="font-condensed text-xs font-bold uppercase tracking-[2px] text-asu-cream">{x.a}</p>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground/80">{x.b}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
