import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

export const Route = createFileRoute("/admin/skater-rankings")({
  head: () => ({ meta: [{ title: "Admin · Clasificación patinadores" }, { name: "robots", content: "noindex" }] }),
  component: AdminSkaterRankings,
});

const schema = z.object({
  position: z.number().int().min(1).max(9999),
  skater_name: z.string().trim().min(2).max(120),
  team: z.string().trim().max(120).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  country_code: z.string().trim().max(8).optional().or(z.literal("")),
  flag_url: z.string().trim().url().optional().or(z.literal("")),
  time_result: z.string().trim().max(40).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  event_name: z.string().trim().max(160).optional().or(z.literal("")),
  published: z.boolean(),
  sort_order: z.number().int().min(0),
});

type Row = {
  id: string;
  position: number;
  skater_name: string;
  team: string | null;
  country: string | null;
  country_code: string | null;
  flag_url: string | null;
  time_result: string | null;
  category: string | null;
  event_name: string | null;
  published: boolean;
  sort_order: number;
};

function AdminSkaterRankings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("skater_rankings")
      .select("*")
      .order("position", { ascending: true })
      .order("sort_order", { ascending: true });
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onNew = () => {
    setEditing({
      id: "",
      position: rows.length + 1,
      skater_name: "",
      team: "",
      country: "",
      country_code: "",
      flag_url: null,
      time_result: "",
      category: "",
      event_name: "",
      published: true,
      sort_order: 0,
    });
    setOpen(true);
  };

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar este patinador de la clasificación?")) return;
    const { error } = await supabase.from("skater_rankings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    load();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest">Clasificación patinadores</h1>
        <button
          onClick={onNew}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Añadir patinador
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">Sin entradas. Añade patinadores a la clasificación.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="font-condensed text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 w-12 text-center">Pos</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Equipo</th>
                <th className="px-3 py-2">País</th>
                <th className="px-3 py-2">Tiempo</th>
                <th className="px-3 py-2">Pub.</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-background/50">
                  <td className="px-3 py-2 text-center font-display text-gold">{r.position}</td>
                  <td className="px-3 py-2 font-medium">{r.skater_name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.team ?? "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {r.flag_url && (
                        <img src={r.flag_url} alt={r.country ?? ""} className="h-4 w-6 object-cover" />
                      )}
                      <span className="text-xs">{r.country_code ?? r.country ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.time_result ?? "—"}</td>
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
  const [position, setPosition] = useState(row.position);
  const [skaterName, setSkaterName] = useState(row.skater_name);
  const [team, setTeam] = useState(row.team ?? "");
  const [country, setCountry] = useState(row.country ?? "");
  const [countryCode, setCountryCode] = useState(row.country_code ?? "");
  const [flagUrl, setFlagUrl] = useState(row.flag_url ?? "");
  const [timeResult, setTimeResult] = useState(row.time_result ?? "");
  const [category, setCategory] = useState(row.category ?? "");
  const [eventName, setEventName] = useState(row.event_name ?? "");
  const [published, setPublished] = useState(row.published);
  const [sortOrder, setSortOrder] = useState(row.sort_order);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const parsed = schema.safeParse({
      position,
      skater_name: skaterName,
      team,
      country,
      country_code: countryCode,
      flag_url: flagUrl,
      time_result: timeResult,
      category,
      event_name: eventName,
      published,
      sort_order: sortOrder,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");

    setSaving(true);
    const payload = {
      position: parsed.data.position,
      skater_name: parsed.data.skater_name,
      team: parsed.data.team || null,
      country: parsed.data.country || null,
      country_code: parsed.data.country_code || null,
      flag_url: parsed.data.flag_url || null,
      time_result: parsed.data.time_result || null,
      category: parsed.data.category || null,
      event_name: parsed.data.event_name || null,
      published: parsed.data.published,
      sort_order: parsed.data.sort_order,
    };
    const { error } = row.id
      ? await supabase.from("skater_rankings").update(payload).eq("id", row.id)
      : await supabase.from("skater_rankings").insert(payload);
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
            {row.id ? "Editar patinador" : "Nuevo patinador"}
          </h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <Field label="Pos. *">
              <input
                type="number"
                min={1}
                value={position}
                onChange={(e) => setPosition(parseInt(e.target.value || "1", 10))}
                className="input"
              />
            </Field>
            <Field label="Nombre patinador *">
              <input value={skaterName} onChange={(e) => setSkaterName(e.target.value)} className="input" />
            </Field>
          </div>
          <Field label="Equipo / Team">
            <input value={team} onChange={(e) => setTeam(e.target.value)} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="País (nombre)">
              <input value={country} onChange={(e) => setCountry(e.target.value)} className="input" />
            </Field>
            <Field label="Código (ej: ESP)">
              <input
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                className="input"
                maxLength={8}
              />
            </Field>
          </div>
          <Field label="Bandera (URL)">
            <ImageUploadField
              bucket="media"
              folder="flags"
              value={flagUrl}
              onChange={setFlagUrl}
              accept="image/*"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tiempo (ej: 1:23.456)">
              <input value={timeResult} onChange={(e) => setTimeResult(e.target.value)} className="input" />
            </Field>
            <Field label="Categoría">
              <input value={category} onChange={(e) => setCategory(e.target.value)} className="input" />
            </Field>
          </div>
          <Field label="Prueba / Evento (opcional)">
            <input value={eventName} onChange={(e) => setEventName(e.target.value)} className="input" />
          </Field>
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
