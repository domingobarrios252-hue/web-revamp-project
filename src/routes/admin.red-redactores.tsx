import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, RotateCcw, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_REDACTORES,
  REDACTORES_FIELDS,
  saveRedactoresContent,
  useRedactoresContent,
  type RedactoresContent,
} from "@/lib/home/useRedactoresContent";
import { JoinContributorsBlock } from "@/components/home/JoinContributorsBlock";
import {
  HOME_SECTIONS,
  setHomeSectionVisibility,
  useHomeSectionVisibility,
} from "@/lib/home/useHomeSectionVisibility";

export const Route = createFileRoute("/admin/red-redactores")({
  head: () => ({
    meta: [
      { title: "Red de Redactores — RollerZone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminRedRedactores,
});

const FIELD_LABELS: Record<keyof RedactoresContent, { label: string; type?: "text" | "textarea" }> = {
  badge: { label: "Etiqueta superior" },
  title_line1: { label: "Título · Línea 1" },
  title_highlight: { label: "Título · Palabras destacadas (en dorado)" },
  title_line2: { label: "Título · Línea final" },
  description: { label: "Descripción principal", type: "textarea" },
  item1_label: { label: "Item 1 · Título" },
  item1_text: { label: "Item 1 · Texto" },
  item2_label: { label: "Item 2 · Título" },
  item2_text: { label: "Item 2 · Texto" },
  item3_label: { label: "Item 3 · Título" },
  item3_text: { label: "Item 3 · Texto" },
  item4_label: { label: "Item 4 · Título" },
  item4_text: { label: "Item 4 · Texto" },
  form_kicker: { label: "Formulario · Kicker" },
  form_placeholder_name: { label: "Placeholder · Nombre" },
  form_placeholder_email: { label: "Placeholder · Email" },
  form_placeholder_country: { label: "Placeholder · País" },
  form_placeholder_region: { label: "Placeholder · Zona/Ciudad" },
  form_placeholder_club: { label: "Placeholder · Club/Federación" },
  form_placeholder_topics: { label: "Placeholder · Temas" },
  form_placeholder_message: { label: "Placeholder · Mensaje" },
  form_consent: { label: "Texto de consentimiento", type: "textarea" },
  form_submit: { label: "Texto del botón enviar" },
  success_title: { label: "Éxito · Título" },
  success_text: { label: "Éxito · Descripción", type: "textarea" },
};

const GROUPS: { title: string; keys: (keyof RedactoresContent)[] }[] = [
  { title: "Titulares y descripción", keys: ["badge", "title_line1", "title_highlight", "title_line2", "description"] },
  { title: "Bloques informativos", keys: ["item1_label", "item1_text", "item2_label", "item2_text", "item3_label", "item3_text", "item4_label", "item4_text"] },
  { title: "Formulario · placeholders", keys: ["form_kicker", "form_placeholder_name", "form_placeholder_email", "form_placeholder_country", "form_placeholder_region", "form_placeholder_club", "form_placeholder_topics", "form_placeholder_message"] },
  { title: "Formulario · textos", keys: ["form_consent", "form_submit"] },
  { title: "Pantalla de éxito", keys: ["success_title", "success_text"] },
];

function AdminRedRedactores() {
  const { content, loading } = useRedactoresContent();
  const { visibility } = useHomeSectionVisibility();
  const [draft, setDraft] = useState<RedactoresContent>(DEFAULT_REDACTORES);
  const [saving, setSaving] = useState(false);
  const [togglingVis, setTogglingVis] = useState(false);

  useEffect(() => {
    if (!loading) setDraft(content);
  }, [loading, content]);

  const visible = visibility.redactores;

  const onSave = async () => {
    setSaving(true);
    const { error } = await saveRedactoresContent(draft);
    setSaving(false);
    if (error) return toast.error("No se pudo guardar: " + error.message);
    toast.success("Contenido guardado");
  };

  const onReset = () => {
    if (!confirm("¿Restaurar textos por defecto? (No se guarda hasta que pulses Guardar)")) return;
    setDraft(DEFAULT_REDACTORES);
  };

  const toggleVisible = async () => {
    setTogglingVis(true);
    const { error } = await setHomeSectionVisibility("redactores", !visible);
    setTogglingVis(false);
    if (error) return toast.error("No se pudo cambiar: " + error.message);
    toast.success(visible ? "Sección oculta en la home" : "Sección visible en la home");
  };

  const set = (k: keyof RedactoresContent, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  if (loading) return <div className="text-muted-foreground">Cargando…</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-widest text-gold">Red de Redactores</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Edita titulares, textos y placeholders del formulario. También puedes ocultar la sección en la home de forma provisional.
          </p>
          {HOME_SECTIONS.find((s) => s.key === "redactores") && (
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
              Estado en home:{" "}
              <span className={visible ? "text-gold" : "text-destructive"}>
                {visible ? "Visible" : "Oculta"}
              </span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={toggleVisible}
            disabled={togglingVis}
            className={
              "font-condensed inline-flex items-center gap-2 border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors " +
              (visible
                ? "border-destructive text-destructive hover:bg-destructive/10"
                : "border-gold text-gold hover:bg-gold/10")
            }
          >
            <Eye className="h-3.5 w-3.5" />
            {togglingVis ? "…" : visible ? "Ocultar en home" : "Mostrar en home"}
          </button>
          <button
            onClick={onReset}
            className="font-condensed inline-flex items-center gap-2 border border-border bg-surface px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restaurar por defecto
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="font-condensed inline-flex items-center gap-2 bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" /> {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          {GROUPS.map((g) => (
            <section key={g.title} className="rounded-xl border border-border bg-surface p-5">
              <h2 className="font-display mb-4 text-sm uppercase tracking-widest text-gold">{g.title}</h2>
              <div className="grid gap-3">
                {g.keys.map((k) => {
                  const meta = FIELD_LABELS[k];
                  return (
                    <label key={k} className="block">
                      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                        {meta.label}
                      </span>
                      {meta.type === "textarea" ? (
                        <textarea
                          value={draft[k]}
                          onChange={(e) => set(k, e.target.value)}
                          rows={3}
                          className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none"
                        />
                      ) : (
                        <input
                          value={draft[k]}
                          onChange={(e) => set(k, e.target.value)}
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-gold focus:outline-none"
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <h2 className="font-display mb-3 text-sm uppercase tracking-widest text-gold">Vista previa</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="scale-[0.85] origin-top-left" style={{ width: "117.6%" }}>
              <JoinContributorsBlock override={draft} />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            La vista previa refleja tus cambios sin guardar. Pulsa "Guardar cambios" para publicarlos.
          </p>
        </aside>
      </div>
    </div>
  );
}
