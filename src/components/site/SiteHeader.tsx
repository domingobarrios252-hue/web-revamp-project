import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NACIONAL = [
  { name: "Asturias", slug: "asturias" },
  { name: "Navarra", slug: "navarra" },
  { name: "Valencia", slug: "valencia" },
  { name: "Murcia", slug: "murcia" },
  { name: "Cataluña", slug: "cataluna" },
];
const INTERNACIONAL = [
  { name: "Colombia", slug: "colombia" },
  { name: "Ecuador", slug: "ecuador" },
  { name: "Venezuela", slug: "venezuela" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const { user, isAdmin, isEditor, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => setMobileOpen(false), []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <nav className="flex h-14 items-center justify-between px-4 md:px-8">
        <Link to="/" className="font-display text-2xl tracking-widest">
          <span className="text-gold">Roller</span>
          <span className="text-foreground">Zone</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-5 lg:flex">
          <NavLink to="/">Inicio</NavLink>

          {/* Noticias dropdown */}
          <li
            className="relative"
            onMouseEnter={() => setNewsOpen(true)}
            onMouseLeave={() => setNewsOpen(false)}
          >
            <Link
              to="/noticias"
              className="font-condensed flex items-center gap-1 text-xs font-semibold uppercase tracking-[1.5px] text-muted-foreground transition-colors hover:text-gold"
              activeProps={{ className: "text-gold" }}
            >
              Noticias <ChevronDown className="h-3 w-3" />
            </Link>
            {newsOpen && (
              <div className="absolute left-1/2 top-full w-[420px] -translate-x-1/2 pt-2">
                <div className="rounded-md border border-border bg-popover p-4 shadow-2xl">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="font-display mb-2 text-sm tracking-widest text-gold">
                        Nacional
                      </div>
                      <ul className="space-y-1.5">
                        {NACIONAL.map((c) => (
                          <li key={c.slug}>
                            <Link
                              to="/noticias/$slug"
                              params={{ slug: c.slug }}
                              className="font-condensed text-sm uppercase tracking-wider text-foreground/80 hover:text-gold"
                            >
                              {c.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-display mb-2 text-sm tracking-widest text-gold">
                        Internacional
                      </div>
                      <ul className="space-y-1.5">
                        {INTERNACIONAL.map((c) => (
                          <li key={c.slug}>
                            <Link
                              to="/noticias/$slug"
                              params={{ slug: c.slug }}
                              className="font-condensed text-sm uppercase tracking-wider text-foreground/80 hover:text-gold"
                            >
                              {c.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <Link
                    to="/noticias"
                    className="font-condensed mt-3 block border-t border-border pt-3 text-center text-xs uppercase tracking-widest text-gold hover:text-gold-dark"
                  >
                    Ver todas las noticias →
                  </Link>
                </div>
              </div>
            )}
          </li>

          <li>
            <Link
              to="/ranking"
              className="font-condensed text-xs font-semibold uppercase tracking-[1.5px] text-muted-foreground transition-colors hover:text-gold"
              activeProps={{ className: "text-gold" }}
            >
              Ranking
            </Link>
          </li>
          <NavLink to="/" hash="entrevistas">Entrevistas</NavLink>
          <NavLink to="/" hash="eventos">Eventos</NavLink>
          <NavLink to="/" hash="revista">Revista</NavLink>
          <NavLink to="/" hash="patrocinadores">Patrocinadores</NavLink>
          <NavLink to="/" hash="equipo">Equipo</NavLink>
        </ul>

        <div className="flex items-center gap-2">
          {isEditor && (
            <Link
              to="/admin"
              className="font-condensed hidden items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gold transition-colors hover:bg-gold hover:text-background md:inline-flex"
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
          {user ? (
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
              className="font-condensed hidden items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-gold md:inline-flex"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" /> Salir
            </button>
          ) : (
            <Link
              to="/auth"
              className="font-condensed hidden border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-gold md:inline-block"
            >
              Acceso
            </Link>
          )}
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menú"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="flex flex-col gap-1 px-4 py-3">
            <MobileLink to="/" onClick={() => setMobileOpen(false)}>Inicio</MobileLink>
            <MobileLink to="/noticias" onClick={() => setMobileOpen(false)}>
              Noticias — Todas
            </MobileLink>
            <div className="ml-3 space-y-1 border-l border-border pl-3 text-xs">
              <div className="font-display pt-2 text-xs tracking-widest text-gold">Nacional</div>
              {NACIONAL.map((c) => (
                <Link
                  key={c.slug}
                  to="/noticias/$slug"
                  params={{ slug: c.slug }}
                  onClick={() => setMobileOpen(false)}
                  className="font-condensed block py-1 text-sm uppercase tracking-wider text-foreground/80 hover:text-gold"
                >
                  {c.name}
                </Link>
              ))}
              <div className="font-display pt-2 text-xs tracking-widest text-gold">Internacional</div>
              {INTERNACIONAL.map((c) => (
                <Link
                  key={c.slug}
                  to="/noticias/$slug"
                  params={{ slug: c.slug }}
                  onClick={() => setMobileOpen(false)}
                  className="font-condensed block py-1 text-sm uppercase tracking-wider text-foreground/80 hover:text-gold"
                >
                  {c.name}
                </Link>
              ))}
            </div>

            <Link to="/ranking" onClick={() => setMobileOpen(false)} className="font-condensed py-2 text-sm uppercase tracking-wider text-muted-foreground hover:text-gold">Ranking</Link>
            <a href="/#entrevistas" onClick={() => setMobileOpen(false)} className="font-condensed py-2 text-sm uppercase tracking-wider text-muted-foreground hover:text-gold">Entrevistas</a>
            <a href="/#eventos" onClick={() => setMobileOpen(false)} className="font-condensed py-2 text-sm uppercase tracking-wider text-muted-foreground hover:text-gold">Eventos</a>
            <a href="/#revista" onClick={() => setMobileOpen(false)} className="font-condensed py-2 text-sm uppercase tracking-wider text-muted-foreground hover:text-gold">Revista</a>
            <a href="/#patrocinadores" onClick={() => setMobileOpen(false)} className="font-condensed py-2 text-sm uppercase tracking-wider text-muted-foreground hover:text-gold">Patrocinadores</a>
            <a href="/#equipo" onClick={() => setMobileOpen(false)} className="font-condensed py-2 text-sm uppercase tracking-wider text-muted-foreground hover:text-gold">Equipo</a>

            <div className="mt-2 flex gap-2 border-t border-border pt-3">
              {isEditor && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="font-condensed flex-1 border border-border px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-gold">
                  Admin
                </Link>
              )}
              {user ? (
                <button
                  onClick={async () => {
                    await signOut();
                    setMobileOpen(false);
                    navigate({ to: "/" });
                  }}
                  className="font-condensed flex-1 border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Cerrar sesión
                </button>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="font-condensed flex-1 border border-border px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Acceso admin
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
        <a
          href={`/#${hash}`}
          className="font-condensed text-xs font-semibold uppercase tracking-[1.5px] text-muted-foreground transition-colors hover:text-gold"
        >
          {children}
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link
        to={to}
        className="font-condensed text-xs font-semibold uppercase tracking-[1.5px] text-muted-foreground transition-colors hover:text-gold"
        activeProps={{ className: "text-gold" }}
        activeOptions={{ exact: true }}
      >
        {children}
      </Link>
    </li>
  );
}

function MobileLink({ to, onClick, children }: { to: "/" | "/noticias"; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="font-condensed py-2 text-sm font-semibold uppercase tracking-wider text-foreground hover:text-gold"
    >
      {children}
    </Link>
  );
}
