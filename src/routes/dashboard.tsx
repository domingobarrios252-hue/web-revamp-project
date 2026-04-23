import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { FileText, LogOut } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Mi panel — RollerZone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user, isColaborador, isEditor, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
      return;
    }
    // Si es admin/editor, su sitio es /admin
    if (!loading && user && isEditor) {
      navigate({ to: "/admin" });
    }
  }, [user, loading, isEditor, navigate]);

  if (loading) {
    return <div className="px-6 py-10 text-muted-foreground">Cargando…</div>;
  }
  if (!user) return null;

  if (!isColaborador) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-display text-3xl tracking-widest">Sin permisos</h1>
        <p className="mt-3 text-muted-foreground">
          Tu cuenta <span className="text-gold">{user.email}</span> aún no tiene rol asignado.
          Contacta con un administrador para que te asigne una sección.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[220px_1fr] md:px-6">
      <aside className="border border-border bg-surface p-4">
        <h2 className="font-display mb-4 text-lg tracking-widest text-gold">MI PANEL</h2>
        <nav className="flex flex-col gap-1">
          <Link
            to="/dashboard"
            className="font-condensed flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-background hover:text-gold"
            activeProps={{ className: "bg-background text-gold" }}
            activeOptions={{ exact: true }}
          >
            <FileText className="h-4 w-4" /> Mis noticias
          </Link>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/auth" });
            }}
            className="font-condensed mt-2 flex items-center gap-2 px-3 py-2 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-background hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
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
