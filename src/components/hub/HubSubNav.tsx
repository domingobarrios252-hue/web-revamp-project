import { Link, useLocation } from "@tanstack/react-router";
import { HUB_SECTIONS, type HubSectionKey } from "@/lib/hub/useCountryHub";

export function HubSubNav({
  country,
  activeSections,
  sectionLabels,
}: {
  country: string;
  activeSections: string[];
  sectionLabels?: Record<string, string> | null;
}) {
  const location = useLocation();
  // Respect the order defined in activeSections (admin can reorder)
  const byKey = new Map(HUB_SECTIONS.map((s) => [s.key, s] as const));
  const sections = activeSections
    .map((k) => byKey.get(k as HubSectionKey))
    .filter((s): s is (typeof HUB_SECTIONS)[number] => Boolean(s));

  const labelFor = (key: HubSectionKey, fallback: string) => {
    const override = sectionLabels?.[key]?.trim();
    return override && override.length > 0 ? override : fallback;
  };

  const isActive = (key: HubSectionKey) => {
    const base = `/hub/${country}`;
    if (key === "inicio") return location.pathname === base || location.pathname === `${base}/`;
    return location.pathname.startsWith(`${base}/${key}`);
  };

  return (
    <nav className="sticky top-14 z-40 bg-[#1A1A1A]/95 backdrop-blur-md border-b border-[#333]">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-center gap-8 md:gap-10 overflow-x-auto hide-scrollbar py-4 md:py-5">
          {sections.map((s) => {
            const active = isActive(s.key);
            const base =
              "text-[11px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors pb-3 -mb-[17px] md:-mb-[21px] border-b-2";
            const cls = active
              ? `${base} text-[#D4A017] border-[#D4A017]`
              : `${base} text-[#888] hover:text-white border-transparent`;
            const label = labelFor(s.key, s.label);
            return (
              <HubSectionLink
                key={s.key}
                country={country}
                section={s.key}
                className={cls}
              >
                {label}
              </HubSectionLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function HubSectionLink({
  country,
  section,
  className,
  children,
}: {
  country: string;
  section: HubSectionKey;
  className?: string;
  children: React.ReactNode;
}) {
  if (section === "inicio") {
    return (
      <Link to="/hub/$country" params={{ country }} className={className}>
        {children}
      </Link>
    );
  }
  // Each section has its own dedicated route — link directly so we don't
  // fall through to the generic "Próximamente" placeholder.
  switch (section) {
    case "competicion":
      return (
        <Link to="/hub/$country/competicion" params={{ country }} className={className}>
          {children}
        </Link>
      );
    case "clubes":
      return (
        <Link to="/hub/$country/clubes" params={{ country }} className={className}>
          {children}
        </Link>
      );
    case "patinadores":
      return (
        <Link to="/hub/$country/patinadores" params={{ country }} className={className}>
          {children}
        </Link>
      );
    case "federaciones":
      return (
        <Link to="/hub/$country/federaciones" params={{ country }} className={className}>
          {children}
        </Link>
      );
    case "tv":
      return (
        <Link to="/hub/$country/tv" params={{ country }} className={className}>
          {children}
        </Link>
      );
    case "live":
      return (
        <Link to="/hub/$country/live" params={{ country }} className={className}>
          {children}
        </Link>
      );
    case "mvp":
      return (
        <Link to="/hub/$country/mvp" params={{ country }} className={className}>
          {children}
        </Link>
      );
    case "entrevistas":
      return (
        <Link to="/hub/$country/entrevistas" params={{ country }} className={className}>
          {children}
        </Link>
      );
    case "archivo":
      return (
        <Link to="/hub/$country/archivo" params={{ country }} className={className}>
          {children}
        </Link>
      );
    case "comunidad":
      return (
        <Link to="/hub/$country/comunidad" params={{ country }} className={className}>
          {children}
        </Link>
      );
    default:
      return (
        <Link
          to="/hub/$country/$section"
          params={{ country, section }}
          className={className}
        >
          {children}
        </Link>
      );
  }
}
