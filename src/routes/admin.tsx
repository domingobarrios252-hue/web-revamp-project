import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { FileText, Tag, ShieldCheck, Users, Trophy, Building2, Calendar, BookOpen, Heart, Mic, UsersRound, Radio, Megaphone, PenLine, Tv, Film, Scale, Clock, Medal, Info, Timer, Layers, Inbox } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel de administración — RollerZone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isEditor, isAdmin, isColaborador, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
      return;
    }
    // Solo Admin accede al panel de administración; editores van a su panel editorial
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
          Tu cuenta <span className="text-gold">{user.email}</span> aún no tiene rol de
          administrador.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Si eres editor, accede a tu panel desde{" "}
          <Link to="/dashboard" className="text-gold hover:underline">
            /dashboard
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[220px_1fr] md:px-6">
      <aside className="border border-border bg-surface p-4">
        <h2 className="font-display mb-4 text-lg tracking-widest text-gold">PANEL</h2>
        <nav className="flex flex-col gap-1">
          <AdminLink to="/admin" exact icon={<FileText className="h-4 w-4" />}>
            Noticias
          </AdminLink>
          <AdminLink to="/admin/pendientes" icon={<Inbox className="h-4 w-4" />}>
            Cola de revisión
          </AdminLink>
          <AdminLink to="/admin/sections" icon={<Layers className="h-4 w-4" />}>
            Secciones
          </AdminLink>
          <AdminLink to="/admin/categorias" icon={<Tag className="h-4 w-4" />}>
            Categorías
          </AdminLink>
          <AdminLink to="/admin/patinadores" icon={<Users className="h-4 w-4" />}>
            Patinadores
          </AdminLink>
          <AdminLink to="/admin/clubes" icon={<Building2 className="h-4 w-4" />}>
            Clubes
          </AdminLink>
          <AdminLink to="/admin/premios-mvp" icon={<Trophy className="h-4 w-4" />}>
            Premios MVP
          </AdminLink>
          <AdminLink to="/admin/eventos" icon={<Calendar className="h-4 w-4" />}>
            Eventos
          </AdminLink>
          <AdminLink to="/admin/entrevistas" icon={<Mic className="h-4 w-4" />}>
            Entrevistas
          </AdminLink>
          <AdminLink to="/admin/revistas" icon={<BookOpen className="h-4 w-4" />}>
            Revistas
          </AdminLink>
          <AdminLink to="/admin/revista-cta" icon={<BookOpen className="h-4 w-4" />}>
            CTA Edición Digital
          </AdminLink>
          <AdminLink to="/admin/patrocinadores" icon={<Heart className="h-4 w-4" />}>
            Patrocinadores
          </AdminLink>
          <AdminLink to="/admin/equipo" icon={<UsersRound className="h-4 w-4" />}>
            Equipo
          </AdminLink>
          <AdminLink to="/admin/redactores" icon={<PenLine className="h-4 w-4" />}>
            Redactores
          </AdminLink>
          <AdminLink to="/admin/tv" icon={<Tv className="h-4 w-4" />}>
            TV — Directo
          </AdminLink>
          <AdminLink to="/admin/live-center" icon={<Radio className="h-4 w-4" />}>
            Live Center
          </AdminLink>
          <AdminLink to="/admin/schedule" icon={<Clock className="h-4 w-4" />}>
            Pruebas programadas
          </AdminLink>
          <AdminLink to="/admin/live-results" icon={<Timer className="h-4 w-4" />}>
            Resultados en vivo
          </AdminLink>
          <AdminLink to="/admin/medallero" icon={<Medal className="h-4 w-4" />}>
            Medallero (países)
          </AdminLink>
          <AdminLink to="/admin/tv-emisiones" icon={<Radio className="h-4 w-4" />}>
            TV — Emisiones
          </AdminLink>
          <AdminLink to="/admin/tv-highlights" icon={<Film className="h-4 w-4" />}>
            TV — Highlights
          </AdminLink>
          <AdminLink to="/admin/ticker" icon={<Radio className="h-4 w-4" />}>
            Ticker
          </AdminLink>
          <AdminLink to="/admin/banners" icon={<Megaphone className="h-4 w-4" />}>
            Banners
          </AdminLink>
          <AdminLink to="/admin/legal" icon={<Scale className="h-4 w-4" />}>
            Páginas legales
          </AdminLink>
          <AdminLink to="/admin/sobre-nosotros" icon={<Info className="h-4 w-4" />}>
            Sobre nosotros
          </AdminLink>
          {isAdmin && (
            <AdminLink to="/admin/usuarios" icon={<ShieldCheck className="h-4 w-4" />}>
              Usuarios
            </AdminLink>
          )}
        </nav>
        <div className="mt-6 border-t border-border pt-3 text-xs text-muted-foreground">
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
  to,
  exact,
  icon,
  children,
}: {
  to: "/admin" | "/admin/categorias" | "/admin/usuarios" | "/admin/patinadores" | "/admin/clubes" | "/admin/premios-mvp" | "/admin/eventos" | "/admin/revistas" | "/admin/revista-cta" | "/admin/patrocinadores" | "/admin/entrevistas" | "/admin/equipo" | "/admin/redactores" | "/admin/tv" | "/admin/live-center" | "/admin/tv-emisiones" | "/admin/tv-highlights" | "/admin/ticker" | "/admin/banners" | "/admin/legal" | "/admin/sobre-nosotros" | "/admin/schedule" | "/admin/medallero" | "/admin/live-results" | "/admin/sections" | "/admin/pendientes" | "/dashboard";
  exact?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="font-condensed flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-background hover:text-gold"
      activeProps={{ className: "bg-background text-gold" }}
      activeOptions={exact ? { exact: true } : undefined}
    >
      {icon} {children}
    </Link>
  );
}
