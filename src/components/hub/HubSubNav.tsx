import { Link, useLocation } from "@tanstack/react-router";
import { HUB_SECTIONS, type HubSectionKey } from "@/lib/hub/useCountryHub";

export function HubSubNav({ country, activeSections }: { country: string; activeSections: string[] }) {
  const location = useLocation();
  const sections = HUB_SECTIONS.filter((s) => activeSections.includes(s.key));

  const isActive = (key: HubSectionKey) => {
    const base = `/hub/${country}`;
    if (key === "inicio") return location.pathname === base || location.pathname === `${base}/`;
    return location.pathname.startsWith(`${base}/${key}`);
  };

  return (
    <nav className="sticky top-14 z-40 border-b border-[#2A2A2A] bg-[#1A1A1A]/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl overflow-x-auto px-4 md:px-6">
        <ul className="flex h-12 items-center gap-1 md:gap-2 whitespace-nowrap">
          {sections.map((s) => {
            const active = isActive(s.key);
            const to = s.key === "inicio" ? `/hub/${country}` : `/hub/${country}/${s.key}`;
            return (
              <li key={s.key}>
                <Link
                  to={to}
                  className={`font-ui inline-flex items-center px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors rounded-[4px] ${
                    active
                      ? "bg-[#D4A017] text-[#1A1A1A]"
                      : "text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#242424]"
                  }`}
                >
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
