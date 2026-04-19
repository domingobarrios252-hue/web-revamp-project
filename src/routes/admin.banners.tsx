import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Link2, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { z } from "zod";

type Banner = {
  id: string;
  name: string;
  image_url: string;
  link_url: string | null;
  alt_text: string | null;
  placement: string;
  active: boolean;
  sort_order: number;
};

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
  placement: z.string().trim().min(2).max(40),
  active: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
});

export const Route = createFileRoute("/admin/banners")({
  component: AdminBannersList,
});

function AdminBannersList() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Banner[]>([]);
  const [editing, setEditing] = useState<Banner | "new" | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ad_banners")
      .select("*")
      .order("placement", { ascending: true })
      .order("sort_order", { ascending: true });
    setItems((data as Banner[]) ?? []);
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

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-widest md:text-3xl">Banners de publicidad</h1>
          <p className="font-condensed mt-1 text-xs uppercase tracking-wider text-muted-foreground">
            Banner activo en <span className="text-gold">home_top</span> aparece entre el ticker y las últimas noticias
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
        <p className="text-muted-foreground">No hay banners aún. Crea uno para mostrarlo en la home.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="font-condensed border-b border-border bg-background text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">Vista previa</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Ubicación</th>
                <th className="px-3 py-2">Enlace</th>
                <th className="px-3 py-2 text-right">Orden</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
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
                  <td className="px-3 py-2 text-muted-foreground">{b.placement}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {b.link_url ? (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Link2 className="h-3 w-3" /> {b.link_url}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{b.sort_order}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <BannerEditor
          item={editing === "new" ? null : editing}
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

function BannerEditor({
  item,
  onClose,
  onSaved,
}: {
  item: Banner | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [linkUrl, setLinkUrl] = useState(item?.link_url ?? "");
  const [altText, setAltText] = useState(item?.alt_text ?? "");
  const [placement, setPlacement] = useState(item?.placement ?? "home_top");
  const [active, setActive] = useState(item?.active ?? true);
  const [sortOrder, setSortOrder] = useState<number>(item?.sort_order ?? 0);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = bannerSchema.safeParse({
      name,
      image_url: imageUrl,
      link_url: linkUrl || undefined,
      alt_text: altText || undefined,
      placement,
      active,
      sort_order: sortOrder,
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
        placement: parsed.data.placement,
        active: parsed.data.active,
        sort_order: parsed.data.sort_order,
      };
      const { error } = item
        ? await supabase.from("ad_banners").update(payload).eq("id", item.id)
        : await supabase.from("ad_banners").insert(payload);
      if (error) toast.error(error.message);
      else {
        toast.success(item ? "Banner actualizado" : "Banner creado");
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur">
      <div className="w-full max-w-2xl border border-border bg-surface p-5 md:p-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-widest">
            {item ? "Editar banner" : "Nuevo banner"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Nombre interno" value={name} onChange={setName} required />
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
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              label="Ubicación"
              value={placement}
              onChange={setPlacement}
              options={[{ value: "home_top", label: "Home — entre ticker y noticias" }]}
            />
            <NumberField label="Orden" value={sortOrder} onChange={setSortOrder} />
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
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
