import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

type Federation = {
  id: string;
  name: string;
  slug: string;
  short_name: string | null;
  type: "nacional" | "autonomica";
  country_code: string;
  region_code: string | null;
  region_name: string | null;
  logo_url: string | null;
  cover_url: string | null;
  description: string | null;
  president: string | null;
  address: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  fax: string | null;
  website: string | null;
  social: { instagram?: string; facebook?: string; youtube?: string; twitter?: string } | null;
  parent_id: string | null;
  featured: boolean;
  published: boolean;
  founded_year: number | null;
};

type FedDoc = {
  id: string;
  federation_id: string;
  title: string;
  doc_type: string;
  file_url: string;
  description: string | null;
  published_at: string;
};

const schema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9-]+$/),
  short_name: z.string().trim().max(40).optional(),
  type: z.enum(["nacional", "autonomica"]),
  country_code: z.string().trim().min(2).max(3),
  region_code: z.string().trim().max(10).optional(),
  region_name: z.string().trim().max(80).optional(),
  description: z.string().trim().max(4000).optional(),
  president: z.string().trim().max(120).optional(),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  fax: z.string().trim().max(40).optional(),
  website: z.string().trim().url().optional().or(z.literal("")),
  founded_year: z.number().int().min(1800).max(2100).optional(),
});

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

export const Route = createFileRoute("/admin/federaciones")({
  head: () => ({ meta: [{ title: "Admin · Federaciones" }, { name: "robots", content: "noindex" }] }),
  component: AdminFederations,
});

function AdminFederations() {
  const [items, setItems] = useState<Federation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Federation | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [docsFor, setDocsFor] = useState<Federation | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("federations").select("*")
      .order("type").order("name");
    setItems((data as unknown as Federation[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar federación? Se eliminan también sus documentos.")) return;
    const { error } = await supabase.from("federations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Federación eliminada");
    load();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest">Federaciones</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Nueva
        </button>
      </div>

      {showForm && (
        <FederationForm
          initial={editing}
          parents={items.filter((i) => i.type === "nacional" && ["RFEP", "FedepatinCol"].includes(i.short_name ?? ""))}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}

      {docsFor && (
        <DocsManager federation={docsFor} onClose={() => setDocsFor(null)} />
      )}

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Sin federaciones todavía.</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full">
            <thead className="border-b border-border bg-surface">
              <tr className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 text-left">Federación</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-left">Región</th>
                <th className="px-3 py-2 text-left">País</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {f.logo_url && <img src={f.logo_url} alt="" className="h-8 w-8 object-contain" />}
                      <div>
                        <div className="font-display text-sm uppercase">{f.short_name ?? f.name}</div>
                        <div className="font-condensed text-[10px] text-muted-foreground">/{f.slug}{!f.published && " · BORRADOR"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm">{f.type === "nacional" ? "Nacional" : "Autonómica"}</td>
                  <td className="px-3 py-2 text-sm">{f.region_name ?? "—"}</td>
                  <td className="px-3 py-2 text-sm uppercase">{f.country_code}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button onClick={() => setDocsFor(f)} className="mr-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-gold" title="Documentos">
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setEditing(f); setShowForm(true); }} className="mr-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-gold">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onDelete(f.id)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
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

function FederationForm({
  initial, parents, onClose, onSaved,
}: {
  initial: Federation | null;
  parents: Federation[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [short_name, setShortName] = useState(initial?.short_name ?? "");
  const [type, setType] = useState<"nacional" | "autonomica">(initial?.type ?? "autonomica");
  const [country_code, setCountryCode] = useState(initial?.country_code ?? "es");
  const [region_code, setRegionCode] = useState(initial?.region_code ?? "");
  const [region_name, setRegionName] = useState(initial?.region_name ?? "");
  const [logo_url, setLogoUrl] = useState(initial?.logo_url ?? "");
  const [cover_url, setCoverUrl] = useState(initial?.cover_url ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [president, setPresident] = useState(initial?.president ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [fax, setFax] = useState(initial?.fax ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [founded_year, setFoundedYear] = useState<string>(initial?.founded_year?.toString() ?? "");
  const [parent_id, setParentId] = useState(initial?.parent_id ?? "");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [published, setPublished] = useState(initial?.published ?? true);
  const [instagram, setInstagram] = useState(initial?.social?.instagram ?? "");
  const [facebook, setFacebook] = useState(initial?.social?.facebook ?? "");
  const [youtube, setYoutube] = useState(initial?.social?.youtube ?? "");
  const [hubEs, setHubEs] = useState(false);
  const [hubCo, setHubCo] = useState(false);
  const [hubsLoaded, setHubsLoaded] = useState(!initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initial) {
      setHubEs(country_code === "es");
      setHubCo(country_code === "co");
      return;
    }
    let cancelled = false;
    supabase
      .from("federation_hubs")
      .select("country_code")
      .eq("federation_id", initial.id)
      .then(({ data }) => {
        if (cancelled) return;
        const rows = (data ?? []) as { country_code: string }[];
        if (rows.length === 0) {
          setHubEs(initial.country_code === "es");
          setHubCo(initial.country_code === "co");
        } else {
          setHubEs(rows.some((r) => r.country_code === "es"));
          setHubCo(rows.some((r) => r.country_code === "co"));
        }
        setHubsLoaded(true);
      });
    return () => { cancelled = true; };
  }, [initial]);

  const onSave = async () => {
    const parsed = schema.safeParse({
      name, slug, short_name: short_name || undefined, type, country_code,
      region_code: region_code || undefined, region_name: region_name || undefined,
      description: description || undefined, president: president || undefined,
      address: address || undefined, city: city || undefined,
      email: email || undefined, phone: phone || undefined, fax: fax || undefined, website: website || undefined,
      founded_year: founded_year ? Number(founded_year) : undefined,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");

    setSaving(true);
    const payload = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      short_name: parsed.data.short_name ?? null,
      type: parsed.data.type,
      country_code: parsed.data.country_code,
      region_code: parsed.data.region_code ?? null,
      region_name: parsed.data.region_name ?? null,
      logo_url: logo_url || null,
      cover_url: cover_url || null,
      description: parsed.data.description ?? null,
      president: parsed.data.president ?? null,
      address: parsed.data.address ?? null,
      city: parsed.data.city ?? null,
      email: parsed.data.email || null,
      phone: parsed.data.phone ?? null,
      fax: parsed.data.fax ?? null,
      website: parsed.data.website || null,
      founded_year: parsed.data.founded_year ?? null,
      parent_id: parent_id || null,
      featured,
      published,
      social: { instagram: instagram || undefined, facebook: facebook || undefined, youtube: youtube || undefined },
    };
    let fedId = initial?.id;
    if (initial) {
      const { error } = await supabase.from("federations").update(payload).eq("id", initial.id);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      const { data, error } = await supabase.from("federations").insert(payload).select("id").single();
      if (error || !data) { setSaving(false); return toast.error(error?.message ?? "Error"); }
      fedId = (data as { id: string }).id;
    }

    if (fedId) {
      const wanted: string[] = [];
      if (hubEs) wanted.push("es");
      if (hubCo) wanted.push("co");
      await supabase.from("federation_hubs").delete().eq("federation_id", fedId);
      if (wanted.length > 0) {
        await supabase
          .from("federation_hubs")
          .insert(wanted.map((cc) => ({ federation_id: fedId!, country_code: cc })));
      }
    }

    setSaving(false);
    toast.success(initial ? "Federación actualizada" : "Federación creada");
    onSaved();
  };

  return (
    <div className="mb-6 border border-gold bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg tracking-widest text-gold">
          {initial ? "Editar federación" : "Nueva federación"}
        </h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nombre *"><input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => !slug && name && setSlug(slugify(name))} className="input" /></Field>
        <Field label="Slug *"><input value={slug} onChange={(e) => setSlug(e.target.value)} className="input" /></Field>
        <Field label="Nombre corto (RFEP, FCP…)"><input value={short_name} onChange={(e) => setShortName(e.target.value)} className="input" /></Field>
        <Field label="Tipo *">
          <select value={type} onChange={(e) => setType(e.target.value as "nacional" | "autonomica")} className="input">
            <option value="autonomica">Autonómica / Regional</option>
            <option value="nacional">Nacional</option>
          </select>
        </Field>
        <Field label="País (código) *"><input value={country_code} onChange={(e) => setCountryCode(e.target.value.toLowerCase())} placeholder="es" className="input" /></Field>
        <Field label="Federación nacional (padre)">
          <select value={parent_id} onChange={(e) => setParentId(e.target.value)} className="input">
            <option value="">— Sin padre —</option>
            {parents.map((p) => <option key={p.id} value={p.id}>{p.short_name ?? p.name}</option>)}
          </select>
        </Field>
        <Field label="Código región (CAT, MAD…)"><input value={region_code} onChange={(e) => setRegionCode(e.target.value)} className="input" /></Field>
        <Field label="Nombre región"><input value={region_name} onChange={(e) => setRegionName(e.target.value)} className="input" /></Field>
        <Field label="Logo">
          <ImageUploadField value={logo_url} onChange={setLogoUrl} bucket="federations" folder="logos" nameHint={slug || slugify(name)} previewClassName="mt-2 h-20 w-20 border border-border object-contain bg-background p-1" />
        </Field>
        <Field label="Portada (cover)">
          <ImageUploadField value={cover_url} onChange={setCoverUrl} bucket="federations" folder="covers" nameHint={slug || slugify(name)} previewClassName="mt-2 h-24 w-40 border border-border object-cover" />
        </Field>
        <Field label="Presidente"><input value={president} onChange={(e) => setPresident(e.target.value)} className="input" /></Field>
        <Field label="Año fundación"><input type="number" value={founded_year} onChange={(e) => setFoundedYear(e.target.value)} className="input" /></Field>
        <Field label="Dirección"><input value={address} onChange={(e) => setAddress(e.target.value)} className="input" /></Field>
        <Field label="Ciudad"><input value={city} onChange={(e) => setCity(e.target.value)} className="input" /></Field>
        <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" /></Field>
        <Field label="Teléfono"><input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" /></Field>
        <Field label="Web"><input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className="input" /></Field>
        <Field label="Instagram (URL)"><input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="input" /></Field>
        <Field label="Facebook (URL)"><input value={facebook} onChange={(e) => setFacebook(e.target.value)} className="input" /></Field>
        <Field label="YouTube (URL)"><input value={youtube} onChange={(e) => setYoutube(e.target.value)} className="input" /></Field>
        <div className="md:col-span-2">
          <Field label="Descripción"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="input" /></Field>
        </div>
        <Field label="Publicada">
          <label className="flex h-9 items-center gap-2 text-sm">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Visible en el hub
          </label>
        </Field>
        <Field label="Destacada">
          <label className="flex h-9 items-center gap-2 text-sm">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Aparece destacada
          </label>
        </Field>
        <div className="md:col-span-2">
          <Field label="Visible en hubs">
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={hubEs} onChange={(e) => setHubEs(e.target.checked)} disabled={!hubsLoaded} />
                Hub España
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={hubCo} onChange={(e) => setHubCo(e.target.checked)} disabled={!hubsLoaded} />
                Hub Colombia
              </label>
            </div>
            <p className="font-condensed mt-1 text-[10px] text-muted-foreground">
              Marca uno o ambos hubs donde debe aparecer esta federación.
            </p>
          </Field>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button onClick={onSave} disabled={saving} className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50">
          {saving ? "Guardando…" : initial ? "Guardar cambios" : "Crear federación"}
        </button>
        <button onClick={onClose} className="font-condensed border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Cancelar</button>
      </div>
    </div>
  );
}

function DocsManager({ federation, onClose }: { federation: Federation; onClose: () => void }) {
  const [docs, setDocs] = useState<FedDoc[]>([]);
  const [title, setTitle] = useState("");
  const [doc_type, setDocType] = useState("documento");
  const [file_url, setFileUrl] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("federation_documents").select("*").eq("federation_id", federation.id).order("published_at", { ascending: false });
    setDocs((data as unknown as FedDoc[]) ?? []);
  };
  useEffect(() => { load(); }, [federation.id]);

  const onAdd = async () => {
    if (!title.trim() || !file_url.trim()) return toast.error("Título y URL requeridos");
    setSaving(true);
    const { error } = await supabase.from("federation_documents").insert({
      federation_id: federation.id, title: title.trim(), doc_type, file_url: file_url.trim(),
      description: description.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Documento añadido");
    setTitle(""); setFileUrl(""); setDescription("");
    load();
  };
  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar documento?")) return;
    const { error } = await supabase.from("federation_documents").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="mb-6 border border-gold bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg tracking-widest text-gold">
          Documentos · {federation.short_name ?? federation.name}
        </h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid gap-3 md:grid-cols-[2fr_1fr_2fr_auto] mb-4">
        <Field label="Título"><input value={title} onChange={(e) => setTitle(e.target.value)} className="input" /></Field>
        <Field label="Tipo">
          <select value={doc_type} onChange={(e) => setDocType(e.target.value)} className="input">
            <option value="estatuto">Estatutos</option>
            <option value="reglamento">Reglamento</option>
            <option value="circular">Circular</option>
            <option value="calendario">Calendario</option>
            <option value="documento">Documento</option>
          </select>
        </Field>
        <Field label="URL del archivo (PDF)"><input value={file_url} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://…" className="input" /></Field>
        <div className="flex items-end">
          <button onClick={onAdd} disabled={saving} className="font-condensed bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50">
            <Plus className="h-3.5 w-3.5 inline" /> Añadir
          </button>
        </div>
      </div>
      <Field label="Descripción (opcional)"><input value={description} onChange={(e) => setDescription(e.target.value)} className="input" /></Field>

      <ul className="mt-4 divide-y divide-border border border-border">
        {docs.length === 0 ? (
          <li className="p-3 text-sm text-muted-foreground">Sin documentos.</li>
        ) : docs.map((d) => (
          <li key={d.id} className="flex items-center gap-3 p-3">
            <FileText className="h-4 w-4 text-gold shrink-0" />
            <div className="flex-1 min-w-0">
              <a href={d.file_url} target="_blank" rel="noreferrer" className="text-sm text-foreground hover:text-gold truncate block">{d.title}</a>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{d.doc_type} · {new Date(d.published_at).toLocaleDateString("es-ES")}</div>
            </div>
            <button onClick={() => onDelete(d.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="font-condensed mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
