import type { Discipline } from "@/lib/medals/useMedalStandings";

const TABS: { id: Discipline; label: string }[] = [
  { id: "pista", label: "Pista" },
  { id: "circuito", label: "Circuito" },
  { id: "total", label: "Total" },
];

export function MedalDisciplineTabs({
  value,
  onChange,
  size = "md",
}: {
  value: Discipline;
  onChange: (d: Discipline) => void;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-xs";
  return (
    <div
      role="tablist"
      aria-label="Modalidad del medallero"
      className="filters-scroll -mx-1 flex gap-2 overflow-x-auto px-1"
    >
      {TABS.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={[
              "font-condensed shrink-0 rounded-md border font-bold uppercase tracking-widest transition-all",
              pad,
              active
                ? "border-gold bg-gold text-background"
                : "border-gold/50 bg-black/30 text-gold hover:bg-black/50",
            ].join(" ")}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
