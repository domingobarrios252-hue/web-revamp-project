import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shield, ShieldCheck, ShieldOff, UserPlus, Ban, Trash2, RotateCcw, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

type AppRole = "admin" | "editor" | "user" | "colaborador" | "lector";
type Profile = { user_id: string; display_name: string | null; email: string | null; section_id: string | null; suspended_at: string | null };
type RoleRow = { user_id: string; role: AppRole };
type Section = { id: string; name: string };
type Filter = "all" | "admin" | "editor" | "lector" | "suspended";

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
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const reload = async () => {
    setLoading(true);
    const [{ data: p }, { data: r }, { data: s }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, email, section_id, suspended_at"),
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter((p) => {
      const userRoles = roles.filter((r) => r.user_id === p.user_id).map((r) => r.role);
      if (filter === "admin" && !userRoles.includes("admin")) return false;
      if (filter === "editor" && !(userRoles.includes("editor") && !userRoles.includes("admin"))) return false;
      if (filter === "lector") {
        const isLector = userRoles.includes("lector") || userRoles.length === 0;
        const isPrivileged = userRoles.includes("admin") || userRoles.includes("editor") || userRoles.includes("colaborador");
        if (!isLector || isPrivileged) return false;
      }
      if (filter === "suspended" && !p.suspended_at) return false;
      if (q) {
        const hay = `${p.display_name ?? ""} ${p.email ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [profiles, roles, filter, search]);

  if (!isAdmin) {
    return <p className="text-muted-foreground">Solo administradores.</p>;
  }

  const setPrimaryRole = async (userId: string, role: AppRole) => {
    if (userId === me?.id && role !== "admin") {
      if (!confirm("Vas a cambiar tu propio rol y perderás el acceso al panel. ¿Continuar?")) return;
    }
    const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (deleteError) return toast.error(deleteError.message);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) toast.error(error.message);
    else toast.success(`Rol ${role} asignado`);
    if (role !== "editor") await setSection(userId, null);
    reload();
  };

  const setSection = async (userId: string, sectionId: string | null) => {
    const { error } = await supabase
      .from("profiles")
      .update({ section_id: sectionId })
      .eq("user_id", userId);
    if (error) toast.error(error.message);
    else {
      if (sectionId !== null) toast.success("Sección actualizada");
      reload();
    }
  };

  const toggleSuspend = async (p: Profile) => {
    if (p.user_id === me?.id) return toast.error("No puedes suspenderte a ti mismo.");
    const next = p.suspended_at ? null : new Date().toISOString();
    const { error } = await supabase.from("profiles").update({ suspended_at: next }).eq("user_id", p.user_id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Usuario suspendido" : "Suspensión retirada");
    reload();
  };

  const deleteUser = async (p: Profile) => {
    if (p.user_id === me?.id) return toast.error("No puedes eliminarte a ti mismo.");
    if (!confirm(`¿Eliminar definitivamente a ${p.email ?? p.display_name}? Esta acción es irreversible.`)) return;
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: { action: "delete", userId: p.user_id },
    });
    if (error) return toast.error(error.message);
    if ((data as { error?: string } | null)?.error) return toast.error((data as { error: string }).error);
    toast.success("Usuario eliminado");
    reload();
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
          Los usuarios se registran desde <code className="text-gold">/auth</code> y reciben por defecto el rol{" "}
          <strong className="text-foreground">LECTOR</strong>. Aquí puedes ascender a{" "}
          <strong>editor</strong> (contenido limitado a una sección, sujeto a aprobación) o{" "}
          <strong>admin</strong> (control total), y también <strong>suspender</strong> o{" "}
          <strong>eliminar</strong> cuentas.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["all", "admin", "editor", "lector", "suspended"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-condensed border px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
              filter === f ? "border-gold bg-gold/10 text-gold" : "border-border bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "Todos" : f === "suspended" ? "Suspendidos" : f}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email…"
          className="ml-auto min-w-[220px] border border-border bg-background px-3 py-1.5 text-xs focus:border-gold focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">Sin resultados con el filtro actual.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="font-condensed border-b border-border bg-background text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">Usuario</th>
                <th className="px-3 py-2">Roles</th>
                <th className="px-3 py-2">Sección</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const userRoles = roles.filter((r) => r.user_id === p.user_id).map((r) => r.role);
                const isMe = p.user_id === me?.id;
                const isEditor = userRoles.includes("editor") && !userRoles.includes("admin");
                return (
                  <tr key={p.user_id} className={`border-b border-border/50 last:border-0 ${p.suspended_at ? "bg-destructive/5" : ""}`}>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-foreground">
                        {p.display_name ?? "Sin nombre"}{" "}
                        {isMe && <span className="text-xs text-gold">(tú)</span>}
                        {p.suspended_at && (
                          <span className="ml-2 rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-destructive">
                            Suspendido
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{p.email ?? p.user_id}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        {userRoles.length === 0 && (
                          <span className="font-condensed bg-muted px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            lector
                          </span>
                        )}
                        {userRoles.map((r) => (
                          <span
                            key={r}
                            className={`font-condensed px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest ${
                              r === "admin"
                                ? "bg-gold/20 text-gold"
                                : r === "editor"
                                ? "bg-foreground/10 text-foreground"
                                : r === "lector"
                                ? "bg-blue-500/15 text-blue-400"
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
                          enabled={userRoles.includes("lector") || userRoles.length === 0}
                          onClick={() => setPrimaryRole(p.user_id, "lector")}
                          icon={<BookOpen className="h-3.5 w-3.5" />}
                          label="Lector"
                        />
                        <RoleToggle
                          enabled={userRoles.includes("editor") && !userRoles.includes("admin")}
                          onClick={() => setPrimaryRole(p.user_id, "editor")}
                          icon={<Shield className="h-3.5 w-3.5" />}
                          label="Editor"
                        />
                        <RoleToggle
                          enabled={userRoles.includes("admin")}
                          onClick={() => setPrimaryRole(p.user_id, "admin")}
                          icon={<ShieldCheck className="h-3.5 w-3.5" />}
                          label="Admin"
                        />
                        {!isMe && (
                          <>
                            <button
                              onClick={() => toggleSuspend(p)}
                              className={`font-condensed inline-flex items-center gap-1 border px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                                p.suspended_at
                                  ? "border-green-600 bg-green-600/10 text-green-500 hover:bg-green-600/20"
                                  : "border-yellow-600/60 bg-yellow-600/10 text-yellow-500 hover:bg-yellow-600/20"
                              }`}
                              title={p.suspended_at ? "Reactivar usuario" : "Suspender acceso"}
                            >
                              {p.suspended_at ? <RotateCcw className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                              {p.suspended_at ? "Reactivar" : "Suspender"}
                            </button>
                            <button
                              onClick={() => deleteUser(p)}
                              className="font-condensed inline-flex items-center gap-1 border border-destructive/60 bg-destructive/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/20"
                              title="Eliminar definitivamente"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Eliminar
                            </button>
                          </>
                        )}
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

function CreateUserModal({
  sections,
  onClose,
  onCreated,
}: {
  sections: Section[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "lector">("lector");
  const [sectionId, setSectionId] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "editor" && !sectionId) return toast.error("Asigna una sección al editor");
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: {
        action: "create",
        email,
        password,
        displayName,
        role,
        sectionId: role === "editor" ? sectionId : null,
      },
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else if ((data as { error?: string } | null)?.error) toast.error((data as { error: string }).error);
    else {
      toast.success("Usuario creado");
      onCreated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur">
      <div className="w-full max-w-lg border border-border bg-surface p-5 md:p-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-widest">Crear usuario</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <UserField label="Nombre" value={displayName} onChange={setDisplayName} required />
          <UserField label="Email" type="email" value={email} onChange={setEmail} required />
          <UserField label="Contraseña temporal" type="password" value={password} onChange={setPassword} required />
          <label className="block">
            <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Rol</span>
            <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "editor" | "lector")} className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none">
              <option value="lector">Lector</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          {role === "editor" && (
            <label className="block">
              <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Sección única</span>
              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} required className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none">
                <option value="">— Selecciona sección —</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <button type="button" onClick={onClose} className="font-condensed border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50">{saving ? "Creando…" : "Crear usuario"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserField({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none" />
    </label>
  );
}
