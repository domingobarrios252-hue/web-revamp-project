import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, Search, LayoutDashboard, LogOut, User as UserIcon, BookOpen } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAuthDialog } from "@/lib/auth-dialog-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoUrl from "@/assets/rollerzone-logo.png";
import { GlobalSearch } from "@/components/site/GlobalSearch";
import { usePageSettings } from "@/lib/pageSettings";

const NAV_LINK =
  "font-ui relative inline-flex h-14 items-center px-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#B5B5B5] transition-all duration-200 hover:text-[#F5F5F5] focus-visible:text-[#F5F5F5] focus-visible:outline-none after:absolute after:inset-x-1 after:bottom-3 after:h-[2px] after:scale-x-0 after:origin-left after:bg-[#D4A017] after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:after:scale-x-100";
const NAV_ACTIVE = "text-[#F5F5F5] after:scale-x-100";
const ACTION_BTN =
  "font-ui inline-flex items-center gap-1.5 rounded-[6px] border border-[#D4A017] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#D4A017] transition-all duration-200 hover:bg-[#D4A017] hover:text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017]/40";

type NavItem =
  | { label: string; to: string; slug?: string }
  | { label: string; to: "/hub/$country"; params: { country: string }; slug?: string };

const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", to: "/", slug: "inicio" },
  { label: "Actualidad", to: "/noticias", slug: "noticias" },
  { label: "España", to: "/hub/$country", params: { country: "es" }, slug: "espana" },
  { label: "Colombia", to: "/hub/$country", params: { country: "co" }, slug: "colombia" },
  { label: "Destacados", to: "/patinadores-destacados" },
  { label: "Salón de la Fama", to: "/salon-de-la-fama", slug: "salon-de-la-fama" },
  { label: "Eventos", to: "/eventos", slug: "eventos" },
  { label: "Resultados", to: "/resultados", slug: "resultados" },
  { label: "RollerZone TV", to: "/tv", slug: "rollerzone-tv" },
  { label: "Revista", to: "/revista", slug: "revista" },
  { label: "MVP", to: "/premios-mvp", slug: "premios-mvp" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const { user, isEditor, signOut } = useAuth();
  const { openAuthDialog } = useAuthDialog();
  const navigate = useNavigate();
  const { settings } = usePageSettings();

  const visibleNav = NAV_ITEMS.filter(
    (i) => !i.slug || settings[i.slug]?.status !== "hidden",
  );

  useEffect(() => setMobileOpen(false), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    setMobileOpen(false);
    navigate({ to: "/noticias" });
    setSearchValue("");
  };

  const avatarUrl =
    (user?.user_metadata as { avatar_url?: string; picture?: string } | undefined)?.avatar_url ||
    (user?.user_metadata as { avatar_url?: string; picture?: string } | undefined)?.picture;
  const displayName =
    (user?.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ||
    (user?.user_metadata as { full_name?: string; name?: string } | undefined)?.name ||
    user?.email ||
    "";
  const initials = (displayName || "U")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "U";

  const renderNavLink = (item: NavItem, onClick?: () => void) => {
    if ("params" in item) {
      return (
        <Link
          to={item.to}
          params={item.params}
          className={NAV_LINK}
          activeProps={{ className: NAV_ACTIVE }}
          onClick={onClick}
        >
          {item.label}
        </Link>
      );
    }
    return (
      <Link
        to={item.to}
        className={NAV_LINK}
        activeProps={{ className: NAV_ACTIVE }}
        activeOptions={item.to === "/" ? { exact: true } : undefined}
        onClick={onClick}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#2A2A2A] bg-[#1A1A1A]/85 backdrop-blur-md supports-[backdrop-filter]:bg-[#1A1A1A]/70">
      <nav className="flex h-14 items-center justify-between px-4 md:px-6">
        <Link
          to="/"
          className="group flex flex-col justify-center leading-none transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017]/40 rounded-sm"
          aria-label="RollerZone — Inicio"
        >
          <span className="font-display text-[20px] md:text-[26px] leading-none tracking-[0.03em] text-[#F5F5F5]">
            ROLLERZONE<span className="text-[#D4A017]">.ES</span>
          </span>
          <span className="font-condensed mt-0.5 text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B0B0B0]">
            Revista de patinaje de velocidad
          </span>
          <span className="font-ui mt-0.5 text-[9px] md:text-[10px] italic leading-tight text-[#8A8A8A]">
            Donde la velocidad se convierte en historia
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-2 lg:gap-4 xl:flex">
          {visibleNav.map((item) => (
            <li key={item.label}>{renderNavLink(item)}</li>
          ))}
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

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="hidden xl:inline-flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017]/40"
                aria-label="Cuenta de usuario"
              >
                <Avatar className="h-9 w-9 border border-[#333]">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                  <AvatarFallback className="bg-[#242424] text-[#D4A017] text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#1A1A1A] border-[#333]">
                <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isEditor && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/mi-biblioteca" className="cursor-pointer">
                    <BookOpen className="mr-2 h-4 w-4" /> Mi biblioteca
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" /> Mi panel
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                  className="cursor-pointer text-[#F5F5F5]"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Salir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              type="button"
              onClick={openAuthDialog}
              className={`${ACTION_BTN} hidden xl:inline-flex`}
            >
              Acceder / Mi cuenta
            </button>
          )}

          <button
            className="xl:hidden inline-flex h-9 w-9 items-center justify-center text-[#F5F5F5]"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menú"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />


      {/* Mobile slide-in */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 xl:hidden" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside
            className="fixed right-0 top-0 z-50 h-dvh w-[300px] max-w-[85vw] border-l border-[#333] shadow-xl xl:hidden overflow-y-auto"
            style={{ backgroundColor: "#1A1A1A" }}
            role="dialog"
            aria-label="Menú"
          >
            <div className="flex h-14 items-center justify-between border-b border-[#333] px-4">
              <img src={logoUrl} alt="RollerZone" className="h-7 w-auto" />
              <button onClick={() => setMobileOpen(false)} aria-label="Cerrar" className="text-[#F5F5F5]">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-col gap-1 px-4 py-4">
              {visibleNav.map((item) => (
                <div key={item.label} className="border-b border-[#333]">
                  {"params" in item ? (
                    <Link
                      to={item.to}
                      params={item.params}
                      onClick={() => setMobileOpen(false)}
                      className="font-ui block py-3 text-base font-semibold text-[#F5F5F5] hover:text-[#D4A017]"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <Link
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className="font-ui block py-3 text-base font-semibold text-[#F5F5F5] hover:text-[#D4A017]"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}

              <div className="mt-4 flex flex-col gap-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 rounded-[6px] border border-[#333] px-3 py-2">
                      <Avatar className="h-8 w-8">
                        {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                        <AvatarFallback className="bg-[#242424] text-[#D4A017] text-xs font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm text-[#F5F5F5]">{displayName}</span>
                    </div>
                    <Link
                      to="/mi-biblioteca"
                      onClick={() => setMobileOpen(false)}
                      className="font-ui rounded-[6px] border border-[#333] px-3 py-2 text-center text-xs font-semibold tracking-wide text-[#F5F5F5]"
                    >
                      Mi biblioteca
                    </Link>
                    {isEditor && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="font-ui rounded-[6px] border border-[#333] px-3 py-2 text-center text-xs font-semibold tracking-wide text-[#D4A017]"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={async () => {
                        await signOut();
                        setMobileOpen(false);
                        navigate({ to: "/" });
                      }}
                      className="font-ui rounded-[6px] border border-[#333] px-3 py-2 text-xs font-semibold tracking-wide text-[#F5F5F5]"
                    >
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setMobileOpen(false); openAuthDialog(); }}
                    className="font-ui rounded-[6px] border border-[#D4A017] px-3 py-2 text-center text-xs font-semibold tracking-wide text-[#D4A017] hover:bg-[#D4A017] hover:text-[#1A1A1A]"
                  >
                    Acceder / Mi cuenta
                  </button>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </header>
  );
}
