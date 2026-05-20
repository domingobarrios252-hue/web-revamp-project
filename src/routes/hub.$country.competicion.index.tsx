import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Medal, ListOrdered, Calendar } from "lucide-react";

export const Route = createFileRoute("/hub/$country/competicion/")({
  component: CompeticionIndex,
});

const CARDS = [
  {
    key: "liga-nacional",
    label: "Liga Nacional",
    desc: "Clasificaciones, jornadas, resultados y noticias de la liga oficial.",
    icon: Trophy,
    available: true,
  },
  {
    key: "campeonatos-espana",
    label: "Campeonatos de España",
    desc: "Indoor, pista, circuito, maratón y categorías base.",
    icon: Medal,
    available: false,
  },
  {
    key: "resultados",
    label: "Resultados",
    desc: "Centro único de resultados nacionales.",
    icon: ListOrdered,
    available: false,
  },
  {
    key: "calendario",
    label: "Calendario",
    desc: "Todas las competiciones del patinaje español.",
    icon: Calendar,
    available: false,
  },
] as const;

function CompeticionIndex() {
  const { country } = Route.useParams();
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
      <header className="mb-8">
        <div className="font-ui text-[11px] font-bold uppercase tracking-[0.22em] text-[#D4A017]">
          Competición
        </div>
        <h1 className="mt-1 font-display text-3xl md:text-4xl font-black text-[#F5F5F5]">
          El motor del patinaje nacional
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#B5B5B5]">
          Toda la competición oficial del patinaje de velocidad organizada en un solo centro editorial: liga, campeonatos, calendario y resultados.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CARDS.map((c) => {
          const Inner = (
            <div
              className={`group h-full rounded-[6px] border bg-[#141414] p-5 transition-colors ${
                c.available
                  ? "border-[#2A2A2A] hover:border-[#D4A017]"
                  : "border-[#222] opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[6px] bg-[#D4A017]/10 text-[#D4A017]">
                  <c.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-black text-[#F5F5F5] group-hover:text-[#D4A017]">
                      {c.label}
                    </h2>
                    {!c.available && (
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-[#222] text-[#888] px-1.5 py-0.5 rounded">
                        Próx.
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-[#B5B5B5]">{c.desc}</p>
                </div>
              </div>
            </div>
          );
          if (c.available && c.key === "liga-nacional") {
            return (
              <Link
                key={c.key}
                to="/hub/$country/competicion/liga-nacional"
                params={{ country }}
              >
                {Inner}
              </Link>
            );
          }
          return <div key={c.key}>{Inner}</div>;
        })}
      </div>
    </div>
  );
}
