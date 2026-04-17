import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

type Region = { id: string; name: string };
type Club = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  region_id: string | null;
  website: string | null;
  regions: { name: string } | null;
};

const clubSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  logo_url: z.string().trim().url().optional().or(z.literal("")),
  region_id: z.string().uuid().optional().or(z.literal("")),
  website: z.string().trim().url().optional().or(z.literal("")),
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const Route = createFileRoute("/admin/clubes")({
  head: () => ({ meta: [{ title: "Admin · Clubes" }, { name: "robots", content: "noindex" }] }),
  component: AdminClubs,
});

function AdminClubs() {
  const [items, setItems] = useState<Club[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Club | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const [c, r] = await Promise.all([
      supabase
        .from("clubs")
        .select("id, name, slug, logo_url, region_id, website, regions(name)")
        .order("name"),
      supabase.from("regions").select("id, name").order("sort_order"),
    ]);
    setItems((c.data as unknown as Club[]) ?? []);
    setRegions((r.data as unknown as Region[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar club?")) return;
    const { error } = await supabase.from("clubs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Club eliminado");
    load();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest">Clubes</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Nuevo
        </button>
      </div>

      {showForm && (
        <ClubForm
          initial={editing}
          regions={regions}
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
        <p className="text-muted-foreground">Aún no hay clubes.</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full">
            <thead className="border-b border-border bg-surface">
              <tr className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 text-left">Logo</th>
                <th className="px-3 py-2 text-left">Club</th>
                <th className="px-3 py-2 text-left">CCAA</th>
                <th className="px-3 py-2 text-left">Web</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">
                    {c.logo_url && <img src={c.logo_url} alt="" className="h-8 w-8 object-contain" />}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-display text-sm uppercase">{c.name}</div>
                    <div className="font-condensed text-[10px] text-muted-foreground">/{c.slug}</div>
                  </td>
                  <td className="px-3 py-2 text-sm">{c.regions?.name ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {c.website ? (
                      <a href={c.website} target="_blank" rel="noreferrer" className="hover:text-gold">
                        {c.website.replace(/^https?:\/\//, "").slice(0, 30)}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => {
                        setEditing(c);
                        setShowForm(true);
                      }}
                      className="mr-2 text-muted-foreground hover:text-gold"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(c.id)}
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

function ClubForm({
  initial,
  regions,
  onClose,
  onSaved,
}: {
  initial: Club | null;
  regions: Region[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [logo_url, setLogoUrl] = useState(initial?.logo_url ?? "");
  const [region_id, setRegionId] = useState(initial?.region_id ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `clubs/${slug || slugify(name) || crypto.randomUUID()}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("skaters").upload(path, file);
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("skaters").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setUploading(false);
  };

  const onSave = async () => {
    const parsed = clubSchema.safeParse({
      name,
      slug,
      logo_url: logo_url || undefined,
      region_id: region_id || undefined,
      website: website || undefined,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");
    setSaving(true);
    const payload = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      logo_url: parsed.data.logo_url || null,
      region_id: parsed.data.region_id || null,
      website: parsed.data.website || null,
    };
    const { error } = initial
      ? await supabase.from("clubs").update(payload).eq("id", initial.id)
      : await supabase.from("clubs").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Club actualizado" : "Club creado");
    onSaved();
  };

  return (
    <div className="mb-6 border border-gold bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg tracking-widest text-gold">
          {initial ? "Editar club" : "Nuevo club"}
        </h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Nombre *
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => !slug && setSlug(slugify(name))}
            className="input"
          />
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Slug *
          </span>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input" />
        </label>
        <label className="block md:col-span-2">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Logo del club
          </span>
          <div className="flex items-center gap-2">
            <input
              value={logo_url}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="URL o subir archivo"
              className="input flex-1"
            />
            <label className="font-condensed inline-flex cursor-pointer items-center gap-1 border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/10">
              <Upload className="h-3.5 w-3.5" /> {uploading ? "…" : "Subir"}
              <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
            </label>
          </div>
          {logo_url && <img src={logo_url} alt="" className="mt-2 h-16 w-16 object-contain" />}
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Comunidad
          </span>
          <select value={region_id} onChange={(e) => setRegionId(e.target.value)} className="input">
            <option value="">—</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Sitio web
          </span>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://…"
            className="input"
          />
        </label>
      </div>
      <div className="mt-5 flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
        >
          {saving ? "Guardando…" : initial ? "Guardar" : "Crear club"}
        </button>
        <button
          onClick={onClose}
          className="font-condensed border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
