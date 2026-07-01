import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HUB_SECTIONS, type HubSectionKey, type QuickLink } from "@/lib/hub/useCountryHub";

export function QuickLinksEditor({
  hubId,
  initial,
  onSaved,
}: {
  hubId: string;
  initial: QuickLink[];
  onSaved: () => void;
}) {
  const [items, setItems] = useState<QuickLink[]>(initial ?? []);
  const [saving, setSaving] = useState(false);

  const update = (i: number, patch: Partial<QuickLink>) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };
  const add = () => setItems((p) => [...p, { section: "clubes", label: "Nuevo acceso" }]);
  const remove = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };

  const save = async () => {
    const clean = items
      .map((it) => ({ section: it.section, label: (it.label ?? "").trim() }))
      .filter((it) => it.label && HUB_SECTIONS.some((s) => s.key === it.section));
    setSaving(true);
    const sb = supabase as any;
    const { error } = await sb
      .from("country_hubs")
      .update({ quick_links: clean })
      .eq("id", hubId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Accesos rápidos actualizados");
    onSaved();
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-sm uppercase tracking-widest text-gold">
            Accesos rápidos del hub
          </h2>
          <p className="text-xs text-muted-foreground">
            Los botones grandes del sidebar del hub. Puedes añadir, renombrar, reordenar y eliminar.
          </p>
        </div>
        <button
          onClick={add}
          className="font-condensed inline-flex items-center gap-1 rounded border border-gold/60 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gold hover:bg-gold/10"
        >
          <Plus className="h-3 w-3" /> Añadir
        </button>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">Sin accesos rápidos.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex flex-col gap-2 rounded border border-border bg-background p-3 sm:flex-row sm:items-center"
            >
              <input
                value={it.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Etiqueta visible"
                className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
              />
              <select
                value={it.section}
                onChange={(e) => update(i, { section: e.target.value as HubSectionKey })}
                className="rounded border border-border bg-background px-2 py-1 text-sm"
              >
                {HUB_SECTIONS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(i, -1)}
                  className="rounded border border-border p-1 hover:bg-surface"
                  title="Subir"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  className="rounded border border-border p-1 hover:bg-surface"
                  title="Bajar"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(i)}
                  className="rounded border border-border p-1 text-destructive hover:bg-destructive/10"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </section>
  );
}
