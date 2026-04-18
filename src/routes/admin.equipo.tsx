import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

type Member = {
  id: string;
  full_name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  sort_order: number;
  published: boolean;
};

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  role: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  photo_url: z.string().trim().url().optional().or(z.literal("")),
  sort_order: z.number().int().min(0).max(9999),
  published: z.boolean(),
});

export const Route = createFileRoute("/admin/equipo")({
  head: () => ({
    meta: [{ title: "Admin · Equipo" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminEquipo,
});

function AdminEquipo() {
  const [items, setItems] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Member | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("team_members")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("full_name", { ascending: true });
    setItems((data as Member[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar miembro del equipo?")) return;
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Miembro eliminado");
    load();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest">Equipo</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Nuevo miembro
        </button>
      </div>

      {showForm && (
        <MemberForm
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Aún no hay miembros del equipo.</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full">
            <thead className="border-b border-border bg-surface">
              <tr className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 text-left">Foto</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Rol</th>
                <th className="px-3 py-2 text-left">Orden</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">
                    {m.photo_url ? (
                      <img src={m.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-surface" />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-display text-sm uppercase">{m.full_name}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gold">{m.role}</td>
                  <td className="px-3 py-2 text-xs">{m.sort_order}</td>
                  <td className="px-3 py-2 text-xs">
                    {m.published ? (
                      <span className="text-gold">Publicado</span>
                    ) : (
                      <span className="text-muted-foreground">Oculto</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => {
                        setEditing(m);
                        setShowForm(true);
                      }}
                      className="mr-2 text-muted-foreground hover:text-gold"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(m.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MemberForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Member | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [full_name, setName] = useState(initial?.full_name ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [photo_url, setPhoto] = useState(initial?.photo_url ?? "");
  const [sort_order, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [published, setPublished] = useState(initial?.published ?? true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const safeName = (full_name || "miembro")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
    const path = `team/${safeName || "miembro"}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setPhoto(data.publicUrl);
    setUploading(false);
  };

  const onSave = async () => {
    const parsed = schema.safeParse({
      full_name,
      role,
      bio,
      photo_url,
      sort_order: Number(sort_order) || 0,
      published,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");
    setSaving(true);
    const payload = {
      full_name: parsed.data.full_name,
      role: parsed.data.role,
      bio: parsed.data.bio || null,
      photo_url: parsed.data.photo_url || null,
      sort_order: parsed.data.sort_order,
      published: parsed.data.published,
    };
    const { error } = initial
      ? await supabase.from("team_members").update(payload).eq("id", initial.id)
      : await supabase.from("team_members").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Miembro actualizado" : "Miembro creado");
    onSaved();
  };

  return (
    <div className="mb-6 border border-gold bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg tracking-widest text-gold">
          {initial ? "Editar miembro" : "Nuevo miembro"}
        </h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Nombre completo *
          </span>
          <input value={full_name} onChange={(e) => setName(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Rol *
          </span>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input"
            placeholder="Director, Redactor, Fotógrafo…"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Biografía corta
          </span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="input min-h-[100px]"
            placeholder="Una breve descripción del miembro del equipo…"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Foto
          </span>
          <div className="flex items-center gap-2">
            <input
              value={photo_url}
              onChange={(e) => setPhoto(e.target.value)}
              placeholder="URL o subir archivo"
              className="input flex-1"
            />
            <label className="font-condensed inline-flex cursor-pointer items-center gap-1 border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/10">
              <Upload className="h-3.5 w-3.5" /> {uploading ? "…" : "Subir"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>
          {photo_url && (
            <img src={photo_url} alt="" className="mt-2 h-32 w-32 rounded-full object-cover" />
          )}
        </label>

        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Orden
          </span>
          <input
            type="number"
            value={sort_order}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="input"
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          <span className="font-condensed text-xs uppercase tracking-widest">Publicado</span>
        </label>
      </div>
      <div className="mt-5 flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
        >
          {saving ? "Guardando…" : initial ? "Guardar" : "Crear miembro"}
        </button>
        <button
          onClick={onClose}
          className="font-condensed border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
