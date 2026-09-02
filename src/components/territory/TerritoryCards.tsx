import { Link } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { cropObjectPosition } from "@/lib/imageCrops";
import type { Territory } from "@/lib/territory/territories";
import type { TerritoryInterview, TerritoryNews } from "@/lib/territory/useTerritory";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

/** Cabecera editorial de una delegación territorial. */
export function TerritoryMasthead({
  territory,
  subtitle,
}: {
  territory: Territory;
  subtitle?: string;
}) {
  return (
    <header className="border-b border-border pb-6">
      <div className="font-condensed mb-2 inline-flex items-center gap-2 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background">
        <span aria-hidden>{territory.flag}</span> Edición territorial
      </div>
      <h1 className="font-display text-4xl uppercase tracking-widest md:text-5xl">
        ROLLER<span className="text-gold">ZONE</span> {territory.name.toUpperCase()}
      </h1>
      <p className="font-condensed mt-2 text-sm uppercase tracking-widest text-muted-foreground">
        {subtitle ?? territory.subtitle}
      </p>
    </header>
  );
}

/** Noticia destacada del territorio (portada). */
export function TerritoryLead({ item, territory }: { item: TerritoryNews; territory: Territory }) {
  return (
    <Link
      to="/noticias/articulo/$slug"
      params={{ slug: item.slug }}
      className="group grid gap-5 border border-border bg-surface transition-colors hover:border-gold md:grid-cols-2"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-background md:aspect-auto md:h-full">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            style={{ objectPosition: cropObjectPosition(item.image_crops, "hero") }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            RollerZone {territory.name}
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center gap-3 p-5 md:p-7">
        <span className="font-condensed inline-flex w-fit items-center gap-2 bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background">
          Portada {territory.name}
        </span>
        <h2 className="font-display text-2xl uppercase leading-tight tracking-wide text-foreground md:text-4xl">
          {item.title}
        </h2>
        {item.excerpt && <p className="text-sm leading-relaxed text-muted-foreground">{item.excerpt}</p>}
        <div className="font-condensed flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
          <span className="text-foreground">{item.author}</span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gold" /> {dateFmt(item.published_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function TerritoryNewsCard({ item, territory }: { item: TerritoryNews; territory: Territory }) {
  return (
    <Link
      to="/noticias/articulo/$slug"
      params={{ slug: item.slug }}
      className="group flex flex-col border border-border bg-surface transition-colors hover:border-gold"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-background">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            loading="lazy"
            style={{ objectPosition: cropObjectPosition(item.image_crops, "card") }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            {territory.name}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg uppercase leading-tight tracking-wide text-foreground group-hover:text-gold">
          {item.title}
        </h3>
        {item.excerpt && <p className="line-clamp-3 text-sm text-muted-foreground">{item.excerpt}</p>}
        <div className="font-condensed mt-auto pt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
          {dateFmt(item.published_at)}
        </div>
      </div>
    </Link>
  );
}

export function TerritoryInterviewCard({ item }: { item: TerritoryInterview }) {
  return (
    <Link
      to="/entrevistas/$slug"
      params={{ slug: item.slug }}
      className="group flex flex-col border border-border bg-surface transition-colors hover:border-gold"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-background">
        {item.cover_url ? (
          <img
            src={item.cover_url}
            alt={item.interviewee_name}
            loading="lazy"
            style={{ objectPosition: cropObjectPosition(item.cover_crops, "card") }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Entrevista
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
          {item.interviewee_name}
        </span>
        <h3 className="font-display text-lg uppercase leading-tight tracking-wide text-foreground group-hover:text-gold">
          {item.title}
        </h3>
        {item.excerpt && <p className="line-clamp-3 text-sm text-muted-foreground">{item.excerpt}</p>}
        <div className="font-condensed mt-auto pt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
          {dateFmt(item.interview_date)}
        </div>
      </div>
    </Link>
  );
}
