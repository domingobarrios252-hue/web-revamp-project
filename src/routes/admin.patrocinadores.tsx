import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

type Sponsor = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  tier: string;
  published: boolean;
  sort_order: number;
};

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  logo_url: z.string().trim().url().optional().or(z.literal("")),
  website_url: z.string().trim().url().optional().or(z.literal("")),
  tier: z.enum(["principal", "platino", "standard", "colaborador"]),
  sort_order: z.number().int().min(0).max(9999),
  published: z.boolean(),
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export const Route = createFileRoute("/admin/patrocinadores")({
  head: () => ({ meta: [{ title: "Admin · Patrocinadores" }, { name: "robots", content: "noindex" }] }),
  component: AdminSponsors,
});

function AdminSponsors() {
  const [items, setItems] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sponsors").select("*").order("sort_order").order("name");
    setItems((data as Sponsor[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar patrocinador?")) return;
    const { error } = await supabase.from("sponsors").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Patrocinador eliminado");
    load();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest">Patrocinadores</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark">
          <Plus className="h-4 w-4" /> Nuevo
        </button>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">Logo recomendado: <strong className="text-foreground">500 × 200 px</strong> (PNG con fondo transparente o JPG).</p>

      {showForm && (
        <SponsorForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}

      {loading ? <p className="text-muted-foreground">Cargando…</p> : items.length === 0 ? <p className="text-muted-foreground">Aún no hay patrocinadores.</p> : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full">
            <thead className="border-b border-border bg-surface">
              <tr className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 text-left">Logo</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Tier</th>
                <th className="px-3 py-2 text-left">Web</th>
                <th className="px-3 py-2 text-left">Orden</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">{s.logo_url && <img src={s.logo_url} alt="" className="h-10 w-24 bg-white object-contain p-1" />}</td>
                  <td className="px-3 py-2"><div className="font-display text-sm uppercase">{s.name}</div></td>
                  <td className="px-3 py-2 text-xs uppercase">{s.tier}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{s.website_url ? s.website_url.replace(/^https?:\/\//, "").slice(0, 30) : "—"}</td>
                  <td className="px-3 py-2 text-xs">{s.sort_order}</td>
                  <td className="px-3 py-2 text-xs">{s.published ? <span className="text-gold">Visible</span> : <span className="text-muted-foreground">Oculto</span>}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => { setEditing(s); setShowForm(true); }} className="mr-2 text-muted-foreground hover:text-gold"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => onDelete(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
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

function SponsorForm({ initial, onClose, onSaved }: { initial: Sponsor | null; onClose: () => void; onSaved: () => void; }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [logo_url, setLogo] = useState(initial?.logo_url ?? "");
  const [website_url, setWebsite] = useState(initial?.website_url ?? "");
  const [tier, setTier] = useState<Sponsor["tier"]>(initial?.tier ?? "standard");
  const [sort_order, setSortOrder] = useState<number>(initial?.sort_order ?? 0);
  const [published, setPublished] = useState(initial?.published ?? true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `sponsors/${slug || slugify(name) || crypto.randomUUID()}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setLogo(data.publicUrl);
    setUploading(false);
  };

  const onSave = async () => {
    const parsed = schema.safeParse({
      name, slug, description, logo_url, website_url, tier, sort_order: Number(sort_order) || 0, published,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");
    setSaving(true);
    const payload = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      logo_url: parsed.data.logo_url || null,
      website_url: parsed.data.website_url || null,
      tier: parsed.data.tier,
      sort_order: parsed.data.sort_order,
      published: parsed.data.published,
    };
    const { error } = initial
      ? await supabase.from("sponsors").update(payload).eq("id", initial.id)
      : await supabase.from("sponsors").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Patrocinador actualizado" : "Patrocinador creado");
    onSaved();
  };

  return (
    <div className="mb-6 border border-gold bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg tracking-widest text-gold">{initial ? "Editar patrocinador" : "Nuevo patrocinador"}</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block"><span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Nombre *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => !slug && setSlug(slugify(name))} className="input" /></label>
        <label className="block"><span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Slug *</span>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input" /></label>
        <label className="block md:col-span-2"><span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Descripción</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" /></label>
        <label className="block md:col-span-2"><span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Logo (500 × 200 px)</span>
          <div className="flex items-center gap-2">
            <input value={logo_url} onChange={(e) => setLogo(e.target.value)} placeholder="URL o subir archivo" className="input flex-1" />
            <label className="font-condensed inline-flex cursor-pointer items-center gap-1 border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/10">
              <Upload className="h-3.5 w-3.5" /> {uploading ? "…" : "Subir"}
              <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
            </label>
          </div>
          {logo_url && (
            <div className="mt-2 inline-flex items-center justify-center bg-white p-2" style={{ width: 250, height: 100 }}>
              <img src={logo_url} alt="" className="max-h-full max-w-full object-contain" />
            </div>
          )}
        </label>
        <label className="block"><span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Sitio web</span>
          <input value={website_url} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className="input" /></label>
        <label className="block"><span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Tier</span>
          <select value={tier} onChange={(e) => setTier(e.target.value as Sponsor["tier"])} className="input">
            <option value="principal">Principal</option>
            <option value="platino">Platino</option>
            <option value="standard">Standard</option>
            <option value="colaborador">Colaborador</option>
          </select></label>
        <label className="block"><span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Orden de aparición</span>
          <input type="number" value={sort_order} onChange={(e) => setSortOrder(Number(e.target.value))} className="input" /></label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          <span className="font-condensed text-xs uppercase tracking-widest">Visible en la web</span>
        </label>
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={onSave} disabled={saving} className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50">{saving ? "Guardando…" : initial ? "Guardar" : "Crear"}</button>
        <button onClick={onClose} className="font-condensed border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Cancelar</button>
      </div>
    </div>
  );
}
