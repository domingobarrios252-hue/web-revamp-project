import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, Search, ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/site/LanguageToggle";
import logoUrl from "@/assets/rollerzone-logo.png";

const NAV_LINK =
  "font-ui relative inline-flex h-14 items-center px-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#B5B5B5] transition-all duration-200 hover:text-[#F5F5F5] focus-visible:text-[#F5F5F5] focus-visible:outline-none after:absolute after:inset-x-1 after:bottom-3 after:h-[2px] after:scale-x-0 after:origin-left after:bg-[#D4A017] after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:after:scale-x-100";
const NAV_ACTIVE =
  "text-[#F5F5F5] after:scale-x-100";
const SUB_LINK =
  "font-ui block py-1.5 text-sm text-[#F5F5F5]/85 transition-all duration-200 hover:text-[#D4A017] hover:translate-x-0.5";
const ACTION_BTN =
  "font-ui inline-flex items-center gap-1.5 rounded-[6px] border border-[#D4A017] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#D4A017] transition-all duration-200 hover:bg-[#D4A017] hover:text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017]/40";

type MegaItem = { labelKey: string; to: string; hash?: string };
type MegaKey = "eventos" | "resultados" | "revista" | "tv";

const MEGA: Record<MegaKey, { titleKey: string; items: MegaItem[] }> = {
  eventos: {
    titleKey: "mega.eventsTitle",
    items: [
      { labelKey: "mega.eventsUpcoming", to: "/eventos" },
      { labelKey: "mega.eventsIntl", to: "/eventos" },
      { labelKey: "mega.eventsNational", to: "/eventos" },
    ],
  },
  resultados: {
    titleKey: "mega.resultsTitle",
    items: [
      { labelKey: "mega.resultsAll", to: "/resultados" },
      { labelKey: "mega.resultsLatest", to: "/", hash: "live-center" },
      { labelKey: "nav.mvpAwards", to: "/premios-mvp" },
    ],
  },
  revista: {
    titleKey: "mega.magazineTitle",
    items: [
      { labelKey: "mega.magazineLatest", to: "/revista" },
      { labelKey: "mega.magazinePast", to: "/revista" },
    ],
  },
  tv: {
    titleKey: "mega.tvTitle",
    items: [
      { labelKey: "mega.tvLive", to: "/tv", hash: "directo" },
      { labelKey: "mega.tvBroadcasts", to: "/tv", hash: "emisiones" },
      { labelKey: "mega.tvHighlights", to: "/tv", hash: "highlights" },
    ],
  },
};

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMega, setOpenMega] = useState<MegaKey | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const { user, isEditor, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => setMobileOpen(false), []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    setMobileOpen(false);
    navigate({ to: "/noticias" });
    setSearchValue("");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#2A2A2A] bg-[#1A1A1A]/85 backdrop-blur-md supports-[backdrop-filter]:bg-[#1A1A1A]/70">
      <nav className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017]/40 rounded-sm" aria-label="RollerZone — Inicio">
          <img
            src={logoUrl}
            alt="RollerZone — Revista de Patinaje de Velocidad"
            className="h-8 md:h-9 w-auto"
            loading="eager"
          />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-2 lg:gap-5 md:flex">
          <li>
            <Link to="/" className={NAV_LINK} activeProps={{ className: NAV_ACTIVE }} activeOptions={{ exact: true }}>
              {t("nav.home")}
            </Link>
          </li>
          <li>
            <Link to="/noticias" className={NAV_LINK} activeProps={{ className: NAV_ACTIVE }}>
              {t("nav.news")}
            </Link>
          </li>

          <MegaItemLi keyName="eventos" openMega={openMega} setOpenMega={setOpenMega}>
            <Link to="/eventos" className={NAV_LINK + " gap-1"} activeProps={{ className: NAV_ACTIVE }}>
              {t("nav.events")} <ChevronDown className="h-3 w-3" />
            </Link>
          </MegaItemLi>

          <MegaItemLi keyName="resultados" openMega={openMega} setOpenMega={setOpenMega}>
            <Link to="/resultados" className={NAV_LINK + " gap-1"} activeProps={{ className: NAV_ACTIVE }}>
              {t("nav.results")} <ChevronDown className="h-3 w-3" />
            </Link>
          </MegaItemLi>

          <MegaItemLi keyName="revista" openMega={openMega} setOpenMega={setOpenMega}>
            <Link to="/revista" className={NAV_LINK + " gap-1"} activeProps={{ className: NAV_ACTIVE }}>
              {t("nav.magazine")} <ChevronDown className="h-3 w-3" />
            </Link>
          </MegaItemLi>

          <li>
            <Link to="/premios-mvp" className={NAV_LINK} activeProps={{ className: NAV_ACTIVE }}>
              MVP
            </Link>
          </li>
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Buscar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-transparent text-[#A0A0A0] hover:text-[#D4A017] hover:border-[#333] transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>
          <LanguageToggle className="hidden md:inline-flex" />
          {isEditor && (
            <Link
              to="/admin"
              className="font-ui hidden items-center gap-1.5 rounded-[6px] border border-[#333] px-3 py-1.5 text-xs font-semibold tracking-wide text-[#D4A017] transition-colors hover:bg-[#D4A017] hover:text-[#1A1A1A] md:inline-flex"
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> {t("nav.admin")}
            </Link>
          )}
          {user ? (
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
              className={`${ACTION_BTN} hidden md:inline-flex`}
              aria-label={t("nav.logoutLong")}
            >
              <LogOut className="h-3.5 w-3.5" /> {t("nav.logout")}
            </button>
          ) : (
            <Link to="/auth" className={`${ACTION_BTN} hidden md:inline-flex`}>
              {t("nav.access")}
            </Link>
          )}
          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center text-[#F5F5F5]"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={t("nav.menu")}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t border-[#333] bg-[#242424]">
          <form onSubmit={onSearchSubmit} className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
            <Search className="h-4 w-4 text-[#A0A0A0]" />
            <input
              ref={searchRef}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t("common.searchPlaceholder")}
              className="flex-1 bg-transparent text-sm text-[#F5F5F5] placeholder:text-[#666] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Cerrar"
              className="text-[#A0A0A0] hover:text-[#F5F5F5]"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Mega menu dropdown panels */}
      {openMega && (
        <div
          onMouseEnter={() => setOpenMega(openMega)}
          onMouseLeave={() => setOpenMega(null)}
          className="absolute left-0 right-0 hidden border-t border-[#333] bg-[#1A1A1A] shadow-lg md:block"
        >
          <div className="mx-auto max-w-7xl px-6 py-5">
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#D4A017] mb-3">
              {t(MEGA[openMega].titleKey)}
            </div>
            <ul className="grid grid-cols-3 gap-x-8 gap-y-1">
              {MEGA[openMega].items.map((item) => (
                <li key={item.labelKey + item.to + (item.hash ?? "")}>
                  {item.hash ? (
                    <a href={`${item.to}#${item.hash}`} className={SUB_LINK} onClick={() => setOpenMega(null)}>
                      {t(item.labelKey)}
                    </a>
                  ) : (
                    <Link to={item.to} className={SUB_LINK} onClick={() => setOpenMega(null)}>
                      {t(item.labelKey)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Mobile slide-in panel */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside
            className="fixed right-0 top-0 z-50 h-full w-[300px] border-l border-[#333] bg-[#1A1A1A] shadow-xl md:hidden"
            role="dialog"
            aria-label={t("nav.menu")}
          >
            <div className="flex h-14 items-center justify-between border-b border-[#333] px-4">
              <img src={logoUrl} alt="RollerZone" className="h-7 w-auto" />
              <button onClick={() => setMobileOpen(false)} aria-label="Cerrar" className="text-[#F5F5F5]">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-col gap-1 px-4 py-4">
              <MobileLink to="/" onClick={() => setMobileOpen(false)}>{t("nav.home")}</MobileLink>
              <MobileLink to="/noticias" onClick={() => setMobileOpen(false)}>{t("nav.news")}</MobileLink>
              <MobileLink to="/eventos" onClick={() => setMobileOpen(false)}>{t("nav.events")}</MobileLink>
              <MobileLink to="/resultados" onClick={() => setMobileOpen(false)}>{t("nav.results")}</MobileLink>
              <MobileLink to="/revista" onClick={() => setMobileOpen(false)}>{t("nav.magazine")}</MobileLink>
              <MobileLink to="/premios-mvp" onClick={() => setMobileOpen(false)}>MVP</MobileLink>
              <MobileLink to="/entrevistas" onClick={() => setMobileOpen(false)}>{t("nav.interviews")}</MobileLink>
              <MobileLink to="/tv" onClick={() => setMobileOpen(false)}>{t("nav.tv")}</MobileLink>
              <MobileLink to="/patrocinadores" onClick={() => setMobileOpen(false)}>{t("nav.sponsors")}</MobileLink>

              <div className="mt-4 flex items-center justify-between border-t border-[#333] pt-4">
                <LanguageToggle />
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {isEditor && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="font-ui rounded-[6px] border border-[#333] px-3 py-2 text-center text-xs font-semibold tracking-wide text-[#D4A017]"
                  >
                    {t("nav.admin")}
                  </Link>
                )}
                {user ? (
                  <button
                    onClick={async () => {
                      await signOut();
                      setMobileOpen(false);
                      navigate({ to: "/" });
                    }}
                    className="font-ui rounded-[6px] border border-[#333] px-3 py-2 text-xs font-semibold tracking-wide text-[#F5F5F5]"
                  >
                    {t("nav.logoutLong")}
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="font-ui rounded-[6px] border border-[#D4A017] px-3 py-2 text-center text-xs font-semibold tracking-wide text-[#D4A017] hover:bg-[#D4A017] hover:text-[#1A1A1A]"
                  >
                    {t("nav.accessAdmin")}
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </header>
  );
}

function MegaItemLi({
  keyName,
  openMega,
  setOpenMega,
  children,
}: {
  keyName: MegaKey;
  openMega: MegaKey | null;
  setOpenMega: (k: MegaKey | null) => void;
  children: React.ReactNode;
}) {
  return (
    <li
      className="relative h-14 flex items-center"
      onMouseEnter={() => setOpenMega(keyName)}
      onMouseLeave={() => setOpenMega(null)}
    >
      {children}
      {openMega === keyName && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-[#D4A017]" />}
    </li>
  );
}

function MobileLink({
  to,
  onClick,
  children,
}: {
  to: "/" | "/noticias" | "/eventos" | "/resultados" | "/tv" | "/revista" | "/patrocinadores" | "/premios-mvp" | "/entrevistas";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="font-ui py-3 text-base font-semibold text-[#F5F5F5] hover:text-[#D4A017] border-b border-[#333]"
    >
      {children}
    </Link>
  );
}
