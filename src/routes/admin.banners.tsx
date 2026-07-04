import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Link2, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { z } from "zod";
import { AD_PLACEMENTS } from "@/lib/useAdBanners";

type Banner = {
  id: string;
  name: string;
  image_url: string;
  link_url: string | null;
  alt_text: string | null;
  sponsor: string | null;
  placement: string | null;
  active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
};

type PlacementRow = { banner_id: string; placement: string; sort_order: number };

const bannerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  image_url: z.string().trim().url("Debe ser una URL válida"),
  link_url: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\//.test(v) || /^https?:\/\//i.test(v), {
      message: "Debe empezar por / (interno) o https://",
    })
    .optional(),
  alt_text: z.string().trim().max(200).optional(),
  sponsor: z.string().trim().max(120).optional(),
  active: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
  starts_at: z.string().trim().optional(),
  ends_at: z.string().trim().optional(),
  placements: z.array(z.string().min(1)).min(1, "Selecciona al menos una ubicación"),
});

export const Route = createFileRoute("/admin/banners")({
  component: AdminBannersList,
});

function AdminBannersList() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Banner[]>([]);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [editing, setEditing] = useState<Banner | "new" | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const [{ data: banners }, { data: pls }] = await Promise.all([
      supabase
        .from("ad_banners")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("ad_banner_placements" as any)
        .select("banner_id, placement, sort_order"),
    ]);
    setItems((banners as Banner[]) ?? []);
    setPlacements((pls as unknown as PlacementRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const onDelete = async (id: string, name: string) => {
    if (!confirm(`¿Borrar banner "${name}"?`)) return;
    const { error } = await supabase.from("ad_banners").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Banner borrado");
      reload();
    }
  };

  const toggleActive = async (b: Banner) => {
    const { error } = await supabase
      .from("ad_banners")
      .update({ active: !b.active })
      .eq("id", b.id);
    if (error) toast.error(error.message);
    else reload();
  };

  const placementsFor = (bannerId: string) =>
    placements.filter((p) => p.banner_id === bannerId).map((p) => p.placement);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-widest md:text-3xl">Banners de publicidad</h1>
          <p className="font-condensed mt-1 text-xs uppercase tracking-wider text-muted-foreground">
            Sube un banner una vez y asígnalo a varias ubicaciones. Se actualiza en toda la web al editarlo.
          </p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="font-condensed inline-flex items-center gap-1.5 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-3.5 w-3.5" /> Nuevo banner
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No hay banners aún. Crea uno para mostrarlo en la web.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="font-condensed border-b border-border bg-background text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">Vista previa</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Patrocinador</th>
                <th className="px-3 py-2">Ubicaciones</th>
                <th className="px-3 py-2">Enlace</th>
                <th className="px-3 py-2">Vigencia</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => {
                const bPls = placementsFor(b.id);
                return (
                  <tr key={b.id} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2">
                      <div className="h-12 w-32 overflow-hidden border border-border bg-background">
                        <img src={b.image_url} alt={b.alt_text ?? b.name} className="h-full w-full object-cover" />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-foreground">{b.name}</div>
                      {b.alt_text && <div className="text-xs text-muted-foreground">{b.alt_text}</div>}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{b.sponsor ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {bPls.length === 0 ? (
                        <span className="text-destructive text-xs">Sin asignar</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {bPls.map((p) => (
                            <span key={p} className="border border-border bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-gold">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {b.link_url ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Link2 className="h-3 w-3" /> {b.link_url}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-muted-foreground">
                      {b.starts_at || b.ends_at ? (
                        <>
                          {b.starts_at ? new Date(b.starts_at).toLocaleDateString() : "—"}
                          {" → "}
                          {b.ends_at ? new Date(b.ends_at).toLocaleDateString() : "—"}
                        </>
                      ) : (
                        "Siempre"
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <IconBtn title={b.active ? "Desactivar" : "Activar"} onClick={() => toggleActive(b)}>
                          {b.active ? <Eye className="h-4 w-4 text-gold" /> : <EyeOff className="h-4 w-4" />}
                        </IconBtn>
                        <IconBtn title="Editar" onClick={() => setEditing(b)}>
                          <Pencil className="h-4 w-4" />
                        </IconBtn>
                        {isAdmin && (
                          <IconBtn title="Borrar" onClick={() => onDelete(b.id, b.name)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </IconBtn>
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

      {editing && (
        <BannerEditor
          item={editing === "new" ? null : editing}
          initialPlacements={editing === "new" ? [] : placementsFor(editing.id)}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="border border-border bg-background p-1.5 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
    >
      {children}
    </button>
  );
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function BannerEditor({
  item,
  initialPlacements,
  onClose,
  onSaved,
}: {
  item: Banner | null;
  initialPlacements: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [linkUrl, setLinkUrl] = useState(item?.link_url ?? "");
  const [altText, setAltText] = useState(item?.alt_text ?? "");
  const [sponsor, setSponsor] = useState(item?.sponsor ?? "");
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>(
    initialPlacements.length ? initialPlacements : item?.placement ? [item.placement] : [],
  );
  const [active, setActive] = useState(item?.active ?? true);
  const [sortOrder, setSortOrder] = useState<number>(item?.sort_order ?? 0);
  const [startsAt, setStartsAt] = useState<string>(toLocalInput(item?.starts_at ?? null));
  const [endsAt, setEndsAt] = useState<string>(toLocalInput(item?.ends_at ?? null));
  const [saving, setSaving] = useState(false);

  const togglePlacement = (p: string) => {
    setSelectedPlacements((cur) =>
      cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p],
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = bannerSchema.safeParse({
      name,
      image_url: imageUrl,
      link_url: linkUrl || undefined,
      alt_text: altText || undefined,
      sponsor: sponsor || undefined,
      active,
      sort_order: sortOrder,
      starts_at: startsAt || undefined,
      ends_at: endsAt || undefined,
      placements: selectedPlacements,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos no válidos");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: parsed.data.name,
        image_url: parsed.data.image_url,
        link_url: parsed.data.link_url || null,
        alt_text: parsed.data.alt_text ?? null,
        sponsor: parsed.data.sponsor ?? null,
        placement: parsed.data.placements[0], // legacy column mirrors first
        active: parsed.data.active,
        sort_order: parsed.data.sort_order,
        starts_at: parsed.data.starts_at ? new Date(parsed.data.starts_at).toISOString() : null,
        ends_at: parsed.data.ends_at ? new Date(parsed.data.ends_at).toISOString() : null,
      };
      let bannerId = item?.id;
      if (item) {
        const { error } = await supabase.from("ad_banners").update(payload).eq("id", item.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("ad_banners").insert(payload).select("id").single();
        if (error) throw error;
        bannerId = (data as { id: string }).id;
      }

      if (bannerId) {
        // Reconcile placements
        await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from("ad_banner_placements" as any)
          .delete()
          .eq("banner_id", bannerId);
        const rows = parsed.data.placements.map((p) => ({
          banner_id: bannerId as string,
          placement: p,
          sort_order: parsed.data.sort_order,
        }));
        if (rows.length) {
          const { error: insErr } = await supabase
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from("ad_banner_placements" as any)
            .insert(rows);
          if (insErr) throw insErr;
        }
      }

      toast.success(item ? "Banner actualizado" : "Banner creado");
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Group placements by category for the UI
  const grouped = AD_PLACEMENTS.reduce<Record<string, typeof AD_PLACEMENTS>>((acc, p) => {
    (acc[p.group] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur">
      <div className="w-full max-w-3xl border border-border bg-surface p-5 md:p-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-widest">
            {item ? "Editar banner" : "Nuevo banner"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nombre interno" value={name} onChange={setName} required />
            <Field label="Patrocinador (opcional)" value={sponsor} onChange={setSponsor} placeholder="Marca / cliente" />
          </div>
          <ImageUploadField
            label="Imagen del banner"
            value={imageUrl}
            onChange={setImageUrl}
          />
          <Field
            label="Enlace (opcional) — / interno o https://externo"
            value={linkUrl}
            onChange={setLinkUrl}
            placeholder="/eventos  ó  https://patrocinador.com"
          />
          <Field label="Texto alternativo (accesibilidad)" value={altText} onChange={setAltText} />

          <div>
            <div className="font-condensed mb-2 flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
              <span>Ubicaciones — puedes marcar varias</span>
              <span className="text-gold">{selectedPlacements.length} seleccionadas</span>
            </div>
            <div className="max-h-72 overflow-y-auto border border-border bg-background p-3">
              {Object.entries(grouped).map(([group, list]) => (
                <div key={group} className="mb-3 last:mb-0">
                  <div className="font-condensed mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gold/80">
                    {group}
                  </div>
                  <div className="grid gap-1.5 md:grid-cols-2">
                    {list.map((p) => (
                      <label
                        key={p.value}
                        className="flex cursor-pointer items-start gap-2 rounded border border-transparent px-2 py-1 text-xs text-foreground hover:border-border hover:bg-surface"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPlacements.includes(p.value)}
                          onChange={() => togglePlacement(p.value)}
                          className="mt-0.5 h-3.5 w-3.5 accent-[oklch(0.78_0.16_70)]"
                        />
                        <span>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <NumberField label="Orden" value={sortOrder} onChange={setSortOrder} />
            <Field label="Inicio (opcional)" type="datetime-local" value={startsAt} onChange={setStartsAt} />
            <Field label="Fin (opcional)" type="datetime-local" value={endsAt} onChange={setEndsAt} />
          </div>

          <div className="flex flex-wrap gap-4">
            <Checkbox label="Activo (visible en la web)" checked={active} onChange={setActive} />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={onClose}
              className="font-condensed border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
            >
              {saving ? "Guardando…" : item ? "Guardar cambios" : "Crear banner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={0}
        max={9999}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="font-condensed flex cursor-pointer items-center gap-2 text-xs uppercase tracking-widest text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[oklch(0.78_0.16_70)]"
      />
      {label}
    </label>
  );
}

function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5 MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("media")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Imagen subida");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <button
          type="button"
          onClick={() => setUrlMode((v) => !v)}
          className="font-condensed text-[10px] uppercase tracking-widest text-gold hover:underline"
        >
          {urlMode ? "Subir archivo" : "Pegar URL"}
        </button>
      </div>

      {urlMode ? (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
        />
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) onFile(f);
          }}
          className="flex items-center gap-3 border border-dashed border-border bg-background p-3"
        >
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="font-condensed inline-flex items-center gap-2 border border-border bg-surface px-3 py-2 text-xs font-bold uppercase tracking-widest text-gold hover:border-gold disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? "Subiendo…" : value ? "Reemplazar" : "Elegir imagen"}
          </button>
          <span className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
            o arrastra aquí · máx. 5 MB
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {value && (
        <div className="mt-2 border border-border bg-background p-2">
          <img src={value} alt="preview" className="max-h-48 w-full object-contain" />
          <div className="font-condensed mt-1 truncate text-[10px] uppercase tracking-wider text-muted-foreground">
            {value}
          </div>
        </div>
      )}
    </div>
  );
}
