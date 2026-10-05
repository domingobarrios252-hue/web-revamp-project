import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Play, ShieldCheck } from "lucide-react";
import rzLogo from "@/assets/rollerzone-logo.png";
import veloproLogo from "@/assets/logo-velopro.png.asset.json";
import medalArt from "@/assets/asu26-medal-art.jpg.asset.json";

/** Cabecera especial de Rollerzone TV durante los World Skate Games ASU26 (identidad crema/verde/coral). */
export function Asu26TvHero({ logoUrl }: { logoUrl?: string }) {
  return (
    <section aria-label="World Skate Games ASU26 en directo por Rollerzone.TV" className="relative isolate overflow-hidden bg-asu-cream text-asu-ink">
      {/* Grafismo geométrico ASU26: curvas de pista y diagonales */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-40 md:opacity-100"
        viewBox="0 0 1440 520"
        preserveAspectRatio="xMidYMid slice"
      >
        <path d="M0 40L520 -10L560 30L0 90Z" className="fill-asu/80" />
        <path d="M480 70H900L870 98H450Z" className="fill-asu-coral/80" />
        <path d="M560 110H880L860 128H540Z" className="fill-asu-pink/70" />
        <path d="M1440 140C1300 150 1220 190 1180 260L1440 300Z" className="fill-asu-pink/60" />
        <path d="M1440 300C1320 300 1240 340 1200 420L1440 440Z" className="fill-asu-coral/85" />
        <path d="M1440 440C1340 440 1270 480 1250 520H1440Z" className="fill-asu/85" />
        <path d="M420 520L1100 380L1120 410L520 520Z" className="fill-asu/70" />
        <path d="M640 520L1180 420L1190 440L720 520Z" className="fill-asu-coral/70" />
        <path d="M820 520L1210 450L1215 465L880 520Z" className="fill-asu-pink/70" />
      </svg>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 md:grid-cols-[1.4fr_1fr] md:items-center lg:grid-cols-[minmax(0,300px)_1.4fr_1fr] md:px-8 md:py-14">
        <img
          src={medalArt.url}
          alt="Medalla World Skate Games ASU26 · Asunción - Paraguay"
          className="order-last mx-auto hidden h-auto w-full max-w-[300px] object-contain mix-blend-multiply [mask-image:radial-gradient(closest-side,black_60%,transparent_98%)] lg:order-none lg:block"
          loading="eager"
        />
        <div className="asu-reveal flex min-w-0 flex-col">
          <p className="font-condensed text-sm font-bold uppercase tracking-[3px] text-asu md:text-base">
            World Skate Games <span className="text-asu-coral">ASU26</span> · Patinaje de velocidad
          </p>
          <h1 className="font-display mt-3 break-words text-[2.6rem] uppercase leading-[0.92] tracking-wide sm:text-6xl lg:text-7xl">
            En directo por <span className="block text-asu">Rollerzone<span className="text-asu-coral">.TV</span></span>
          </h1>
          <div className="order-last mt-4 flex flex-wrap gap-x-5 md:order-none gap-y-1.5 text-sm font-semibold md:text-base">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-asu-coral" /> Del 10 al 18 de octubre
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-asu-coral" /> Asunción, Paraguay
            </span>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              to="/rollerzone-tv/world-skate-games-asu26"
              hash="directo"
              className="font-condensed inline-flex min-h-12 items-center gap-2.5 rounded-full bg-asu-coral px-7 text-sm font-bold uppercase tracking-widest text-asu-ink shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-asu-ink"
            >
              <Play className="h-4 w-4 fill-current" /> Ver en directo
            </Link>
            <span className="font-condensed inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[2px] text-asu">
              <ShieldCheck className="h-4 w-4 shrink-0" /> Streaming autorizado por World Skate
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 md:items-end">
          <div className="flex w-full max-w-sm items-center gap-4 rounded-2xl bg-asu-deep p-4 shadow-xl">
            <img src={rzLogo} alt="Rollerzone.es" className="h-auto w-[55%] min-w-0 object-contain" />
            {logoUrl && <img src={logoUrl} alt="World Skate Games ASU26" className="h-12 w-auto max-w-[40%] object-contain" />}
          </div>
          <div className="w-full max-w-sm rounded-2xl bg-asu-cream p-4 ring-1 ring-asu/25">
            <p className="font-display text-2xl uppercase leading-none tracking-wide text-asu-ink">Resultados oficiales</p>
            <p className="font-condensed mt-1 text-[11px] font-semibold uppercase tracking-[2px] text-asu-ink/60">ofrecidos por VeloPro</p>
            <img
              src={veloproLogo.url}
              alt="VeloPro"
              className="mt-3 h-auto w-[78%] max-w-[240px] object-contain mix-blend-multiply"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
