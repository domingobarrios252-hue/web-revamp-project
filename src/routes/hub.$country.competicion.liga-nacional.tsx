import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LigaSubNav } from "@/components/hub/LigaSubNav";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/hub/$country/competicion/liga-nacional")({
  head: ({ params }) => ({
    meta: [
      { title: `Liga Nacional — Hub ${params.country.toUpperCase()} — RollerZone` },
      {
        name: "description",
        content: `Toda la Liga Nacional de patinaje de velocidad en ${params.country.toUpperCase()}: clasificaciones, calendario, resultados y noticias.`,
      },
    ],
  }),
  component: LigaLayout,
});

function LigaLayout() {
  const { country } = Route.useParams();
  return (
    <div>
      <div className="border-b border-[#1F1F1F] bg-gradient-to-r from-[#0A0A0A] via-[#141414] to-[#0A0A0A]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-[#D4A017] text-[#1A1A1A]">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="font-ui text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4A017]">
              Competición · {country.toUpperCase()}
            </div>
            <h1 className="font-display text-xl md:text-2xl font-black text-[#F5F5F5] leading-tight">
              Liga Nacional
            </h1>
          </div>
        </div>
      </div>
      <LigaSubNav country={country} />
      <Outlet />
    </div>
  );
}
