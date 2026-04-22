import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/site/LanguageToggle";
import { supabase } from "@/integrations/supabase/client";

type CategoryItem = { name: string; slug: string; scope: string };

// Shared classes for top-level nav links — Inter, normal-case for legibility
const NAV_LINK = "font-ui text-sm font-medium tracking-normal text-foreground/85 transition-colors hover:text-gold";
const NAV_LINK_TV = "font-ui text-sm font-semibold tracking-normal text-gold transition-colors hover:text-gold-dark";
const SUB_LINK = "font-ui text-sm font-normal text-foreground/85 hover:text-gold";
const ACTION_BTN = "font-ui inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-semibold tracking-wide text-foreground/85 transition-colors hover:text-gold";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [nacional, setNacional] = useState<CategoryItem[]>([]);
  const [internacional, setInternacional] = useState<CategoryItem[]>([]);
  const { user, isEditor, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => setMobileOpen(false), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: newsRows } = await supabase
        .from("news")
        .select("category_id")
        .eq("published", true)
        .not("category_id", "is", null)
        .limit(1000);
      const usedIds = Array.from(new Set((newsRows ?? []).map((n) => n.category_id).filter(Boolean) as string[]));
      if (usedIds.length === 0) {
        if (!cancelled) { setNacional([]); setInternacional([]); }
        return;
      }
      const { data: cats } = await supabase
        .from("news_categories")
        .select("name, slug, scope")
        .in("id", usedIds)
        .order("sort_order");
      if (cancelled) return;
      const list = (cats ?? []) as CategoryItem[];
      setNacional(list.filter((c) => c.scope === "Nacional"));
      setInternacional(list.filter((c) => c.scope === "Internacional"));
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <nav className="flex h-14 items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex flex-col leading-none">
          <span className="font-brand text-xl tracking-wide md:text-[22px]">
            <span className="text-gold">Roller</span>
            <span className="text-foreground">Zone</span>
          </span>
          <span className="font-ui mt-1 text-[10px] font-medium tracking-wide text-muted-foreground">
            Revista de Patinaje de Velocidad
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-6 lg:flex">
          <NavLink to="/">{t("nav.home")}</NavLink>

          {/* Noticias dropdown */}
          <li
            className="relative"
            onMouseEnter={() => setNewsOpen(true)}
            onMouseLeave={() => setNewsOpen(false)}
          >
            <Link
              to="/noticias"
              className={`${NAV_LINK} flex items-center gap-1`}
              activeProps={{ className: "text-gold" }}
            >
              {t("nav.news")} <ChevronDown className="h-3 w-3" />
            </Link>
            {newsOpen && (nacional.length > 0 || internacional.length > 0) && (
              <div className="absolute left-1/2 top-full w-[420px] -translate-x-1/2 pt-2">
                <div className="rounded-md border border-border bg-popover p-4 shadow-2xl">
                  <div className="grid grid-cols-2 gap-6">
                    {nacional.length > 0 && (
                      <div>
                        <div className="font-display mb-2 text-sm tracking-widest text-gold">
                          {t("nav.national")}
                        </div>
                        <ul className="space-y-1.5">
                          {nacional.map((c) => (
                            <li key={c.slug}>
                              <Link
                                to="/noticias/$slug"
                                params={{ slug: c.slug }}
                                className={SUB_LINK}
                              >
                                {c.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {internacional.length > 0 && (
                      <div>
                        <div className="font-display mb-2 text-sm tracking-widest text-gold">
                          {t("nav.international")}
                        </div>
                        <ul className="space-y-1.5">
                          {internacional.map((c) => (
                            <li key={c.slug}>
                              <Link
                                to="/noticias/$slug"
                                params={{ slug: c.slug }}
                                className={SUB_LINK}
                              >
                                {c.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <Link
                    to="/noticias"
                    className="font-ui mt-3 block border-t border-border pt-3 text-center text-xs font-semibold tracking-wide text-gold hover:text-gold-dark"
                  >
                    {t("nav.newsAllShort")}
                  </Link>
                </div>
              </div>
            )}
          </li>

          <li>
            <Link to="/premios-mvp" className={NAV_LINK} activeProps={{ className: "text-gold" }}>
              {t("nav.mvpAwards")}
            </Link>
          </li>
          <li>
            <Link to="/entrevistas" className={NAV_LINK} activeProps={{ className: "text-gold" }}>
              {t("nav.interviews")}
            </Link>
          </li>
          <li>
            <Link to="/eventos" className={NAV_LINK} activeProps={{ className: "text-gold" }}>
              {t("nav.events")}
            </Link>
          </li>
          <li>
            <Link to="/tv" className={NAV_LINK_TV} activeProps={{ className: "text-gold" }}>
              {t("nav.tv")}
            </Link>
          </li>
          <li>
            <Link to="/revista" className={NAV_LINK} activeProps={{ className: "text-gold" }}>
              {t("nav.magazine")}
            </Link>
          </li>
          <li>
            <Link to="/patrocinadores" className={NAV_LINK} activeProps={{ className: "text-gold" }}>
              {t("nav.sponsors")}
            </Link>
          </li>
          <NavLink to="/" hash="equipo">{t("nav.team")}</NavLink>
        </ul>

        <div className="flex items-center gap-2">
          <LanguageToggle className="hidden md:inline-flex" />
          {isEditor && (
            <Link
              to="/admin"
              className="font-ui hidden items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-semibold tracking-wide text-gold transition-colors hover:bg-gold hover:text-background md:inline-flex"
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
            <Link
              to="/auth"
              className={`${ACTION_BTN} hidden md:inline-flex`}
            >
              {t("nav.access")}
            </Link>
          )}
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={t("nav.menu")}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="flex flex-col gap-1 px-4 py-3">
            <MobileLink to="/" onClick={() => setMobileOpen(false)}>{t("nav.home")}</MobileLink>
            <MobileLink to="/noticias" onClick={() => setMobileOpen(false)}>
              {t("nav.newsAll")}
            </MobileLink>
            {(nacional.length > 0 || internacional.length > 0) && (
              <div className="ml-3 space-y-1 border-l border-border pl-3 text-xs">
                {nacional.length > 0 && (
                  <>
                    <div className="font-display pt-2 text-xs tracking-widest text-gold">{t("nav.national")}</div>
                    {nacional.map((c) => (
                      <Link
                        key={c.slug}
                        to="/noticias/$slug"
                        params={{ slug: c.slug }}
                        onClick={() => setMobileOpen(false)}
                        className="font-ui block py-1 text-sm text-foreground/85 hover:text-gold"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </>
                )}
                {internacional.length > 0 && (
                  <>
                    <div className="font-display pt-2 text-xs tracking-widest text-gold">{t("nav.international")}</div>
                    {internacional.map((c) => (
                      <Link
                        key={c.slug}
                        to="/noticias/$slug"
                        params={{ slug: c.slug }}
                        onClick={() => setMobileOpen(false)}
                        className="font-ui block py-1 text-sm text-foreground/85 hover:text-gold"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            )}

            <Link to="/premios-mvp" onClick={() => setMobileOpen(false)} className="font-ui py-2 text-sm font-medium text-foreground/85 hover:text-gold">{t("nav.mvpAwards")}</Link>
            <Link to="/entrevistas" onClick={() => setMobileOpen(false)} className="font-ui py-2 text-sm font-medium text-foreground/85 hover:text-gold">{t("nav.interviews")}</Link>
            <Link to="/eventos" onClick={() => setMobileOpen(false)} className="font-ui py-2 text-sm font-medium text-foreground/85 hover:text-gold">{t("nav.events")}</Link>
            <Link to="/tv" onClick={() => setMobileOpen(false)} className="font-ui py-2 text-sm font-semibold text-gold hover:text-gold-dark">{t("nav.tv")}</Link>
            <Link to="/revista" onClick={() => setMobileOpen(false)} className="font-ui py-2 text-sm font-medium text-foreground/85 hover:text-gold">{t("nav.magazine")}</Link>
            <Link to="/patrocinadores" onClick={() => setMobileOpen(false)} className="font-ui py-2 text-sm font-medium text-foreground/85 hover:text-gold">{t("nav.sponsors")}</Link>
            <a href="/#equipo" onClick={() => setMobileOpen(false)} className="font-ui py-2 text-sm font-medium text-foreground/85 hover:text-gold">{t("nav.team")}</a>

            <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
              <LanguageToggle />
            </div>

            <div className="mt-2 flex gap-2">
              {isEditor && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="font-ui flex-1 border border-border px-3 py-2 text-center text-xs font-semibold tracking-wide text-gold">
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
                  className="font-ui flex-1 border border-border px-3 py-2 text-xs font-semibold tracking-wide text-foreground/85"
                >
                  {t("nav.logoutLong")}
                </button>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="font-ui flex-1 border border-border px-3 py-2 text-center text-xs font-semibold tracking-wide text-foreground/85">
                  {t("nav.accessAdmin")}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ to, hash, children }: { to: "/"; hash?: string; children: React.ReactNode }) {
  if (hash) {
    return (
      <li>
        <a href={`/#${hash}`} className={NAV_LINK}>
          {children}
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link
        to={to}
        className={NAV_LINK}
        activeProps={{ className: "text-gold" }}
        activeOptions={{ exact: true }}
      >
        {children}
      </Link>
    </li>
  );
}

function MobileLink({ to, onClick, children }: { to: "/" | "/noticias" | "/eventos" | "/tv" | "/revista" | "/patrocinadores" | "/premios-mvp" | "/entrevistas"; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="font-ui py-2 text-sm font-semibold text-foreground hover:text-gold"
    >
      {children}
    </Link>
  );
}
