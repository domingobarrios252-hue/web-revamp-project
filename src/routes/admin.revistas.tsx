import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

type Magazine = {
  id: string;
  title: string;
  slug: string;
  issue_number: string | null;
  edition_date: string;
  description: string | null;
  cover_url: string | null;
  pdf_url: string | null;
  read_url: string | null;
  published: boolean;
  sort_order: number;
};

const schema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9-]+$/),
  issue_number: z.string().trim().max(20).optional().or(z.literal("")),
  edition_date: z.string().min(8),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  cover_url: z.string().trim().url().optional().or(z.literal("")),
  pdf_url: z.string().trim().url().optional().or(z.literal("")),
  read_url: z.string().trim().url().optional().or(z.literal("")),
  published: z.boolean(),
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export const Route = createFileRoute("/admin/revistas")({
  head: () => ({ meta: [{ title: "Admin · Revistas" }, { name: "robots", content: "noindex" }] }),
  component: AdminRevistas,
});

function AdminRevistas() {
  const [items, setItems] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Magazine | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("magazines").select("*").order("edition_date", { ascending: false });
    setItems((data as Magazine[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar revista?")) return;
    const { error } = await supabase.from("magazines").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Revista eliminada");
    load();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest">Revistas</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark">
          <Plus className="h-4 w-4" /> Nueva edición
        </button>
      </div>

      {showForm && (
        <MagForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}

      {loading ? <p className="text-muted-foreground">Cargando…</p> : items.length === 0 ? <p className="text-muted-foreground">Aún no hay ediciones.</p> : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full">
            <thead className="border-b border-border bg-surface">
              <tr className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 text-left">Portada</th>
                <th className="px-3 py-2 text-left">Título</th>
                <th className="px-3 py-2 text-left">Nº</th>
                <th className="px-3 py-2 text-left">Fecha edición</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">{m.cover_url && <img src={m.cover_url} alt="" className="h-14 w-10 object-cover" />}</td>
                  <td className="px-3 py-2"><div className="font-display text-sm uppercase">{m.title}</div><div className="font-condensed text-[10px] text-muted-foreground">/{m.slug}</div></td>
                  <td className="px-3 py-2 text-xs">{m.issue_number || "—"}</td>
                  <td className="px-3 py-2 text-xs">{m.edition_date}</td>
                  <td className="px-3 py-2 text-xs">{m.published ? <span className="text-gold">Publicada</span> : <span className="text-muted-foreground">Borrador</span>}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => { setEditing(m); setShowForm(true); }} className="mr-2 text-muted-foreground hover:text-gold"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => onDelete(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
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

function MagForm({ initial, onClose, onSaved }: { initial: Magazine | null; onClose: () => void; onSaved: () => void; }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [issue_number, setIssue] = useState(initial?.issue_number ?? "");
  const [edition_date, setEdition] = useState(initial?.edition_date ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [cover_url, setCover] = useState(initial?.cover_url ?? "");
  const [pdf_url, setPdf] = useState(initial?.pdf_url ?? "");
  const [read_url, setRead] = useState(initial?.read_url ?? "");
  const [published, setPublished] = useState(initial?.published ?? true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const upload = async (file: File, kind: "cover" | "pdf") => {
    const isCover = kind === "cover";
    const setUp = isCover ? setUploading : setUploadingPdf;
    setUp(true);
    const ext = file.name.split(".").pop();
    const path = `magazines/${slug || slugify(title) || crypto.randomUUID()}-${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) { toast.error(error.message); setUp(false); return; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    if (isCover) setCover(data.publicUrl); else setPdf(data.publicUrl);
    setUp(false);
  };

  const onSave = async () => {
    const parsed = schema.safeParse({ title, slug, issue_number, edition_date, description, cover_url, pdf_url, read_url, published });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");
    setSaving(true);
    const payload = {
      title: parsed.data.title,
      slug: parsed.data.slug,
      issue_number: parsed.data.issue_number || null,
      edition_date: parsed.data.edition_date,
      description: parsed.data.description || null,
      cover_url: parsed.data.cover_url || null,
      pdf_url: parsed.data.pdf_url || null,
      read_url: parsed.data.read_url || null,
      published: parsed.data.published,
    };
    const { error } = initial
      ? await supabase.from("magazines").update(payload).eq("id", initial.id)
      : await supabase.from("magazines").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Revista actualizada" : "Revista creada");
    onSaved();
  };

  return (
    <div className="mb-6 border border-gold bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg tracking-widest text-gold">{initial ? "Editar edición" : "Nueva edición"}</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block"><span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Título *</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => !slug && setSlug(slugify(title))} className="input" /></label>
        <label className="block"><span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Slug *</span>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input" /></label>
        <label className="block"><span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Nº edición</span>
          <input value={issue_number} onChange={(e) => setIssue(e.target.value)} placeholder="Ej. 12" className="input" /></label>
        <label className="block"><span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Fecha de edición *</span>
          <input type="date" value={edition_date} onChange={(e) => setEdition(e.target.value)} className="input" /></label>
        <label className="block md:col-span-2"><span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Descripción</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[60px]" /></label>

        <label className="block md:col-span-2"><span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Portada</span>
          <div className="flex items-center gap-2">
            <input value={cover_url} onChange={(e) => setCover(e.target.value)} placeholder="URL o subir archivo" className="input flex-1" />
            <label className="font-condensed inline-flex cursor-pointer items-center gap-1 border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/10">
              <Upload className="h-3.5 w-3.5" /> {uploading ? "…" : "Subir"}
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cover")} className="hidden" />
            </label>
          </div>
          {cover_url && <img src={cover_url} alt="" className="mt-2 h-32 w-24 object-cover" />}
        </label>

        <label className="block"><span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">PDF</span>
          <div className="flex items-center gap-2">
            <input value={pdf_url} onChange={(e) => setPdf(e.target.value)} placeholder="URL o subir PDF" className="input flex-1" />
            <label className="font-condensed inline-flex cursor-pointer items-center gap-1 border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/10">
              <Upload className="h-3.5 w-3.5" /> {uploadingPdf ? "…" : "Subir"}
              <input type="file" accept="application/pdf" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "pdf")} className="hidden" />
            </label>
          </div>
        </label>
        <label className="block"><span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">URL de lectura online</span>
          <input value={read_url} onChange={(e) => setRead(e.target.value)} placeholder="https://issuu.com/…" className="input" /></label>

        <label className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          <span className="font-condensed text-xs uppercase tracking-widest">Publicada</span>
        </label>
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={onSave} disabled={saving} className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50">{saving ? "Guardando…" : initial ? "Guardar" : "Crear edición"}</button>
        <button onClick={onClose} className="font-condensed border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Cancelar</button>
      </div>
    </div>
  );
}
