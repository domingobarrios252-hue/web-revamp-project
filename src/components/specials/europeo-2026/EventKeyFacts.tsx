import { Calendar, MapPin, Trophy, Globe } from "lucide-react";
import { EVENT } from "@/lib/specials/europeo-2026";

export function EventKeyFacts() {
  const items = [
    { icon: Trophy, label: "Campeonato", value: EVENT.shortName },
    { icon: MapPin, label: "Sede", value: `${EVENT.venue} · ${EVENT.region}` },
    { icon: Calendar, label: "Fechas", value: EVENT.datesLabel },
    { icon: Globe, label: "Disciplinas", value: EVENT.disciplines.join(" · ") },
  ];
  return (
    <section className="border-y border-border bg-surface/60">
      <div className="mx-auto grid max-w-7xl gap-px bg-border md:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-4 bg-surface p-5">
            <it.icon className="h-6 w-6 shrink-0 text-gold" />
            <div>
              <div className="font-condensed text-[10px] font-bold uppercase tracking-[2.5px] text-muted-foreground">
                {it.label}
              </div>
              <div className="font-display mt-1 text-sm uppercase tracking-wider text-foreground">
                {it.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
