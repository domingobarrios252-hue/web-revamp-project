import { Link } from "@tanstack/react-router";
import { ArrowRight, Flame } from "lucide-react";
import type { ReactNode } from "react";

type CTA = { label: string; to: string; primary?: boolean };

export function SpecialHero({
  kicker = "Cobertura especial",
  badge = "Dossier RollerZone",
  title,
  subtitle,
  image,
  ctas,
  children,
  compact = false,
}: {
  kicker?: string;
  badge?: string;
  title: string;
  subtitle?: string;
  image: string;
  ctas?: CTA[];
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className={
        "relative overflow-hidden border-y border-gold/30 bg-background " +
        (compact ? "py-12 md:py-16" : "py-20 md:py-28")
      }
    >
      <div className="absolute inset-0">
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-[1.03] object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/70" />
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-condensed inline-flex items-center gap-2 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background shadow-lg">
            <Flame className="h-3 w-3" /> {kicker}
          </div>
          <div className="font-condensed border border-gold/50 bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-gold backdrop-blur-sm">
            {badge}
          </div>
        </div>
        <h1
          className={
            "font-display mt-5 uppercase leading-[0.95] tracking-wider text-foreground drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] " +
            (compact
              ? "text-3xl md:text-5xl"
              : "text-4xl md:text-6xl lg:text-7xl")
          }
        >
          {title}
        </h1>
        <div className="mt-5 h-[3px] w-24 bg-gold" aria-hidden="true" />
        {subtitle && (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/90 md:text-lg">
            {subtitle}
          </p>
        )}
        {children}
        {ctas && ctas.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-3">
            {ctas.map((c) => (
              <Link
                key={c.to}
                to={c.to}
                className={
                  c.primary
                    ? "font-condensed inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-background shadow-lg gold-glow-soft transition-all hover:bg-gold-light hover:translate-x-1"
                    : "font-condensed inline-flex items-center gap-2 rounded-md border border-gold/60 bg-black/30 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold backdrop-blur-sm transition-all hover:bg-black/50"
                }
              >
                {c.label} <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
