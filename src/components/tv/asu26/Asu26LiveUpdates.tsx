import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ASU26_TZ } from "@/lib/tv/asu26Streaming";

export type Asu26TimelineEntry = {
  id: string;
  message: string;
  occurred_at: string;
};

const INITIAL_VISIBLE = 5;

function asu26Time(iso: string) {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: ASU26_TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function Asu26LiveUpdates({ entries }: { entries: Asu26TimelineEntry[] }) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) return null;

  const visibleEntries = expanded ? entries : entries.slice(0, INITIAL_VISIBLE);
  const canExpand = entries.length > INITIAL_VISIBLE;

  return (
    <section aria-labelledby="asu26-live-updates-title" className="asu-track-soft mt-7 overflow-hidden rounded-xl bg-asu-deep/55 px-4 py-5 md:px-6 md:py-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="live-dot h-2 w-2 shrink-0 rounded-full bg-tv-red" aria-hidden="true" />
        <h2 id="asu26-live-updates-title" className="font-display text-xl uppercase tracking-wide text-foreground md:text-2xl">
          En vivo <span className="text-gold">·</span> Actualizaciones
        </h2>
      </div>

      <ol id="asu26-live-updates-list" className="divide-y divide-border/60 border-y border-border/60">
        {visibleEntries.map((entry) => (
          <li key={entry.id} className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 py-3 md:grid-cols-[4rem_minmax(0,1fr)] md:gap-4">
            <time dateTime={entry.occurred_at} className="font-condensed pt-0.5 text-[10px] font-bold uppercase tracking-[2px] text-asu-light md:text-[11px]">
              {asu26Time(entry.occurred_at)}
              <span className="mt-0.5 block text-[8px] tracking-[1.5px] text-muted-foreground">PY</span>
            </time>
            <p className="min-w-0 break-words text-sm leading-relaxed text-foreground/90 md:text-[15px]">{entry.message}</p>
          </li>
        ))}
      </ol>

      {canExpand && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          aria-controls="asu26-live-updates-list"
          onClick={() => setExpanded((value) => !value)}
          className="font-condensed mt-3 min-h-10 px-2 text-[10px] font-bold uppercase tracking-[2px] text-gold hover:bg-asu-deep/60 hover:text-gold-light"
        >
          {expanded ? "Ver menos" : `Ver más (${entries.length - INITIAL_VISIBLE})`}
          {expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        </Button>
      )}
    </section>
  );
}