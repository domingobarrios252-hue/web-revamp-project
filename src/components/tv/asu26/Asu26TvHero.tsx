import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Play, ShieldCheck } from "lucide-react";
import rzLogo from "@/assets/rollerzone-logo.png";
import veloproLogo from "@/assets/logo-velopro-tight.png.asset.json";
import medalArt from "@/assets/asu26-medal-art.jpg.asset.json";

/** Cabecera especial de Rollerzone TV durante los World Skate Games ASU26 (identidad crema/verde/coral). */
export function Asu26TvHero({ logoUrl }: { logoUrl?: string }) {
  return (
    <section
      aria-label="World Skate Games ASU26 en directo por Rollerzone.TV"
      className="relative isolate overflow-hidden bg-asu-cream text-asu-ink"
    >
      {/* Grafismo ASU26 simplificado: solo en bordes, nunca detrás de los textos */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden h-full w-full md:block"
        viewBox="0 0 1440 460"
        preserveAspectRatio="xMidYMid slice"
      >
        <path d="M0 0H420L380 26H0Z" className="fill-asu/80" />
        <path d="M0 34H330L306 48H0Z" className="fill-asu-coral/70" />
        <path d="M1440 120C1330 130 1270 170 1240 230L1440 250Z" className="fill-asu-pink/55" />
        <path d="M1440 270C1340 272 1280 310 1255 380L1440 390Z" className="fill-asu-coral/75" />
        <path d="M1440 400C1360 400 1310 430 1295 460H1440Z" className="fill-asu/85" />
        <path d="M560 460L1180 400L1186 418L680 460Z" className="fill-asu/60" />
        <path d="M760 460L1200 424L1204 436L840 460Z" className="fill-asu-coral/60" />
      </svg>
      {/* Móvil: solo un acento inferior suave */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-1.5 bg-gradient-to-r from-asu via-asu-coral to-asu-pink md:hidden" />

      <div className="mx-auto grid max-w-7xl gap-7 px-5 py-8 md:grid-cols-[1.5fr_1fr] md:items-center md:gap-8 md:px-8 md:py-10 lg:grid-cols-[minmax(0,230px)_1.6fr_1fr]">
        <img
          src={medalArt.url}
          alt="Medalla World Skate Games ASU26 · Asunción - Paraguay"
          className="mx-auto hidden h-auto w-full max-w-[230px] object-contain mix-blend-multiply [mask-image:radial-gradient(closest-side,black_58%,transparent_96%)] lg:block"
          loading="eager"
        />

        <div className="asu-reveal flex min-w-0 flex-col">
          <p className="font-condensed text-xs font-bold uppercase tracking-[2.5px] text-asu md:text-sm">
            World Skate Games <span className="text-asu-coral">ASU26</span>
            <span className="mx-2 text-asu/40">·</span>Patinaje de velocidad
          </p>
          <h1 className="font-display mt-3 break-words text-[2.9rem] uppercase leading-[0.98] tracking-[0.02em] sm:text-6xl lg:text-[5.25rem]">
            <span className="block text-asu-ink">En directo por</span>
            <span className="block text-asu">
              Rollerzone<span className="text-asu-coral">.TV</span>
            </span>
          </h1>

          <div className="order-last mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold md:order-none md:text-base">
            <span className="inline-flex items-center gap-2 leading-none">
              <CalendarDays className="h-[1.05em] w-[1.05em] shrink-0 text-asu-coral" /> Del 10 al 18 de octubre
            </span>
            <span className="inline-flex items-center gap-2 leading-none">
              <MapPin className="h-[1.05em] w-[1.05em] shrink-0 text-asu-coral" /> Asunción, Paraguay
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              to="/rollerzone-tv/world-skate-games-asu26"
              hash="directo"
              className="font-condensed inline-flex min-h-14 items-center gap-3 rounded-xl bg-asu-coral px-9 text-base font-bold uppercase tracking-[2px] text-asu-ink shadow-[0_10px_24px_-10px_var(--asu-coral)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_14px_30px_-10px_var(--asu-coral)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-asu-ink focus-visible:ring-offset-2 focus-visible:ring-offset-asu-cream"
            >
              <Play className="h-5 w-5 fill-current" /> Ver en directo
            </Link>
            <span className="font-condensed inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[1.5px] text-asu-ink/80">
              <ShieldCheck className="h-4 w-4 shrink-0 text-asu" /> Streaming autorizado por World Skate
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col md:items-end">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-asu-cream shadow-[0_12px_30px_-18px_var(--asu-ink)] ring-1 ring-asu/20">
            <div className="flex items-center justify-between gap-4 bg-asu-deep px-5 py-3">
              <img src={rzLogo} alt="Rollerzone.es" className="h-auto w-[58%] min-w-0 object-contain" />
              {logoUrl && <img src={logoUrl} alt="World Skate Games ASU26" className="h-9 w-auto max-w-[34%] object-contain" />}
            </div>
            <div className="px-5 pb-5 pt-4">
              <p className="font-display text-2xl uppercase leading-none tracking-wide text-asu-ink">Resultados oficiales</p>
              <p className="font-condensed mt-1 text-[11px] font-semibold uppercase tracking-[2px] text-asu-ink/60">
                ofrecidos por VeloPro
              </p>
              <div className="mt-4 flex justify-center">
                <img
                  src={veloproLogo.url}
                  alt="VeloPro"
                  className="h-auto w-[86%] max-w-[270px] object-contain mix-blend-multiply"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
