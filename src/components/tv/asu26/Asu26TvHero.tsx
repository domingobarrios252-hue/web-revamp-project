import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Play, ShieldCheck } from "lucide-react";
import rzLogo from "@/assets/rollerzone-logo.png";

/** Cabecera especial de Rollerzone TV durante los World Skate Games ASU26 (identidad crema/verde/coral). */
export function Asu26TvHero({ logoUrl }: { logoUrl?: string }) {
  return (
    <section aria-label="World Skate Games ASU26 en directo por Rollerzone.TV" className="relative isolate overflow-hidden bg-asu-cream text-asu-ink">
      {/* Grafismo geométrico ASU26: curvas de pista y diagonales */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
        viewBox="0 0 1440 520"
        preserveAspectRatio="xMidYMid slice"
      >
        <path d="M1440 0H980C900 120 930 300 1080 400C1180 466 1320 480 1440 470Z" className="fill-asu" />
        <path d="M1440 0H1130C1070 110 1100 250 1220 320C1300 366 1380 372 1440 366Z" className="fill-asu-deep" />
        <path d="M1440 360C1330 380 1220 420 1160 520H1440Z" className="fill-asu-coral" />
        <path d="M940 520C990 430 1060 390 1140 380L1180 520Z" className="fill-asu-pink" />
        <path d="M0 520V430C140 400 260 430 360 520Z" className="fill-asu-coral/90" />
        <path d="M0 520V470C90 455 170 470 230 520Z" className="fill-asu" />
        <path d="M860 0L940 0L720 520L640 520Z" className="fill-asu-pink/60" />
        <path
          d="M1000 0C930 140 960 320 1110 420"
          fill="none"
          strokeWidth="3"
          className="stroke-asu-cream/70"
        />
      </svg>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 md:grid-cols-[1.35fr_1fr] md:items-center md:px-8 md:py-14">
        <div className="asu-reveal min-w-0">
          <p className="font-condensed text-sm font-bold uppercase tracking-[3px] text-asu md:text-base">
            World Skate Games <span className="text-asu-coral">ASU26</span> · Patinaje de velocidad
          </p>
          <h1 className="font-display mt-3 break-words text-[2.6rem] uppercase leading-[0.92] tracking-wide sm:text-6xl lg:text-7xl">
            En directo por <span className="block text-asu">Rollerzone<span className="text-asu-coral">.TV</span></span>
          </h1>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm font-semibold md:text-base">
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
          <div className="w-full max-w-sm rounded-2xl bg-asu-cream/90 p-4 ring-1 ring-asu/25 backdrop-blur-sm">
            <p className="font-condensed text-[11px] font-bold uppercase tracking-[2px] text-asu-coral">Resultados oficiales</p>
            <p className="font-display mt-1 text-xl uppercase tracking-wide">
              Ofrecidos por <span className="text-asu">VeloPro</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
