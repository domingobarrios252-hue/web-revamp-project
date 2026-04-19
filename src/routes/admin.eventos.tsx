import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

type Region = { id: string; name: string };
type EventRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  organizer: string | null;
  region_id: string | null;
  scope: string;
  categories: string[];
  cover_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  registration_url: string | null;
  published: boolean;
  gallery: string[];
  regions: { name: string } | null;
};

const schema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  start_date: z.string().min(8),
  end_date: z.string().optional().or(z.literal("")),
  location: z.string().trim().max(160).optional().or(z.literal("")),
  organizer: z.string().trim().max(160).optional().or(z.literal("")),
  region_id: z.string().uuid().optional().or(z.literal("")),
  scope: z.string().trim().min(2).max(40),
  categories: z.array(z.string().min(1).max(40)).max(40),
  cover_url: z.string().trim().url().optional().or(z.literal("")),
  website_url: z.string().trim().url().optional().or(z.literal("")),
  instagram_url: z.string().trim().url().optional().or(z.literal("")),
  facebook_url: z.string().trim().url().optional().or(z.literal("")),
  registration_url: z.string().trim().url().optional().or(z.literal("")),
  published: z.boolean(),
  gallery: z.array(z.string().trim().url()).max(6),
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export const Route = createFileRoute("/admin/eventos")({
  head: () => ({ meta: [{ title: "Admin · Eventos" }, { name: "robots", content: "noindex" }] }),
  component: AdminEventos,
});

function AdminEventos() {
  const [items, setItems] = useState<EventRow[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const [e, r] = await Promise.all([
      supabase.from("events").select("*, regions(name)").order("start_date", { ascending: false }),
      supabase.from("regions").select("id, name").order("sort_order"),
    ]);
    setItems((e.data as unknown as EventRow[]) ?? []);
    setRegions((r.data as unknown as Region[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar evento?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Evento eliminado");
    load();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest">Eventos</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark">
          <Plus className="h-4 w-4" /> Nuevo
        </button>
      </div>

      {showForm && (
        <EventForm
          initial={editing}
          regions={regions}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}

      {loading ? <p className="text-muted-foreground">Cargando…</p> : items.length === 0 ? <p className="text-muted-foreground">Aún no hay eventos.</p> : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full">
            <thead className="border-b border-border bg-surface">
              <tr className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 text-left">Portada</th>
                <th className="px-3 py-2 text-left">Evento</th>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Categorías</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">{e.cover_url && <img src={e.cover_url} alt="" className="h-10 w-16 object-cover" />}</td>
                  <td className="px-3 py-2">
                    <div className="font-display text-sm uppercase">{e.name}</div>
                    <div className="font-condensed text-[10px] text-muted-foreground">{e.location || "—"} · {e.scope}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">{e.start_date}{e.end_date && e.end_date !== e.start_date ? ` → ${e.end_date}` : ""}</td>
                  <td className="px-3 py-2 text-xs">{e.categories?.join(", ") || "—"}</td>
                  <td className="px-3 py-2 text-xs">{e.published ? <span className="text-gold">Publicado</span> : <span className="text-muted-foreground">Borrador</span>}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => { setEditing(e); setShowForm(true); }} className="mr-2 text-muted-foreground hover:text-gold"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => onDelete(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
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

function EventForm({ initial, regions, onClose, onSaved }: { initial: EventRow | null; regions: Region[]; onClose: () => void; onSaved: () => void; }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [start_date, setStartDate] = useState(initial?.start_date ?? "");
  const [end_date, setEndDate] = useState(initial?.end_date ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [organizer, setOrganizer] = useState(initial?.organizer ?? "");
  const [region_id, setRegionId] = useState(initial?.region_id ?? "");
  const [scope, setScope] = useState(initial?.scope ?? "Nacional");
  const [categoriesText, setCategoriesText] = useState((initial?.categories ?? []).join(", "));
  const [cover_url, setCover] = useState(initial?.cover_url ?? "");
  const [website_url, setWebsite] = useState(initial?.website_url ?? "");
  const [instagram_url, setInstagram] = useState(initial?.instagram_url ?? "");
  const [facebook_url, setFacebook] = useState(initial?.facebook_url ?? "");
  const [registration_url, setRegistration] = useState(initial?.registration_url ?? "");
  const [published, setPublished] = useState(initial?.published ?? true);
  const [gallery, setGallery] = useState<string[]>(initial?.gallery ?? []);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const categories = categoriesText.split(",").map((c) => c.trim()).filter(Boolean);
    const cleanGallery = gallery.map((u) => u.trim()).filter(Boolean).slice(0, 6);
    const parsed = schema.safeParse({
      name, slug, description, start_date, end_date, location, organizer, region_id, scope, categories,
      cover_url, website_url, instagram_url, facebook_url, registration_url, published, gallery: cleanGallery,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");
    setSaving(true);
    const payload = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date || null,
      location: parsed.data.location || null,
      organizer: parsed.data.organizer || null,
      region_id: parsed.data.region_id || null,
      scope: parsed.data.scope,
      categories: parsed.data.categories,
      cover_url: parsed.data.cover_url || null,
      website_url: parsed.data.website_url || null,
      instagram_url: parsed.data.instagram_url || null,
      facebook_url: parsed.data.facebook_url || null,
      registration_url: parsed.data.registration_url || null,
      published: parsed.data.published,
      gallery: parsed.data.gallery,
    };
    const { error } = initial
      ? await supabase.from("events").update(payload).eq("id", initial.id)
      : await supabase.from("events").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Evento actualizado" : "Evento creado");
    onSaved();
  };

  return (
    <div className="mb-6 border border-gold bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg tracking-widest text-gold">{initial ? "Editar evento" : "Nuevo evento"}</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nombre *"><input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => !slug && setSlug(slugify(name))} className="input" /></Field>
        <Field label="Slug *"><input value={slug} onChange={(e) => setSlug(e.target.value)} className="input" /></Field>
        <Field label="Fecha inicio *"><input type="date" value={start_date} onChange={(e) => setStartDate(e.target.value)} className="input" /></Field>
        <Field label="Fecha fin"><input type="date" value={end_date} onChange={(e) => setEndDate(e.target.value)} className="input" /></Field>
        <Field label="Ubicación"><input value={location} onChange={(e) => setLocation(e.target.value)} className="input" /></Field>
        <Field label="Organizador"><input value={organizer} onChange={(e) => setOrganizer(e.target.value)} placeholder="Club / Federación / Entidad" className="input" /></Field>
        <Field label="Ámbito"><input value={scope} onChange={(e) => setScope(e.target.value)} placeholder="Nacional / Internacional / Autonómico" className="input" /></Field>
        <Field label="Comunidad / Región">
          <select value={region_id} onChange={(e) => setRegionId(e.target.value)} className="input">
            <option value="">—</option>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>
        <Field label="Categorías (separadas por coma)">
          <input value={categoriesText} onChange={(e) => setCategoriesText(e.target.value)} placeholder="Alevín, Infantil, Cadete, Junior, Senior" className="input" />
        </Field>
        <Field label="Descripción" full>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[80px]" />
        </Field>
        <Field label="Portada" full>
          <ImageUploadField
            value={cover_url}
            onChange={setCover}
            folder="events"
            nameHint={slug || slugify(name)}
          />
        </Field>
        <Field label={`Galería (hasta 6 fotos · ${gallery.length}/6)`} full>
          <GalleryEditor value={gallery} onChange={setGallery} slug={slug || slugify(name)} />
        </Field>
        <Field label="Web oficial"><input value={website_url} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className="input" /></Field>
        <Field label="Inscripción (URL)"><input value={registration_url} onChange={(e) => setRegistration(e.target.value)} placeholder="https://…" className="input" /></Field>
        <Field label="Instagram"><input value={instagram_url} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/…" className="input" /></Field>
        <Field label="Facebook"><input value={facebook_url} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/…" className="input" /></Field>
        <label className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          <span className="font-condensed text-xs uppercase tracking-widest">Publicado</span>
        </label>
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={onSave} disabled={saving} className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50">{saving ? "Guardando…" : initial ? "Guardar" : "Crear evento"}</button>
        <button onClick={onClose} className="font-condensed border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Cancelar</button>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
