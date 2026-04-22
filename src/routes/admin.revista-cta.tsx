import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CtaConfig = {
  label_top: string;
  subtitle: string;
  button_text: string;
  button_url: string; // vacío = usar /revista por defecto
  enabled: boolean;
};

const DEFAULTS: CtaConfig = {
  label_top: "Edición digital",
  subtitle: "RollerZone Colombia",
  button_text: "Ver edición digital",
  button_url: "",
  enabled: true,
};

export const Route = createFileRoute("/admin/revista-cta")({
  head: () => ({
    meta: [
      { title: "Admin · CTA Edición Digital" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminRevistaCta,
});

function AdminRevistaCta() {
  const [cfg, setCfg] = useState<CtaConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "magazine_cta")
        .maybeSingle();
      if (data?.value) {
        setCfg({ ...DEFAULTS, ...(data.value as Partial<CtaConfig>) });
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "magazine_cta", value: cfg as unknown as object }, { onConflict: "key" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("CTA actualizado");
  };

  if (loading) return <p className="text-muted-foreground">Cargando…</p>;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-widest">CTA Edición Digital</h1>
          <p className="font-condensed mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            Card de la portada (al lado del banner publicitario)
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>

      <div className="grid gap-4 border border-border bg-surface p-4 md:grid-cols-2">
        <label className="flex items-center gap-2 md:col-span-2">
          <input
            type="checkbox"
            checked={cfg.enabled}
            onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })}
          />
          <span className="font-condensed text-xs uppercase tracking-widest">
            Mostrar la card en la portada
          </span>
        </label>

        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Etiqueta superior
          </span>
          <input
            value={cfg.label_top}
            onChange={(e) => setCfg({ ...cfg, label_top: e.target.value })}
            placeholder="Ej. Edición digital"
            className="input"
          />
        </label>

        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Subtítulo (debajo del título)
          </span>
          <input
            value={cfg.subtitle}
            onChange={(e) => setCfg({ ...cfg, subtitle: e.target.value })}
            placeholder="Ej. RollerZone Colombia"
            className="input"
          />
        </label>

        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Texto del botón
          </span>
          <input
            value={cfg.button_text}
            onChange={(e) => setCfg({ ...cfg, button_text: e.target.value })}
            placeholder="Ej. Ver edición digital"
            className="input"
          />
        </label>

        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            URL del botón (opcional)
          </span>
          <input
            value={cfg.button_url}
            onChange={(e) => setCfg({ ...cfg, button_url: e.target.value })}
            placeholder="Vacío = página /revista"
            className="input"
          />
          <span className="font-condensed mt-1 block text-[10px] text-muted-foreground">
            Si lo dejas vacío, abrirá la página interna /revista. Puedes usar URL externa (https://…) o ruta interna (/algo).
          </span>
        </label>
      </div>

      <div className="mt-6 border border-border bg-background p-4">
        <div className="font-condensed mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          Vista previa
        </div>
        {cfg.enabled ? (
          <div className="max-w-md">
            <div className="font-condensed mb-1 text-[10px] uppercase tracking-widest text-gold/80">
              {cfg.label_top || "—"}
            </div>
            <div className="border border-gold/30 bg-gradient-to-br from-surface via-surface-2 to-background p-4">
              <div className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
                Nº 12
              </div>
              <h3 className="font-display mt-1 text-lg uppercase leading-tight tracking-wider">
                Título de la edición
              </h3>
              <p className="font-condensed mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                {cfg.subtitle || "—"}
              </p>
              <span className="font-condensed mt-3 inline-block bg-gold px-4 py-2 text-[11px] font-bold uppercase tracking-[2px] text-background">
                {cfg.button_text || "—"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">La card está oculta.</p>
        )}
      </div>
    </div>
  );
}
