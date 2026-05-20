import { Link, useLocation } from "@tanstack/react-router";

const ITEMS = [
  { key: "liga-nacional", label: "Liga Nacional" },
  { key: "campeonatos-espana", label: "Campeonatos" },
  { key: "resultados", label: "Resultados" },
  { key: "calendario", label: "Calendario" },
] as const;

export function CompeticionSubNav({ country }: { country: string }) {
  const location = useLocation();
  const base = `/hub/${country}/competicion`;

  return (
    <div className="border-b border-[#222] bg-[#141414]">
      <div className="mx-auto max-w-7xl overflow-x-auto px-4 md:px-6">
        <ul className="flex h-11 items-center gap-1 whitespace-nowrap">
          <li>
            <Link
              to="/hub/$country/competicion"
              params={{ country }}
              className={navCls(location.pathname === base || location.pathname === `${base}/`)}
            >
              Inicio
            </Link>
          </li>
          {ITEMS.map((it) => {
            const active = location.pathname.startsWith(`${base}/${it.key}`);
            // Only liga-nacional has its own routes today; rest will be placeholders via section route.
            if (it.key === "liga-nacional") {
              return (
                <li key={it.key}>
                  <Link
                    to="/hub/$country/competicion/liga-nacional"
                    params={{ country }}
                    className={navCls(active)}
                  >
                    {it.label}
                  </Link>
                </li>
              );
            }
            return (
              <li key={it.key}>
                <span className={navCls(false) + " opacity-50 cursor-not-allowed"} title="Próximamente">
                  {it.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function navCls(active: boolean) {
  return `font-ui inline-flex items-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] rounded-[3px] transition-colors ${
    active ? "bg-[#D4A017] text-[#1A1A1A]" : "text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#1F1F1F]"
  }`;
}
