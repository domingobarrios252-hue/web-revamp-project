import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/permisos")({
  head: () => ({
    meta: [
      { title: "Permisos por sección | RollerZone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPermissionsPage,
});

/** Secciones del sitio sobre las que se pueden conceder permisos a un editor. */
const SECTIONS = [
  "noticias",
  "resultados",
  "eventos",
  "rollerzone-tv",
  "revista",
  "especiales",
  "colombia",
  "espana",
  "venezuela",
  "publicidad",
  "colaboraciones",
] as const;

type Section = (typeof SECTIONS)[number];
type Action = "can_create" | "can_edit" | "can_delete" | "can_publish";
const ACTIONS: { key: Action; label: string }[] = [
  { key: "can_create", label: "Crear" },
  { key: "can_edit", label: "Editar" },
  { key: "can_delete", label: "Eliminar" },
  { key: "can_publish", label: "Publicar" },
];

type PermRow = {
  user_id: string;
  section: string;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_publish: boolean;
};
type Member = { user_id: string; display_name: string | null; email: string | null; role: string };

function AdminPermissionsPage() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [perms, setPerms] = useState<Record<string, PermRow>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const [{ data: roles }, { data: profiles }, emails] = await Promise.all([
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("profiles").select("user_id, display_name"),
        supabase.rpc("admin_list_account_emails"),
      ]);
      const emailMap = new Map<string, string | null>(
        ((emails.data as { user_id: string; email: string | null }[] | null) ?? []).map((e) => [
          e.user_id,
          e.email,
        ]),
      );
      const nameMap = new Map<string, string | null>(
        ((profiles as { user_id: string; display_name: string | null }[] | null) ?? []).map((p) => [
          p.user_id,
          p.display_name,
        ]),
      );
      const staff = ((roles as { user_id: string; role: string }[] | null) ?? []).filter((r) =>
        ["editor", "colaborador"].includes(r.role),
      );
      setMembers(
        staff.map((r) => ({
          user_id: r.user_id,
          role: r.role,
          display_name: nameMap.get(r.user_id) ?? null,
          email: emailMap.get(r.user_id) ?? null,
        })),
      );
      setLoading(false);
    })();
  }, [isAdmin]);

  useEffect(() => {
    if (!selected) return;
    supabase
      .from("editor_permissions")
      .select("user_id, section, can_create, can_edit, can_delete, can_publish")
      .eq("user_id", selected)
      .then(({ data }) => {
        const map: Record<string, PermRow> = {};
        ((data as PermRow[] | null) ?? []).forEach((r) => (map[r.section] = r));
        setPerms(map);
      });
  }, [selected]);

  const rows = useMemo(
    () =>
      SECTIONS.map((section) => ({
        section,
        row:
          perms[section] ??
          ({
            user_id: selected ?? "",
            section,
            can_create: false,
            can_edit: false,
            can_delete: false,
            can_publish: false,
          } as PermRow),
      })),
    [perms, selected],
  );

  if (!isAdmin) return <p className="text-muted-foreground">Solo administradores.</p>;

  const toggle = (section: Section, action: Action) => {
    setPerms((prev) => {
      const current =
        prev[section] ??
        ({
          user_id: selected ?? "",
          section,
          can_create: false,
          can_edit: false,
          can_delete: false,
          can_publish: false,
        } as PermRow);
      return { ...prev, [section]: { ...current, [action]: !current[action] } };
    });
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const payload = rows
      .filter(({ row }) => row.can_create || row.can_edit || row.can_delete || row.can_publish)
      .map(({ row }) => ({ ...row, user_id: selected }));
    const emptySections = rows
      .filter(({ row }) => !(row.can_create || row.can_edit || row.can_delete || row.can_publish))
      .map(({ section }) => section);

    if (emptySections.length) {
      await supabase
        .from("editor_permissions")
        .delete()
        .eq("user_id", selected)
        .in("section", emptySections);
    }
    if (payload.length) {
      const { error } = await supabase
        .from("editor_permissions")
        .upsert(payload.map(({ user_id, section, can_create, can_edit, can_delete, can_publish }) => ({
          user_id,
          section,
          can_create,
          can_edit,
          can_delete,
          can_publish,
        })), { onConflict: "user_id,section" });
      if (error) {
        setSaving(false);
        return toast.error(error.message);
      }
    }
    setSaving(false);
    toast.success("Permisos guardados");
  };

  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-gold" />
        <h1 className="font-display text-2xl tracking-widest md:text-3xl">Permisos por sección</h1>
      </div>
      <p className="mb-5 border border-border bg-surface p-3 text-xs text-muted-foreground">
        Define qué puede hacer cada editor o colaborador en cada sección. Las comprobaciones se
        aplican también en el servidor, no solo en la interfaz.
      </p>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : members.length === 0 ? (
        <p className="text-muted-foreground">No hay editores ni colaboradores todavía.</p>
      ) : (
        <>
          <label className="mb-5 block max-w-md">
            <span className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
              Miembro del equipo
            </span>
            <select
              value={selected ?? ""}
              onChange={(e) => setSelected(e.target.value || null)}
              className="min-h-11 w-full border border-border bg-background px-3 text-sm"
            >
              <option value="">Selecciona…</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name || m.email || m.user_id} · {m.role}
                </option>
              ))}
            </select>
          </label>

          {selected && (
            <>
              <div className="overflow-x-auto border border-border bg-surface">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="border-b border-border bg-background">
                    <tr>
                      <th className="px-3 py-2 text-left">Sección</th>
                      {ACTIONS.map((a) => (
                        <th key={a.key} className="px-3 py-2 text-center">
                          {a.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ section, row }) => (
                      <tr key={section} className="border-b border-border/60">
                        <td className="px-3 py-2 capitalize">{section.replace(/-/g, " ")}</td>
                        {ACTIONS.map((a) => (
                          <td key={a.key} className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={row[a.key]}
                              onChange={() => toggle(section, a.key)}
                              className="h-5 w-5 accent-[#D4A017]"
                              aria-label={`${a.label} ${section}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={save}
                disabled={saving}
                className="font-condensed mt-4 inline-flex min-h-11 items-center gap-2 bg-gold px-5 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar permisos"}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
