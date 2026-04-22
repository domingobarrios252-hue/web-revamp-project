import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

export const Route = createFileRoute("/admin/medallero")({
  head: () => ({ meta: [{ title: "Admin · Medallero" }, { name: "robots", content: "noindex" }] }),
  component: AdminMedallero,
});

const schema = z.object({
  country_name: z.string().trim().min(2).max(80),
  country_code: z.string().trim().max(8).optional().or(z.literal("")),
  flag_url: z.string().trim().url().optional().or(z.literal("")),
  gold: z.number().int().min(0),
  silver: z.number().int().min(0),
  bronze: z.number().int().min(0),
  published: z.boolean(),
  sort_order: z.number().int().min(0),
});

type Row = {
  id: string;
  country_name: string;
  country_code: string | null;
  flag_url: string | null;
  gold: number;
  silver: number;
  bronze: number;
  published: boolean;
  sort_order: number;
};

function AdminMedallero() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [showOnHome, setShowOnHome] = useState(true);
  const [savingToggle, setSavingToggle] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data }, { data: setting }] = await Promise.all([
      supabase
        .from("medal_standings")
        .select("*")
        .order("gold", { ascending: false })
        .order("silver", { ascending: false })
        .order("bronze", { ascending: false }),
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "home_medals_enabled")
        .maybeSingle(),
    ]);
    setRows((data as Row[]) ?? []);
    if (setting?.value && typeof (setting.value as { enabled?: boolean }).enabled === "boolean") {
      setShowOnHome((setting.value as { enabled: boolean }).enabled);
    }
    setLoading(false);
  };

  const toggleHomeVisibility = async (next: boolean) => {
    setShowOnHome(next);
    setSavingToggle(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        [{ key: "home_medals_enabled", value: { enabled: next } as unknown as Record<string, unknown> }] as never,
        { onConflict: "key" },
      );
    setSavingToggle(false);
    if (error) {
      toast.error(error.message);
      setShowOnHome(!next);
      return;
    }
    toast.success(next ? "Medallero visible en la portada" : "Medallero oculto en la portada");
  };

  useEffect(() => {
    load();
  }, []);

  const onNew = () => {
    setEditing({
      id: "",
      country_name: "",
      country_code: "",
      flag_url: null,
      gold: 0,
      silver: 0,
      bronze: 0,
      published: true,
      sort_order: 0,
    });
    setOpen(true);
  };

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar este país del medallero?")) return;
    const { error } = await supabase.from("medal_standings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    load();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest">Medallero</h1>
        <button
          onClick={onNew}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Añadir país
        </button>
      </div>

      <label className="mb-5 flex items-center gap-2 border border-border bg-surface p-3">
        <input
          type="checkbox"
          checked={showOnHome}
          onChange={(e) => toggleHomeVisibility(e.target.checked)}
          disabled={savingToggle}
        />
        <span className="font-condensed text-xs uppercase tracking-widest">
          Mostrar el medallero de países en la portada
        </span>
      </label>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">Sin entradas. Añade países al medallero.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="font-condensed text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">País</th>
                <th className="px-3 py-2">Cód.</th>
                <th className="px-3 py-2 text-center">🥇</th>
                <th className="px-3 py-2 text-center">🥈</th>
                <th className="px-3 py-2 text-center">🥉</th>
                <th className="px-3 py-2 text-center">Total</th>
                <th className="px-3 py-2">Pub.</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-background/50">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {r.flag_url && (
                        <img src={r.flag_url} alt={r.country_name} className="h-4 w-6 object-cover" />
                      )}
                      <span className="font-medium">{r.country_name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.country_code ?? "—"}</td>
                  <td className="px-3 py-2 text-center font-bold text-gold">{r.gold}</td>
                  <td className="px-3 py-2 text-center">{r.silver}</td>
                  <td className="px-3 py-2 text-center">{r.bronze}</td>
                  <td className="px-3 py-2 text-center font-display">{r.gold + r.silver + r.bronze}</td>
                  <td className="px-3 py-2">{r.published ? "✓" : "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setEditing(r); setOpen(true); }}
                        className="font-condensed text-[11px] uppercase tracking-widest text-gold hover:underline"
                      >
                        Editar
                      </button>
                      <button onClick={() => onDelete(r.id)} className="text-tv-red hover:opacity-80">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && editing && (
        <EditDialog row={editing} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load(); }} />
      )}
    </div>
  );
}

function EditDialog({ row, onClose, onSaved }: { row: Row; onClose: () => void; onSaved: () => void }) {
  const [countryName, setCountryName] = useState(row.country_name);
  const [countryCode, setCountryCode] = useState(row.country_code ?? "");
  const [flagUrl, setFlagUrl] = useState(row.flag_url ?? "");
  const [gold, setGold] = useState(row.gold);
  const [silver, setSilver] = useState(row.silver);
  const [bronze, setBronze] = useState(row.bronze);
  const [published, setPublished] = useState(row.published);
  const [sortOrder, setSortOrder] = useState(row.sort_order);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const parsed = schema.safeParse({
      country_name: countryName,
      country_code: countryCode,
      flag_url: flagUrl,
      gold,
      silver,
      bronze,
      published,
      sort_order: sortOrder,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");

    setSaving(true);
    const payload = {
      country_name: parsed.data.country_name,
      country_code: parsed.data.country_code || null,
      flag_url: parsed.data.flag_url || null,
      gold: parsed.data.gold,
      silver: parsed.data.silver,
      bronze: parsed.data.bronze,
      published: parsed.data.published,
      sort_order: parsed.data.sort_order,
    };
    const { error } = row.id
      ? await supabase.from("medal_standings").update(payload).eq("id", row.id)
      : await supabase.from("medal_standings").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Guardado");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg tracking-widest text-gold">
            {row.id ? "Editar país" : "Nuevo país"}
          </h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Nombre del país *">
            <input value={countryName} onChange={(e) => setCountryName(e.target.value)} className="input" />
          </Field>
          <Field label="Código (ej: ESP, COL, ITA)">
            <input
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
              className="input"
              maxLength={8}
            />
          </Field>
          <Field label="Bandera (URL)">
            <ImageUploadField
              bucket="media"
              folder="flags"
              value={flagUrl}
              onChange={setFlagUrl}
              accept="image/*"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="🥇 Oro">
              <input
                type="number"
                min={0}
                value={gold}
                onChange={(e) => setGold(parseInt(e.target.value || "0", 10))}
                className="input"
              />
            </Field>
            <Field label="🥈 Plata">
              <input
                type="number"
                min={0}
                value={silver}
                onChange={(e) => setSilver(parseInt(e.target.value || "0", 10))}
                className="input"
              />
            </Field>
            <Field label="🥉 Bronce">
              <input
                type="number"
                min={0}
                value={bronze}
                onChange={(e) => setBronze(parseInt(e.target.value || "0", 10))}
                className="input"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Orden">
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value || "0", 10))}
                className="input"
              />
            </Field>
            <label className="flex items-end gap-2">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="mb-2 h-4 w-4"
              />
              <span className="font-condensed mb-2 text-[11px] uppercase tracking-widest">Publicado</span>
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="font-condensed border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
