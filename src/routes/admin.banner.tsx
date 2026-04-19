import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type BannerValue = {
  enabled: boolean;
  image_url: string | null;
  link_url: string | null;
  alt: string | null;
};

const DEFAULT: BannerValue = {
  enabled: false,
  image_url: null,
  link_url: null,
  alt: null,
};

export const Route = createFileRoute("/admin/banner")({
  head: () => ({
    meta: [{ title: "Admin · Banner publicitario" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminBanner,
});

function AdminBanner() {
  const [value, setValue] = useState<BannerValue>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "home_ad_banner")
      .maybeSingle();
    const v = (data?.value ?? null) as Partial<BannerValue> | null;
    setValue({
      enabled: v?.enabled ?? false,
      image_url: v?.image_url ?? null,
      link_url: v?.link_url ?? null,
      alt: v?.alt ?? null,
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Máximo 5 MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `ad-banner/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("media")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    setUploading(false);
    if (upErr) return toast.error(upErr.message);
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setValue((v) => ({ ...v, image_url: data.publicUrl }));
    toast.success("Imagen subida");
  };

  const save = async () => {
    const link = value.link_url?.trim() || null;
    if (link && !/^(https?:\/\/|\/)/i.test(link)) {
      toast.error("El enlace debe empezar por '/' (interno) o 'http(s)://'");
      return;
    }
    if (value.enabled && !value.image_url) {
      toast.error("Sube una imagen antes de activar el banner");
      return;
    }
    setSaving(true);
    const payload: BannerValue = {
      enabled: value.enabled,
      image_url: value.image_url,
      link_url: link,
      alt: value.alt?.trim() || null,
    };
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        { key: "home_ad_banner", value: payload as unknown as never },
        { onConflict: "key" },
      );
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Banner guardado");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl tracking-widest">BANNER PUBLICITARIO</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aparece en la home, justo entre el ticker y las últimas noticias.
        </p>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between border border-border bg-surface p-4">
            <div>
              <div className="font-condensed text-xs font-bold uppercase tracking-widest text-gold">
                Estado
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {value.enabled ? "Visible en la home" : "Oculto en la home"}
              </div>
            </div>
            <Switch
              checked={value.enabled}
              onCheckedChange={(v) => setValue((s) => ({ ...s, enabled: v }))}
            />
          </div>

          <div className="border border-border bg-surface p-4">
            <label className="font-condensed mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
              Imagen del banner
            </label>
            {value.image_url ? (
              <div className="mb-3 overflow-hidden border border-border bg-background">
                <img src={value.image_url} alt="Vista previa" className="h-auto w-full object-cover" />
              </div>
            ) : (
              <div className="mb-3 flex h-32 items-center justify-center border border-dashed border-border bg-background text-sm text-muted-foreground">
                Sin imagen
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <label
                className={`font-condensed inline-flex cursor-pointer items-center gap-2 border border-border bg-background px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground hover:border-gold hover:text-gold ${
                  uploading ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Subiendo…" : value.image_url ? "Cambiar imagen" : "Subir imagen"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUpload(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {value.image_url && (
                <button
                  onClick={() => setValue((v) => ({ ...v, image_url: null }))}
                  className="font-condensed border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-destructive"
                >
                  Quitar
                </button>
              )}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Recomendado: 1200×200 px (ratio horizontal). Máx. 5 MB.
            </p>
          </div>

          <div className="border border-border bg-surface p-4">
            <label className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
              Enlace al hacer clic (opcional)
            </label>
            <input
              type="text"
              value={value.link_url ?? ""}
              onChange={(e) => setValue((v) => ({ ...v, link_url: e.target.value }))}
              className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="https://patrocinador.com  ·  /eventos  ·  /noticias/articulo/..."
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Usa una URL completa con http(s):// o una ruta interna que empiece por "/".
            </p>
          </div>

          <div className="border border-border bg-surface p-4">
            <label className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
              Texto alternativo (accesibilidad)
            </label>
            <input
              type="text"
              value={value.alt ?? ""}
              onChange={(e) => setValue((v) => ({ ...v, alt: e.target.value }))}
              className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Ej: Ruedas Bont — descubre la nueva colección"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="font-condensed inline-flex items-center gap-2 bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Guardando…" : "Guardar banner"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
