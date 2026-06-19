import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  FileText, Tag, ShieldCheck, Users, Trophy, Building2, Calendar, BookOpen,
  Heart, Mic, UsersRound, Radio, Megaphone, PenLine, Tv, Film, Scale, Medal,
  Info, Layers, Inbox, MessageSquare, LayoutDashboard, ChevronDown, ChevronRight,
  Flag, BarChart3, Newspaper, Globe2, Sparkles, Crown,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel de administración — RollerZone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

type AdminPath =
  | "/admin" | "/admin/categorias" | "/admin/usuarios" | "/admin/patinadores"
  | "/admin/clubes" | "/admin/federaciones" | "/admin/premios-mvp"
  | "/admin/hub-liga" | "/admin/clasificaciones" | "/admin/eventos"
  | "/admin/revistas" | "/admin/revista-cta" | "/admin/patrocinadores"
  | "/admin/entrevistas" | "/admin/equipo" | "/admin/redactores"
  | "/admin/tv" | "/admin/live-center" | "/admin/tv-emisiones"
  | "/admin/tv-highlights" | "/admin/ticker" | "/admin/banners"
  | "/admin/legal" | "/admin/sobre-nosotros" | "/admin/schedule"
  | "/admin/medallero" | "/admin/live-results" | "/admin/sections"
  | "/admin/pendientes" | "/admin/comunidad" | "/admin/home-control"
  | "/admin/espana" | "/admin/colombia" | "/admin/resultados"
  | "/admin/resultados-importar" | "/admin/salon-de-la-fama" | "/dashboard";

type AdminLinkDef = { to: AdminPath; label: string; icon: React.ReactNode; exact?: boolean; adminOnly?: boolean };
type AdminGroup = { id: string; label: string; icon: React.ReactNode; links: AdminLinkDef[] };

const GROUPS: AdminGroup[] = [
  {
    id: "home",
    label: "Home & Portada",
    icon: <LayoutDashboard className="h-4 w-4" />,
    links: [
      { to: "/admin/home-control", label: "Home Control Center", icon: <Sparkles className="h-4 w-4" /> },
      { to: "/admin/clasificaciones", label: "Clasificaciones (home)", icon: <Trophy className="h-4 w-4" /> },
      { to: "/admin/ticker", label: "Ticker en directo", icon: <Radio className="h-4 w-4" /> },
      { to: "/admin/banners", label: "Banners publicitarios", icon: <Megaphone className="h-4 w-4" /> },
    ],
  },
  {
    id: "spain",
    label: "España",
    icon: <Flag className="h-4 w-4" />,
    links: [
      { to: "/admin/espana", label: "Control de España", icon: <LayoutDashboard className="h-4 w-4" /> },
      { to: "/admin/hub-liga", label: "Hub Liga Nacional", icon: <Trophy className="h-4 w-4" /> },
      { to: "/admin/premios-mvp", label: "Premios MVP", icon: <Trophy className="h-4 w-4" /> },
    ],
  },
  {
    id: "colombia",
    label: "Colombia",
    icon: <Globe2 className="h-4 w-4" />,
    links: [
      { to: "/admin/colombia", label: "Control de Colombia", icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    id: "results",
    label: "Resultados & Eventos",
    icon: <BarChart3 className="h-4 w-4" />,
    links: [
      { to: "/admin/eventos", label: "Eventos", icon: <Calendar className="h-4 w-4" /> },
      { to: "/admin/live-results", label: "Resultados (manual)", icon: <BarChart3 className="h-4 w-4" /> },
      { to: "/admin/resultados-importar", label: "Importar CSV", icon: <FileText className="h-4 w-4" /> },
      { to: "/admin/live-center", label: "Live Center", icon: <Radio className="h-4 w-4" /> },
      { to: "/admin/medallero", label: "Medallero (países)", icon: <Medal className="h-4 w-4" /> },
    ],
  },
  {
    id: "magazines",
    label: "Revistas",
    icon: <BookOpen className="h-4 w-4" />,
    links: [
      { to: "/admin/revistas", label: "Revistas (venta + precios)", icon: <BookOpen className="h-4 w-4" /> },
      { to: "/admin/revista-cta", label: "CTA Edición Digital", icon: <Megaphone className="h-4 w-4" /> },
    ],
  },
  {
    id: "editorial",
    label: "Editorial",
    icon: <Newspaper className="h-4 w-4" />,
    links: [
      { to: "/admin", label: "Noticias", icon: <FileText className="h-4 w-4" />, exact: true },
      { to: "/admin/pendientes", label: "Cola de revisión", icon: <Inbox className="h-4 w-4" /> },
      { to: "/admin/sections", label: "Secciones", icon: <Layers className="h-4 w-4" /> },
      { to: "/admin/categorias", label: "Categorías", icon: <Tag className="h-4 w-4" /> },
      { to: "/admin/entrevistas", label: "Entrevistas", icon: <Mic className="h-4 w-4" /> },
      { to: "/admin/redactores", label: "Redactores", icon: <PenLine className="h-4 w-4" /> },
    ],
  },
  {
    id: "directory",
    label: "Directorio",
    icon: <Users className="h-4 w-4" />,
    links: [
      { to: "/admin/patinadores", label: "Patinadores (destacados)", icon: <Users className="h-4 w-4" /> },
      { to: "/admin/salon-de-la-fama", label: "Salón de la Fama", icon: <Crown className="h-4 w-4" /> },
      { to: "/admin/clubes", label: "Clubes", icon: <Building2 className="h-4 w-4" /> },
      { to: "/admin/federaciones", label: "Federaciones", icon: <Building2 className="h-4 w-4" /> },
    ],
  },
  {
    id: "tv",
    label: "RollerZone TV",
    icon: <Tv className="h-4 w-4" />,
    links: [
      { to: "/admin/tv", label: "TV — Directo", icon: <Tv className="h-4 w-4" /> },
      { to: "/admin/tv-emisiones", label: "TV — Emisiones", icon: <Radio className="h-4 w-4" /> },
      { to: "/admin/tv-highlights", label: "TV — Highlights", icon: <Film className="h-4 w-4" /> },
    ],
  },
  {
    id: "community",
    label: "Comunidad & Marca",
    icon: <Heart className="h-4 w-4" />,
    links: [
      { to: "/admin/comunidad", label: "Comunidad", icon: <MessageSquare className="h-4 w-4" /> },
      { to: "/admin/patrocinadores", label: "Patrocinadores", icon: <Heart className="h-4 w-4" /> },
      { to: "/admin/equipo", label: "Equipo", icon: <UsersRound className="h-4 w-4" /> },
    ],
  },
  {
    id: "pages",
    label: "Páginas estáticas",
    icon: <Scale className="h-4 w-4" />,
    links: [
      { to: "/admin/legal", label: "Páginas legales", icon: <Scale className="h-4 w-4" /> },
      { to: "/admin/sobre-nosotros", label: "Sobre nosotros", icon: <Info className="h-4 w-4" /> },
    ],
  },
  {
    id: "access",
    label: "Accesos",
    icon: <ShieldCheck className="h-4 w-4" />,
    links: [
      { to: "/admin/usuarios", label: "Usuarios & roles", icon: <ShieldCheck className="h-4 w-4" />, adminOnly: true },
    ],
  },
];

const STORAGE_KEY = "rz-admin-groups";

function AdminLayout() {
  const { user, isEditor, isAdmin, isColaborador, loading } = useAuth();
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return { home: true, magazines: true, editorial: true };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* noop */ }
    return { home: true, spain: true, colombia: true, magazines: true, editorial: true, results: true };
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(openGroups)); } catch { /* noop */ }
  }, [openGroups]);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
      return;
    }
    if (!loading && user && !isAdmin && (isEditor || isColaborador)) {
      navigate({ to: "/dashboard" });
    }
  }, [user, loading, isAdmin, isEditor, isColaborador, navigate]);

  if (loading) {
    return <div className="px-6 py-10 text-muted-foreground">Cargando…</div>;
  }
  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-display text-3xl tracking-widest">Sin permisos</h1>
        <p className="mt-3 text-muted-foreground">
          Tu cuenta <span className="text-gold">{user.email}</span> aún no tiene rol de administrador.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Si eres editor, accede a tu panel desde{" "}
          <Link to="/dashboard" className="text-gold hover:underline">/dashboard</Link>.
        </p>
      </div>
    );
  }

  const toggle = (id: string) => setOpenGroups((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[260px_1fr] md:px-6">
      <aside className="h-fit border border-border bg-surface p-3 md:sticky md:top-4">
        <div className="mb-3 flex items-center justify-between px-2">
          <h2 className="font-display text-lg tracking-widest text-gold">PANEL</h2>
          <Link
            to="/admin/pendientes"
            className="font-condensed inline-flex items-center gap-1 rounded border border-gold/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold hover:bg-gold/10"
            title="Cola de revisión"
          >
            <Inbox className="h-3 w-3" /> Cola
          </Link>
        </div>

        <nav className="flex flex-col gap-1">
          {GROUPS.map((g) => {
            const links = g.links.filter((l) => !l.adminOnly || isAdmin);
            if (links.length === 0) return null;
            const open = !!openGroups[g.id];
            return (
              <div key={g.id} className="border-b border-border/40 last:border-0">
                <button
                  type="button"
                  onClick={() => toggle(g.id)}
                  className="font-condensed flex w-full items-center justify-between gap-2 px-2 py-2 text-[11px] font-bold uppercase tracking-widest text-foreground/80 hover:text-gold"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-gold">{g.icon}</span>
                    {g.label}
                  </span>
                  {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
                {open && (
                  <div className="pb-2">
                    {links.map((l) => (
                      <AdminLink key={l.to + l.label} to={l.to} exact={l.exact} icon={l.icon}>
                        {l.label}
                      </AdminLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-border pt-3 px-2 text-xs text-muted-foreground">
          <div>Sesión:</div>
          <div className="truncate text-foreground">{user.email}</div>
        </div>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  );
}

function AdminLink({
  to, exact, icon, children,
}: {
  to: AdminPath;
  exact?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="font-condensed flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-background hover:text-gold"
      activeProps={{ className: "bg-background text-gold border-l-2 border-gold" }}
      activeOptions={exact ? { exact: true } : undefined}
    >
      {icon} {children}
    </Link>
  );
}
