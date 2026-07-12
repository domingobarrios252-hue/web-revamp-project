import { SPAIN_CALLUP, type Roster } from "@/lib/specials/europeo-2026";

function CategoryList({ title, names }: { title: string; names: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
        {title}
      </div>
      {names.length === 0 ? (
        <p className="mt-3 text-sm italic text-muted-foreground">
          Convocatoria pendiente de publicar.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {names.map((n) => (
            <li
              key={n}
              className="border-b border-border/60 pb-1.5 text-sm text-foreground last:border-0"
            >
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RosterColumn({ title, roster }: { title: string; roster: Roster }) {
  return (
    <div>
      <h3 className="font-display text-xl uppercase tracking-wider text-foreground md:text-2xl">
        {title}
      </h3>
      <div className="mt-2 h-[3px] w-16 bg-gold" />
      <div className="mt-5 grid gap-4">
        <CategoryList title="Sénior" names={roster.senior} />
        <CategoryList title="Júnior" names={roster.junior} />
        <CategoryList title="Juvenil" names={roster.juvenil} />
      </div>
    </div>
  );
}

export function CallupRoster() {
  return (
    <section className="bg-background py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
              Selección Española
            </div>
            <h2 className="font-display mt-2 text-2xl uppercase tracking-wider text-foreground md:text-3xl">
              Convocados para el Europeo 2026
            </h2>
            <div className="mt-3 h-[3px] w-24 bg-gold" />
          </div>
          <div className="font-condensed text-right text-[11px] uppercase tracking-[2.5px] text-muted-foreground">
            Seleccionador
            <div className="font-display mt-1 text-base text-foreground">
              {SPAIN_CALLUP.coach}
            </div>
          </div>
        </header>

        {SPAIN_CALLUP.imageUrl && (
          <figure className="mb-10 overflow-hidden rounded-xl border border-border">
            <img loading="lazy" decoding="async"
              src={SPAIN_CALLUP.imageUrl}
              alt="Convocatoria oficial de la selección española"
              className="h-auto w-full object-cover"
            />
          </figure>
        )}

        <div className="grid gap-10 md:grid-cols-2">
          <RosterColumn title="Selección masculina" roster={SPAIN_CALLUP.masculino} />
          <RosterColumn title="Selección femenina" roster={SPAIN_CALLUP.femenino} />
        </div>
      </div>
    </section>
  );
}
