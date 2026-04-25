import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, ShieldCheck, ShieldOff, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

type Profile = { user_id: string; display_name: string | null; email: string | null; section_id: string | null };
type RoleRow = { user_id: string; role: "admin" | "editor" | "user" | "colaborador" };
type Section = { id: string; name: string };

export const Route = createFileRoute("/admin/usuarios")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { isAdmin, user: me } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const reload = async () => {
    setLoading(true);
    const [{ data: p }, { data: r }, { data: s }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, email, section_id"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("sections").select("id, name").order("sort_order"),
    ]);
    setProfiles((p as Profile[]) ?? []);
    setRoles((r as RoleRow[]) ?? []);
    setSections((s as Section[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) reload();
  }, [isAdmin]);

  if (!isAdmin) {
    return <p className="text-muted-foreground">Solo administradores.</p>;
  }

  const setPrimaryRole = async (
    userId: string,
    role: "admin" | "editor",
  ) => {
    const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (deleteError) return toast.error(deleteError.message);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) toast.error(error.message);
    else toast.success(`Rol ${role} asignado`);
    if (role === "admin") await setSection(userId, null);
    reload();
  };

  const setSection = async (userId: string, sectionId: string | null) => {
    const { error } = await supabase
      .from("profiles")
      .update({ section_id: sectionId })
      .eq("user_id", userId);
    if (error) toast.error(error.message);
    else {
      toast.success("Sección actualizada");
      reload();
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest md:text-3xl">Usuarios</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="font-condensed inline-flex items-center gap-1.5 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <UserPlus className="h-3.5 w-3.5" /> Crear usuario
        </button>
      </div>

      <div className="mb-4 flex items-start gap-2 border border-border bg-surface p-3 text-xs text-muted-foreground">
        <UserPlus className="mt-0.5 h-4 w-4 text-gold" />
        <p>
          Los usuarios se registran desde <code className="text-gold">/auth</code>. Aquí asignas
          roles: <strong>admin</strong> (control total) o <strong>editor</strong> (contenido limitado
          a una única sección y siempre sujeto a aprobación).
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : profiles.length === 0 ? (
        <p className="text-muted-foreground">Aún no hay usuarios registrados.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="font-condensed border-b border-border bg-background text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">Usuario</th>
                <th className="px-3 py-2">Roles</th>
                <th className="px-3 py-2">Sección</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const userRoles = roles.filter((r) => r.user_id === p.user_id).map((r) => r.role);
                const isMe = p.user_id === me?.id;
                const isEditor = userRoles.includes("editor") && !userRoles.includes("admin");
                return (
                  <tr key={p.user_id} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2">
                      <div className="font-semibold text-foreground">
                        {p.display_name ?? "Sin nombre"}{" "}
                        {isMe && <span className="text-xs text-gold">(tú)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{p.email ?? p.user_id}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        {userRoles.length === 0 && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {userRoles.map((r) => (
                          <span
                            key={r}
                            className={`font-condensed px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest ${
                              r === "admin"
                                ? "bg-gold/20 text-gold"
                                : r === "editor"
                                ? "bg-foreground/10 text-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={p.section_id ?? ""}
                        onChange={(e) => setSection(p.user_id, e.target.value || null)}
                        disabled={!isEditor}
                        title={isEditor ? "Asignar sección" : "Solo aplica a editores no administradores"}
                        className="border border-border bg-background px-2 py-1 text-xs focus:border-gold focus:outline-none disabled:opacity-50"
                      >
                        <option value="">—</option>
                        {sections.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <RoleToggle
                          enabled={userRoles.includes("admin")}
                          onClick={() => setPrimaryRole(p.user_id, "admin")}
                          icon={<ShieldCheck className="h-3.5 w-3.5" />}
                          label="Admin"
                        />
                        <RoleToggle
                          enabled={userRoles.includes("editor")}
                          onClick={() => setPrimaryRole(p.user_id, "editor")}
                          icon={<Shield className="h-3.5 w-3.5" />}
                          label="Editor"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {showCreate && (
        <CreateUserModal
          sections={sections}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

function RoleToggle({
  enabled,
  onClick,
  icon,
  label,
}: {
  enabled: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`font-condensed inline-flex items-center gap-1 border px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest transition-colors ${
        enabled
          ? "border-gold bg-gold/10 text-gold"
          : "border-border bg-background text-muted-foreground hover:text-foreground"
      }`}
      title={enabled ? `Quitar ${label}` : `Asignar ${label}`}
    >
      {enabled ? icon : <ShieldOff className="h-3.5 w-3.5" />} {label}
    </button>
  );
}
