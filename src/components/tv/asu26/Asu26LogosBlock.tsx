import rzLogo from "@/assets/rollerzone-logo.png";
import type { Asu26StreamingConfig } from "@/lib/tv/asu26Streaming";

/** Logo con altura óptica común (contain, sin deformar). */
function Mark({ url, text, h }: { url: string; text: string; h: string }) {
  return url ? (
    <img src={url} alt={text} loading="lazy" decoding="async" className={`w-auto max-w-[240px] object-contain ${h}`} />
  ) : (
    <span className="font-display text-3xl uppercase tracking-wider text-asu-cream md:text-4xl">{text}</span>
  );
}

/** Banda institucional bajo el reproductor: imagen personalizada (panel) o 3 columnas nativas. */
export function Asu26LogosBlock({ cfg }: { cfg: Asu26StreamingConfig }) {
  if (cfg.logosImageUrl)
    return (
      <figure className="mt-6 overflow-hidden rounded-2xl bg-asu-deep">
        <img src={cfg.logosImageUrl} alt="World Skate Games ASU26 · VeloPro · Rollerzone TV" loading="lazy" decoding="async" className="h-auto w-full object-contain" />
      </figure>
    );
  const items = [
    { tag: "Evento oficial", logo: <Mark url={cfg.logoAsu26Url} text="ASU26" h="h-16 md:h-20" />, a: "World Skate Games ASU26", b: "Patinaje de velocidad · Asunción 2026" },
    { tag: "Resultados oficiales", logo: <Mark url={cfg.logoVeloproUrl} text="VeloPro" h="h-12 md:h-14" />, a: "VeloPro", b: "Proveedor oficial de resultados" },
    { tag: "Cobertura digital", logo: <Mark url={rzLogo} text="Rollerzone TV" h="h-12 md:h-[3.75rem]" />, a: "Rollerzone TV", b: "Retransmisión y seguimiento especial en directo" },
  ];
  return (
    <section aria-label="Organización y cobertura" className="asu-dark mt-6 overflow-hidden rounded-2xl border border-asu-cream/10 bg-asu-deep shadow-[0_20px_50px_-30px_oklch(0.15_0.04_160/0.8)]">
      <div className="asu-stripe h-[3px]" aria-hidden="true" />
      <ul className="grid gap-3 p-3 sm:grid-cols-3 sm:gap-0 sm:p-0">
        {items.map((x, i) => (
          <li
            key={x.a}
            className={`flex flex-col items-center rounded-xl bg-asu-cream/[0.03] px-5 py-7 text-center sm:rounded-none sm:bg-transparent sm:px-8 sm:py-10 ${i > 0 ? "sm:border-l sm:border-asu-cream/10" : ""}`}
          >
            <p className="font-condensed text-[11px] font-bold uppercase tracking-[3.5px] text-gold">{x.tag}</p>
            <div className="mt-5 flex h-20 w-full items-center justify-center md:h-24">{x.logo}</div>
            <p className="font-display mt-5 text-xl uppercase tracking-wide text-asu-cream md:text-2xl">{x.a}</p>
            <p className="mt-1.5 max-w-[26ch] text-sm leading-snug text-asu-cream/85">{x.b}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
