export type TimelineRow = { id: string; entry_type: string; message: string; occurred_at: string };

/** Actualizaciones minuto a minuto del Live Center (solo publicadas). Se oculta si no hay. */
export function LiveUpdates({ items, tz }: { items: TimelineRow[]; tz: string }) {
  if (!items.length) return null;
  const t = (iso: string) =>
    new Intl.DateTimeFormat("es-ES", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  return (
    <section id="minuto" className="scroll-mt-14 bg-background pb-8">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <h2 className="font-display text-xl uppercase tracking-wider text-foreground">Minuto a minuto</h2>
        <ol className="mt-3 divide-y divide-border border-y border-border">
          {items.map((e) => (
            <li key={e.id} className="flex gap-3 py-2.5">
              <time className="font-display w-12 shrink-0 text-gold">{t(e.occurred_at)}</time>
              <p className="min-w-0 break-words text-sm text-foreground">{e.message}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
