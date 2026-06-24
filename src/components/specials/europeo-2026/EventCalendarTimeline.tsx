import { EVENT_PROGRAM } from "@/lib/specials/europeo-2026";

const KIND_LABEL: Record<string, string> = {
  ceremony: "Apertura",
  track: "Pista",
  rest: "Descanso",
  road: "Ruta",
  marathon: "Maratón",
};

export function EventCalendarTimeline() {
  return (
    <section className="bg-background py-12 md:py-16">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <header className="mb-8">
          <div className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
            Programa oficial
          </div>
          <h2 className="font-display mt-2 text-2xl uppercase tracking-wider text-foreground md:text-3xl">
            Día a día del Europeo
          </h2>
          <div className="mt-3 h-[3px] w-24 bg-gold" aria-hidden="true" />
        </header>

        <ol className="relative space-y-4 border-l-2 border-gold/30 pl-6">
          {EVENT_PROGRAM.map((d) => (
            <li key={d.date} className="relative">
              <span className="absolute -left-[31px] top-2 h-3 w-3 rounded-full border-2 border-gold bg-background" />
              <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-condensed text-[10px] font-bold uppercase tracking-[2.5px] text-gold">
                    {d.label}
                  </span>
                  <span className="font-condensed inline-block border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-[2px] text-muted-foreground">
                    {KIND_LABEL[d.kind]}
                  </span>
                </div>
                <h3 className="font-display mt-1 text-base uppercase tracking-wider text-foreground md:text-lg">
                  {d.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
