import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { FileText, Tag, ShieldCheck, Users, Trophy, Building2, Calendar, BookOpen, Heart } from "lucide-react";

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
  const { user, isEditor, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="px-6 py-10 text-muted-foreground">Cargando…</div>;
  }
  if (!user) return null;

  if (!isEditor) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-display text-3xl tracking-widest">Sin permisos</h1>
        <p className="mt-3 text-muted-foreground">
          Tu cuenta <span className="text-gold">{user.email}</span> aún no tiene rol de
          administrador.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pide a un administrador existente que te asigne el rol, o si eres el primer
          usuario, asigna manualmente tu rol desde la sección de base de datos.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          (SQL: <code>insert into user_roles(user_id, role) values ('{user.id}', 'admin');</code>)
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
          <AdminLink to="/admin/categorias" icon={<Tag className="h-4 w-4" />}>
            Categorías
          </AdminLink>
          <AdminLink to="/admin/patinadores" icon={<Users className="h-4 w-4" />}>
            Patinadores
          </AdminLink>
          <AdminLink to="/admin/clubes" icon={<Building2 className="h-4 w-4" />}>
            Clubes
          </AdminLink>
          <AdminLink to="/admin/competiciones" icon={<Trophy className="h-4 w-4" />}>
            Competiciones
          </AdminLink>
          <AdminLink to="/admin/eventos" icon={<Calendar className="h-4 w-4" />}>
            Eventos
          </AdminLink>
          <AdminLink to="/admin/revistas" icon={<BookOpen className="h-4 w-4" />}>
            Revistas
          </AdminLink>
          <AdminLink to="/admin/patrocinadores" icon={<Heart className="h-4 w-4" />}>
            Patrocinadores
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
  to: "/admin" | "/admin/categorias" | "/admin/usuarios" | "/admin/patinadores" | "/admin/clubes" | "/admin/competiciones" | "/admin/eventos" | "/admin/revistas" | "/admin/patrocinadores";
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
