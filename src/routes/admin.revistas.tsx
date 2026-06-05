import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Upload, X, Check, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Magazine = {
  id: string;
  title: string;
  slug: string;
  issue_number: string | null;
  edition_number: number | null;
  edition_date: string;
  description: string | null;
  cover_url: string | null;
  cover_image_url: string | null;
  pdf_url: string | null;
  read_url: string | null;
  published: boolean;
  sort_order: number;
  country: string | null;
  price: number | null;
  is_active: boolean | null;
  is_free: boolean | null;
};

const schema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9-]+$/),
  issue_number: z.string().trim().max(20).optional().or(z.literal("")),
  edition_number: z.number().int().min(0).max(9999).nullable(),
  edition_date: z.string().min(8),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  cover_url: z.string().trim().url().optional().or(z.literal("")),
  cover_image_url: z.string().trim().url().optional().or(z.literal("")),
  pdf_url: z.string().trim().url().optional().or(z.literal("")),
  read_url: z.string().trim().url().optional().or(z.literal("")),
  published: z.boolean(),
  country: z.enum(["spain", "colombia"]),
  price: z.number().min(0).max(99.99),
  is_active: z.boolean(),
  is_free: z.boolean(),
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function formatPrice(p: number | null) {
  return Number(p ?? 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
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
  const [newCountry, setNewCountry] = useState<"spain" | "colombia">("spain");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("magazines")
      .select("*")
      .order("edition_number", { ascending: false, nullsFirst: false })
      .order("edition_date", { ascending: false });
    setItems((data as Magazine[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const { spain, colombia } = useMemo(() => {
    const s: Magazine[] = []; const c: Magazine[] = [];
    items.forEach((m) => (m.country === "colombia" ? c.push(m) : s.push(m)));
    return { spain: s, colombia: c };
  }, [items]);

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar revista? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from("magazines").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Revista eliminada");
    load();
  };

  const togglePatch = async (m: Magazine, patch: Partial<Magazine>) => {
    const { error } = await supabase.from("magazines").update(patch).eq("id", m.id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...patch } : x)));
  };

  const savePrice = async (m: Magazine, raw: string) => {
    const v = Number(raw.replace(",", "."));
    if (Number.isNaN(v) || v < 0) return toast.error("Precio no válido");
    await togglePatch(m, { price: v });
    toast.success(`Precio actualizado: ${formatPrice(v)}`);
  };

  const startNew = (country: "spain" | "colombia") => {
    setNewCountry(country); setEditing(null); setShowForm(true);
  };

  return (
    <div>
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-widest">Revistas</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Gestiona las ediciones de RollerZone España y Colombia. Marca cuáles están <span className="text-gold">en venta</span> y define su precio.
          </p>
        </div>
      </header>

      {showForm && (
        <MagForm
          initial={editing}
          defaultCountry={newCountry}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}

      <Tabs defaultValue="spain" className="w-full">
        <TabsList className="mb-4 bg-surface">
          <TabsTrigger value="spain" className="font-condensed uppercase tracking-widest">
            🇪🇸 España <span className="ml-2 text-xs opacity-70">({spain.length})</span>
          </TabsTrigger>
          <TabsTrigger value="colombia" className="font-condensed uppercase tracking-widest">
            🇨🇴 Colombia <span className="ml-2 text-xs opacity-70">({colombia.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spain">
          <CountryPanel
            country="spain"
            items={spain}
            loading={loading}
            onNew={() => startNew("spain")}
            onEdit={(m) => { setEditing(m); setShowForm(true); }}
            onDelete={onDelete}
            onPatch={togglePatch}
            onSavePrice={savePrice}
          />
        </TabsContent>
        <TabsContent value="colombia">
          <CountryPanel
            country="colombia"
            items={colombia}
            loading={loading}
            onNew={() => startNew("colombia")}
            onEdit={(m) => { setEditing(m); setShowForm(true); }}
            onDelete={onDelete}
            onPatch={togglePatch}
            onSavePrice={savePrice}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CountryPanel({
  country, items, loading, onNew, onEdit, onDelete, onPatch, onSavePrice,
}: {
  country: "spain" | "colombia";
  items: Magazine[];
  loading: boolean;
  onNew: () => void;
  onEdit: (m: Magazine) => void;
  onDelete: (id: string) => void;
  onPatch: (m: Magazine, patch: Partial<Magazine>) => void;
  onSavePrice: (m: Magazine, raw: string) => void;
}) {
  const label = country === "spain" ? "RollerZone España" : "RollerZone Colombia";
  return (
    <section className="rounded-lg border border-border bg-surface/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg uppercase tracking-widest text-gold">{label}</h2>
        <button onClick={onNew} className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark">
          <Plus className="h-4 w-4" /> Nueva edición
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded border border-dashed border-border bg-background py-12 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Aún no hay ediciones para {label}.</p>
          <button onClick={onNew} className="font-condensed text-xs font-bold uppercase tracking-widest text-gold hover:underline">
            Crear la primera edición →
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-background">
              <tr className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 text-left">Portada</th>
                <th className="px-3 py-2 text-left">Título</th>
                <th className="px-3 py-2 text-left">Nº</th>
                <th className="px-3 py-2 text-left">Precio (€)</th>
                <th className="px-3 py-2 text-center">En venta</th>
                <th className="px-3 py-2 text-center">Gratis</th>
                <th className="px-3 py-2 text-center">Publicada</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <MagazineRow
                  key={m.id}
                  m={m}
                  onEdit={() => onEdit(m)}
                  onDelete={() => onDelete(m.id)}
                  onPatch={(p) => onPatch(m, p)}
                  onSavePrice={(v) => onSavePrice(m, v)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function MagazineRow({
  m, onEdit, onDelete, onPatch, onSavePrice,
}: {
  m: Magazine;
  onEdit: () => void;
  onDelete: () => void;
  onPatch: (p: Partial<Magazine>) => void;
  onSavePrice: (v: string) => void;
}) {
  const [priceDraft, setPriceDraft] = useState(String(m.price ?? ""));
  useEffect(() => { setPriceDraft(String(m.price ?? "")); }, [m.price]);
  const cover = m.cover_image_url || m.cover_url;
  const editionLabel = m.edition_number != null ? String(m.edition_number) : m.issue_number || "—";
  const priceDirty = priceDraft !== String(m.price ?? "");

  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-3 py-2">
        {cover ? <img src={cover} alt="" className="h-14 w-10 object-cover" /> : <div className="h-14 w-10 bg-surface-2" />}
      </td>
      <td className="px-3 py-2">
        <div className="font-display text-sm uppercase">{m.title}</div>
        <div className="font-condensed text-[10px] text-muted-foreground">/{m.slug} · {m.edition_date}</div>
      </td>
      <td className="px-3 py-2 text-xs">{editionLabel}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <input
            type="number" step="0.01" min="0" max="99.99"
            value={priceDraft}
            onChange={(e) => setPriceDraft(e.target.value)}
            disabled={!!m.is_free}
            className="w-20 rounded border border-border bg-background px-2 py-1 text-xs disabled:opacity-50"
            placeholder="2.00"
          />
          {priceDirty && (
            <button onClick={() => onSavePrice(priceDraft)} title="Guardar precio" className="rounded border border-gold p-1 text-gold hover:bg-gold/10">
              <Check className="h-3 w-3" />
            </button>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-center">
        <Toggle checked={!!m.is_active} onChange={(v) => onPatch({ is_active: v })} />
      </td>
      <td className="px-3 py-2 text-center">
        <Toggle checked={!!m.is_free} onChange={(v) => onPatch({ is_free: v })} />
      </td>
      <td className="px-3 py-2 text-center">
        <Toggle checked={!!m.published} onChange={(v) => onPatch({ published: v })} />
      </td>
      <td className="px-3 py-2 text-right">
        <button onClick={onEdit} className="mr-2 text-muted-foreground hover:text-gold" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive" title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></button>
      </td>
    </tr>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={
        "inline-flex h-5 w-9 items-center rounded-full border transition-colors " +
        (checked ? "border-gold bg-gold/30" : "border-border bg-background")
      }
      aria-pressed={checked}
    >
      <span
        className={
          "inline-block h-3.5 w-3.5 rounded-full transition-transform " +
          (checked ? "translate-x-4 bg-gold" : "translate-x-1 bg-muted-foreground")
        }
      />
    </button>
  );
}

function MagForm({
  initial, defaultCountry, onClose, onSaved,
}: {
  initial: Magazine | null;
  defaultCountry: "spain" | "colombia";
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [issue_number, setIssue] = useState(initial?.issue_number ?? "");
  const [edition_number, setEditionNumber] = useState<string>(initial?.edition_number != null ? String(initial.edition_number) : "");
  const [edition_date, setEdition] = useState(initial?.edition_date ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [cover_url, setCover] = useState(initial?.cover_url ?? "");
  const [cover_image_url, setCoverImage] = useState(initial?.cover_image_url ?? "");
  const [pdf_url, setPdf] = useState(initial?.pdf_url ?? "");
  const [read_url, setRead] = useState(initial?.read_url ?? "");
  const [published, setPublished] = useState(initial?.published ?? true);
  const [country, setCountry] = useState<"spain" | "colombia">((initial?.country as "spain" | "colombia") ?? defaultCountry);
  const [price, setPrice] = useState<string>(initial?.price != null ? String(initial.price) : "2.50");
  const [is_active, setIsActive] = useState(initial?.is_active ?? true);
  const [is_free, setIsFree] = useState(initial?.is_free ?? false);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const uploadPdf = async (file: File) => {
    setUploadingPdf(true);
    const ext = file.name.split(".").pop();
    const path = `magazines/${slug || slugify(title) || crypto.randomUUID()}-pdf-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) { toast.error(error.message); setUploadingPdf(false); return; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setPdf(data.publicUrl);
    setUploadingPdf(false);
  };

  const onSave = async () => {
    const parsed = schema.safeParse({
      title, slug, issue_number,
      edition_number: edition_number === "" ? null : Number(edition_number),
      edition_date, description, cover_url, cover_image_url, pdf_url, read_url, published,
      country, price: Number((price || "0").replace(",", ".")), is_active, is_free,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");
    setSaving(true);
    const payload = {
      title: parsed.data.title,
      slug: parsed.data.slug,
      issue_number: parsed.data.issue_number || null,
      edition_number: parsed.data.edition_number,
      edition_date: parsed.data.edition_date,
      description: parsed.data.description || null,
      cover_url: parsed.data.cover_url || null,
      cover_image_url: parsed.data.cover_image_url || parsed.data.cover_url || null,
      pdf_url: parsed.data.pdf_url || null,
      read_url: parsed.data.read_url || null,
      published: parsed.data.published,
      country: parsed.data.country,
      price: parsed.data.price,
      is_active: parsed.data.is_active,
      is_free: parsed.data.is_free,
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
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">País *</span>
          <select value={country} onChange={(e) => setCountry(e.target.value as "spain" | "colombia")} className="input">
            <option value="spain">🇪🇸 RollerZone España</option>
            <option value="colombia">🇨🇴 RollerZone Colombia</option>
          </select>
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Nº edición</span>
          <input type="number" min="0" value={edition_number} onChange={(e) => setEditionNumber(e.target.value)} placeholder="Ej. 8" className="input" />
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Título *</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => !slug && setSlug(slugify(title))} className="input" />
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Slug *</span>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Etiqueta nº (texto)</span>
          <input value={issue_number} onChange={(e) => setIssue(e.target.value)} placeholder="Ej. 12 BIS" className="input" />
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Fecha de edición *</span>
          <input type="date" value={edition_date} onChange={(e) => setEdition(e.target.value)} className="input" />
        </label>
        <label className="block md:col-span-2">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Descripción</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[60px]" />
        </label>

        <div className="block md:col-span-2">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Portada</span>
          <ImageUploadField
            value={cover_image_url || cover_url}
            onChange={(v) => { setCoverImage(v); setCover(v); }}
            folder="magazines"
            nameHint={`${slug || slugify(title)}-cover`}
            previewClassName="mt-2 h-32 w-24 object-cover"
          />
        </div>

        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">PDF</span>
          <div className="flex items-center gap-2">
            <input value={pdf_url} onChange={(e) => setPdf(e.target.value)} placeholder="URL o subir PDF" className="input flex-1" />
            <label className="font-condensed inline-flex cursor-pointer items-center gap-1 border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/10">
              <Upload className="h-3.5 w-3.5" /> {uploadingPdf ? "…" : "Subir"}
              <input type="file" accept="application/pdf" onChange={(e) => e.target.files?.[0] && uploadPdf(e.target.files[0])} className="hidden" />
            </label>
          </div>
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">URL de lectura online</span>
          <input value={read_url} onChange={(e) => setRead(e.target.value)} placeholder="https://issuu.com/…" className="input" />
        </label>

        <div className="md:col-span-2 grid gap-3 rounded border border-border bg-background/40 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Precio (€)</span>
            <input type="number" step="0.01" min="0" max="99.99" value={price} onChange={(e) => setPrice(e.target.value)} className="input" disabled={is_free} />
          </label>
          <label className="flex items-end gap-2 pb-2">
            <input type="checkbox" checked={is_active} onChange={(e) => setIsActive(e.target.checked)} />
            <span className="font-condensed text-xs uppercase tracking-widest">En venta</span>
          </label>
          <label className="flex items-end gap-2 pb-2">
            <input type="checkbox" checked={is_free} onChange={(e) => setIsFree(e.target.checked)} />
            <span className="font-condensed text-xs uppercase tracking-widest">Gratis</span>
          </label>
          <label className="flex items-end gap-2 pb-2">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            <span className="font-condensed text-xs uppercase tracking-widest">Publicada</span>
          </label>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={onSave} disabled={saving} className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50">{saving ? "Guardando…" : initial ? "Guardar" : "Crear edición"}</button>
        <button onClick={onClose} className="font-condensed border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Cancelar</button>
      </div>
    </div>
  );
}
