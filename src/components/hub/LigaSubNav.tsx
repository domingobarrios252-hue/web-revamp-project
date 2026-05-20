import { Link, useLocation } from "@tanstack/react-router";

const ITEMS = [
  { key: "clasificaciones", label: "Clasificaciones" },
  { key: "calendario", label: "Calendario" },
  { key: "resultados", label: "Resultados" },
  { key: "noticias", label: "Noticias" },
] as const;

export function LigaSubNav({ country }: { country: string }) {
  const location = useLocation();
  const base = `/hub/${country}/competicion/liga-nacional`;

  return (
    <div className="border-b border-[#1F1F1F] bg-[#0E0E0E]">
      <div className="mx-auto max-w-7xl overflow-x-auto px-4 md:px-6">
        <ul className="flex h-10 items-center gap-1 whitespace-nowrap">
          <li>
            <Link
              to="/hub/$country/competicion/liga-nacional"
              params={{ country }}
              className={cls(location.pathname === base || location.pathname === `${base}/`)}
              activeOptions={{ exact: true }}
            >
              Inicio Liga
            </Link>
          </li>
          {ITEMS.map((it) => {
            const active = location.pathname.startsWith(`${base}/${it.key}`);
            const to =
              it.key === "clasificaciones"
                ? "/hub/$country/competicion/liga-nacional/clasificaciones"
                : it.key === "calendario"
                  ? "/hub/$country/competicion/liga-nacional/calendario"
                  : it.key === "resultados"
                    ? "/hub/$country/competicion/liga-nacional/resultados"
                    : "/hub/$country/competicion/liga-nacional/noticias";
            return (
              <li key={it.key}>
                <Link to={to} params={{ country }} className={cls(active)}>
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function cls(active: boolean) {
  return `font-ui inline-flex items-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] rounded-[3px] transition-colors ${
    active ? "border-b-2 border-[#D4A017] text-[#F5F5F5]" : "text-[#888] hover:text-[#F5F5F5]"
  }`;
}
