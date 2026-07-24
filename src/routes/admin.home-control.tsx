import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Radio, Trophy, Layers, EyeOff, CheckCircle2, RefreshCw, Eye, ExternalLink, Sparkles, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  HOME_SECTIONS,
  type HomeSectionKey,
  setHomeSectionVisibility,
  useHomeSectionVisibility,
} from "@/lib/home/useHomeSectionVisibility";

export const Route = createFileRoute("/admin/home-control")({
  head: () => ({
    meta: [
      { title: "Home Control Center — RollerZone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HomeControlPage,
});

type Mode = "liga" | "live" | "both" | "none";

const OPTIONS: Array<{
  value: Mode;
  label: string;
  description: string;
  Icon: typeof Trophy;
}> = [
  { value: "liga", label: "Liga Nacional", description: "Solo clasificaciones nacionales en la home.", Icon: Trophy },
  { value: "live", label: "Evento en directo", description: "Solo cobertura live del evento destacado.", Icon: Radio },
  { value: "both", label: "Ambos", description: "Live Event Center arriba y Liga Nacional debajo.", Icon: Layers },
  { value: "none", label: "Ninguno", description: "Oculta toda la zona dinámica de la home.", Icon: EyeOff },
];

type SpecialLite = { slug: string; title: string; subtitle: string | null; featured_home: boolean; sort_order: number };
const SPECIALS_KEY = "home_specials_selected";

function HomeControlPage() {
  const [mode, setMode] = useState<Mode>("liga");
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [featuredEvent, setFeaturedEvent] = useState<{ id: string; name: string } | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const { visibility } = useHomeSectionVisibility();
  const [specials, setSpecials] = useState<SpecialLite[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const sb = supabase as any;
      const { data } = await sb.from("home_modules").select("value").eq("key", "dynamic_zone_mode").maybeSingle();
      if (data?.value) setMode(data.value as Mode);
      const { data: ev } = await sb
        .from("events")
        .select("id,name")
        .eq("is_featured", true)
        .eq("live_center_enabled", true)
        .limit(1)
        .maybeSingle();
      setFeaturedEvent(ev ?? null);

      const { data: sel } = await sb.from("home_modules").select("value").eq("key", SPECIALS_KEY).maybeSingle();
      const slugs: string[] = (sel?.value ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);
      setSelectedSlugs(slugs);

      const { data: sp } = await sb
        .from("special_editorials")
        .select("slug,title,subtitle,featured_home,sort_order")
        .eq("status", "active")
        .order("sort_order", { ascending: true });
      setSpecials((sp ?? []) as SpecialLite[]);

      setLoading(false);
    })();
  }, []);

  const orderedSpecials = useMemo(() => {
    return [...specials].sort((a, b) => {
      if (a.featured_home !== b.featured_home) return a.featured_home ? -1 : 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
  }, [specials]);

  const refreshPreview = () => setPreviewKey((k) => k + 1);

  const saveMode = async (next: Mode) => {
    setSaving("mode:" + next);
    const sb = supabase as any;
    const { error } = await sb
      .from("home_modules")
      .upsert({ key: "dynamic_zone_mode", value: next }, { onConflict: "key" });
    setSaving(null);
    if (error) return toast.error("No se pudo guardar: " + error.message);
    setMode(next);
    toast.success("Zona dinámica actualizada");
    setTimeout(refreshPreview, 300);
  };

  const toggleSection = async (key: HomeSectionKey, next: boolean) => {
    setSaving("sec:" + key);
    const { error } = await setHomeSectionVisibility(key, next);
    setSaving(null);
    if (error) return toast.error("No se pudo guardar: " + error.message);
    toast.success(`Sección "${key}" ${next ? "activada" : "ocultada"}`);
    setTimeout(refreshPreview, 300);
  };

  const toggleSpecial = async (slug: string) => {
    const next = selectedSlugs.includes(slug)
      ? selectedSlugs.filter((s) => s !== slug)
      : [...selectedSlugs, slug];
    setSelectedSlugs(next);
    setSaving("sp:" + slug);
    const sb = supabase as any;
    const { error } = await sb
      .from("home_modules")
      .upsert({ key: SPECIALS_KEY, value: next.join(",") }, { onConflict: "key" });
    setSaving(null);
    if (error) return toast.error("No se pudo guardar: " + error.message);
    toast.success("Especiales actualizados");
    setTimeout(refreshPreview, 300);
  };

  if (loading) return <div className="text-muted-foreground">Cargando…</div>;


  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-widest text-gold">Home Control Center</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Decide qué se ve en la home: zona dinámica, podios y secciones de previa. Los cambios se reflejan al instante en la vista previa.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="font-condensed inline-flex items-center gap-2 border border-border bg-surface px-3 py-2 text-xs font-bold uppercase tracking-widest text-gold hover:border-gold"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Abrir home
        </a>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(380px,520px)]">
        <div className="space-y-8">
          {/* Zona dinámica */}
          <section>
            <h2 className="font-display mb-3 text-sm uppercase tracking-widest text-gold">Zona dinámica</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {OPTIONS.map((opt) => {
                const active = mode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => saveMode(opt.value)}
                    disabled={saving !== null}
                    className={
                      "group relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all " +
                      (active
                        ? "border-gold bg-gradient-to-br from-surface to-surface-2/40 shadow-[0_8px_32px_rgba(212,160,23,0.25)]"
                        : "border-border bg-surface hover:border-gold/60")
                    }
                  >
                    <div
                      className={
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border " +
                        (active ? "border-gold bg-gold/10 text-gold" : "border-border bg-black/30 text-muted-foreground")
                      }
                    >
                      <opt.Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base uppercase tracking-wide text-foreground">{opt.label}</h3>
                        {active && <CheckCircle2 className="h-4 w-4 text-gold" />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 rounded-lg border border-border bg-surface px-4 py-3 text-xs text-muted-foreground">
              {featuredEvent ? (
                <>
                  Evento Live destacado: <span className="font-bold text-foreground">{featuredEvent.name}</span>. Cámbialo desde{" "}
                  <a href="/admin/eventos" className="text-gold hover:underline">Eventos</a>.
                </>
              ) : (
                <>
                  No hay evento marcado como destacado + live center. El modo "Evento en directo" saldrá vacío hasta activarlo en{" "}
                  <a href="/admin/eventos" className="text-gold hover:underline">Eventos</a>.
                </>
              )}
            </div>
          </section>

          {/* Secciones */}
          <section>
            <h2 className="font-display mb-3 text-sm uppercase tracking-widest text-gold">Secciones de la home</h2>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {HOME_SECTIONS.map((s) => {
                const on = visibility[s.key];
                const busy = saving === "sec:" + s.key;
                return (
                  <li key={s.key} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <div className="font-display text-sm uppercase tracking-wide text-foreground">{s.label}</div>
                      <div className="text-xs text-muted-foreground">{s.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSection(s.key, !on)}
                      disabled={busy}
                      aria-pressed={on}
                      className={
                        "font-condensed inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-all " +
                        (on
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-border bg-black/30 text-muted-foreground hover:border-gold/50")
                      }
                    >
                      {on ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {busy ? "…" : on ? "Visible" : "Oculta"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* Vista previa en vivo */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-sm uppercase tracking-widest text-gold">Vista previa en vivo</h2>
            <button
              type="button"
              onClick={refreshPreview}
              className="font-condensed inline-flex items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
            >
              <RefreshCw className="h-3 w-3" /> Recargar
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-black/40">
            <iframe
              key={previewKey}
              src="/"
              title="Vista previa de la home"
              className="block h-[80vh] w-full"
              style={{ minHeight: 560 }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            La previa refleja en directo la home pública. Los cambios se aplican automáticamente; pulsa Recargar si no se actualiza.
          </p>
        </aside>
      </div>
    </div>
  );
}
