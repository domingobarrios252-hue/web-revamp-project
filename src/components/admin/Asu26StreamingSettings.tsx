import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  ASU26_DEFAULTS,
  ASU26_PATH,
  ASU26_SETTINGS_KEY,
  ASU26_TZ,
  STREAM_TABS,
  httpsOnly,
  loadAsu26Config,
  type Asu26StreamingConfig,
} from "@/lib/tv/asu26Streaming";
import { localToUtcIso, utcToLocalInput } from "@/lib/specials/liveEvent";

/** Ajustes del broadcast hub ASU26 (dentro de Admin → Rollerzone TV). */
export function Asu26StreamingSettings() {
  const [c, setC] = useState<Asu26StreamingConfig | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    loadAsu26Config().then(setC);
  }, []);
  if (!c) return null;
  const set = <K extends keyof Asu26StreamingConfig>(k: K, v: Asu26StreamingConfig[K]) => setC({ ...c, [k]: v });

  const save = async () => {
    for (const t of STREAM_TABS) {
      const v = c[t.url] as string;
      if (v && !httpsOnly(v)) return toast.error(`La señal ${t.label} debe ser un enlace https`);
    }
    if (c.veloproEmbedUrl && !httpsOnly(c.veloproEmbedUrl)) return toast.error("El enlace de VeloPro debe ser https");
    setSaving(true);
    const value = {
      ...c,
      ...Object.fromEntries(STREAM_TABS.map((t) => [t.url, httpsOnly(c[t.url] as string)])),
      veloproEmbedUrl: httpsOnly(c.veloproEmbedUrl),
    };
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: ASU26_SETTINGS_KEY, value: value as never, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Ajustes ASU26 guardados");
  };

  const input = "input w-full";
  const lbl = "font-condensed text-[11px] uppercase tracking-widest text-muted-foreground";

  return (
    <div className="space-y-5 border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-sm tracking-widest text-gold">WORLD SKATE GAMES ASU26 · STREAMING</h2>
        <a href={ASU26_PATH} target="_blank" rel="noreferrer" className="text-xs text-gold underline">Ver página</a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className={lbl}>Estado del directo (manual)
          <select className={input} value={c.streamStatus} onChange={(e) => set("streamStatus", e.target.value as Asu26StreamingConfig["streamStatus"])}>
            <option value="upcoming">Próximamente</option>
            <option value="live">En directo</option>
            <option value="finished">Finalizado</option>
          </select>
        </label>
        <label className={lbl}>Señal por defecto
          <select className={input} value={c.defaultStream} onChange={(e) => set("defaultStream", e.target.value as Asu26StreamingConfig["defaultStream"])}>
            {STREAM_TABS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </label>
        <label className={lbl}>Hora prevista (hora de Asunción)
          <input type="datetime-local" className={input} value={c.expectedStart ? utcToLocalInput(c.expectedStart, ASU26_TZ) : ""} onChange={(e) => set("expectedStart", e.target.value ? localToUtcIso(e.target.value, ASU26_TZ) : null)} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={lbl}>Título<input className={input} value={c.title} onChange={(e) => set("title", e.target.value)} /></label>
        <label className={lbl}>Subtítulo<input className={input} value={c.subtitle} onChange={(e) => set("subtitle", e.target.value)} /></label>
        <label className={`${lbl} md:col-span-2`}>Mensaje antes del streaming<input className={input} value={c.preStreamMessage} onChange={(e) => set("preStreamMessage", e.target.value)} /></label>
      </div>

      <div className="space-y-3">
        <p className={lbl}>Señales (enlace https o código iframe)</p>
        {STREAM_TABS.map((t) => (
          <div key={t.key} className="grid items-center gap-2 sm:grid-cols-[110px_1fr_auto]">
            <span className="font-condensed text-xs font-bold uppercase tracking-widest">{t.label}</span>
            <input className={input} value={c[t.url] as string} onChange={(e) => set(t.url, e.target.value as never)} />
            <label className="inline-flex items-center gap-2 text-xs">
              <input type="checkbox" checked={c[t.show] as boolean} onChange={(e) => set(t.show, e.target.checked as never)} /> Visible
            </label>
          </div>
        ))}
        <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setC({ ...c, ...Object.fromEntries(STREAM_TABS.map((t) => [t.url, ASU26_DEFAULTS[t.url]])) })}>
          Restaurar enlaces facilitados por World Skate
        </button>
      </div>

      <div className="space-y-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={c.veloproEnabled} onChange={(e) => set("veloproEnabled", e.target.checked)} /> Activar resultados VeloPro (iframe/widget)
        </label>
        <label className={lbl}>Enlace del widget de VeloPro (https)<input className={input} value={c.veloproEmbedUrl} onChange={(e) => set("veloproEmbedUrl", e.target.value)} /></label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {([
          ["logoAsu26Url", "Logo World Skate Games ASU26"],
          ["logoWorldSkateUrl", "Logo World Skate"],
          ["logoVeloproUrl", "Logo VeloPro"],
          ["logoPoweredByVeloproUrl", "Logo “Powered by VeloPro”"],
        ] as const).map(([k, l]) => (
          <div key={k}>
            <p className={lbl}>{l}</p>
            <ImageUploadField value={c[k]} onChange={(v) => set(k, v)} folder="tv/asu26" nameHint={k} previewClassName="mt-2 h-12 w-auto object-contain" />
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {(Object.keys(c.links) as (keyof Asu26StreamingConfig["links"])[]).map((k) => (
          <label key={k} className={lbl}>Enlace {k} (pieza o URL)
            <input className={input} value={c.links[k]} onChange={(e) => setC({ ...c, links: { ...c.links, [k]: e.target.value } })} />
          </label>
        ))}
      </div>

      <button onClick={save} disabled={saving} className="font-condensed bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50">
        {saving ? "Guardando…" : "Guardar ajustes ASU26"}
      </button>
    </div>
  );
}
