import { useEffect, useMemo, useState } from "react";
import { Minus, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  ASU26_MEDALS_DEFAULTS,
  MEDAL_STATUS_LABEL,
  flagFor,
  formatUpdated,
  loadAsu26Medals,
  rankMedals,
  saveAsu26Medals,
  type Asu26MedalCountry,
  type Asu26MedalStatus,
  type Asu26Medals,
} from "@/lib/specials/asu26Medals";

type Field = "gold" | "silver" | "bronze";
const FIELDS: [Field, string][] = [["gold", "Oro"], ["silver", "Plata"], ["bronze", "Bronce"]];

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Medallero ASU26: edición rápida +/−, fichas de país, estado y fecha. Guarda al momento. */
export function Asu26MedalsAdmin() {
  const [data, setData] = useState<Asu26Medals>(ASU26_MEDALS_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Asu26MedalCountry | null>(null);

  useEffect(() => {
    loadAsu26Medals().then((m) => {
      setData(m);
      setLoading(false);
    });
  }, []);

  const ranked = useMemo(() => rankMedals(data.countries), [data.countries]);

  const persist = async (next: Asu26Medals, touch = true) => {
    const value = touch ? { ...next, updatedAt: new Date().toISOString() } : next;
    const prev = data;
    setData(value);
    const { error } = await saveAsu26Medals(value);
    if (error) {
      setData(prev);
      toast.error(error.message);
      return false;
    }
    return true;
  };

  const bump = (id: string, f: Field, d: number) =>
    persist({
      ...data,
      countries: data.countries.map((c) => (c.id === id ? { ...c, [f]: Math.max(0, c[f] + d) } : c)),
    });

  const saveCountry = async (c: Asu26MedalCountry) => {
    if (c.name.trim().length < 2) return toast.error("Escribe el nombre del país");
    const exists = data.countries.some((x) => x.id === c.id);
    const countries = exists ? data.countries.map((x) => (x.id === c.id ? c : x)) : [...data.countries, c];
    if (await persist({ ...data, countries })) {
      toast.success("País guardado");
      setEditing(null);
    }
  };

  const remove = async (c: Asu26MedalCountry) => {
    if (!confirm(`¿Eliminar ${c.name} del medallero ASU26?`)) return;
    if (await persist({ ...data, countries: data.countries.filter((x) => x.id !== c.id) })) toast.success("Eliminado");
  };

  if (loading) return <p className="text-sm text-muted-foreground">Cargando medallero ASU26…</p>;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 border border-border bg-surface p-4 md:grid-cols-2">
        <label className="block">
          <span className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Estado</span>
          <select
            value={data.status}
            onChange={(e) => persist({ ...data, status: e.target.value as Asu26MedalStatus }, false)}
            className="w-full border border-border bg-background px-3 py-2 text-sm"
          >
            {(Object.keys(MEDAL_STATUS_LABEL) as Asu26MedalStatus[]).map((k) => (
              <option key={k} value={k}>{k === "final" ? "Final" : MEDAL_STATUS_LABEL[k]}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
            Última actualización (se pone sola al cambiar medallas)
          </span>
          <input
            type="datetime-local"
            value={toLocalInput(data.updatedAt)}
            onChange={(e) =>
              persist({ ...data, updatedAt: e.target.value ? new Date(e.target.value).toISOString() : null }, false)
            }
            className="w-full border border-border bg-background px-3 py-2 text-sm"
          />
          {data.updatedAt && <span className="mt-1 block text-xs text-muted-foreground">Público: {formatUpdated(data.updatedAt)}</span>}
        </label>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl tracking-widest">Edición rápida</h2>
        <button
          onClick={() => setEditing({ id: crypto.randomUUID(), name: "", iso: "", flagUrl: "", gold: 0, silver: 0, bronze: 0 })}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Añadir país
        </button>
      </div>

      {ranked.length === 0 ? (
        <p className="border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
          Aún no hay países. Pulsa «Añadir país».
        </p>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="font-condensed border-b border-border text-[10px] uppercase tracking-[2px] text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Pos.</th>
                <th className="px-3 py-2 text-left">País</th>
                {FIELDS.map(([, l]) => <th key={l} className="px-3 py-2">{l}</th>)}
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {ranked.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2 font-display text-gold">{c.pos}</td>
                  <td className="px-3 py-2">
                    <span className="mr-2">{c.flagUrl ? <img src={c.flagUrl} alt="" className="inline h-4 w-6 object-cover" /> : flagFor(c.iso)}</span>
                    {c.name} <span className="font-mono text-[10px] text-muted-foreground">{c.iso}</span>
                  </td>
                  {FIELDS.map(([f, l]) => (
                    <td key={f} className="px-2 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button aria-label={`Quitar ${l} a ${c.name}`} onClick={() => bump(c.id, f, -1)} disabled={c[f] === 0} className="inline-flex h-8 w-8 items-center justify-center border border-border hover:bg-background disabled:opacity-30"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-7 text-center font-bold tabular-nums">{c[f]}</span>
                        <button aria-label={`Sumar ${l} a ${c.name}`} onClick={() => bump(c.id, f, 1)} className="inline-flex h-8 w-8 items-center justify-center border border-border hover:bg-background"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-display text-lg">{c.total}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button aria-label={`Editar ${c.name}`} onClick={() => setEditing(c)} className="inline-flex h-8 w-8 items-center justify-center border border-border hover:bg-background"><Pencil className="h-3.5 w-3.5" /></button>
                      <button aria-label={`Eliminar ${c.name}`} onClick={() => remove(c)} className="inline-flex h-8 w-8 items-center justify-center border border-border text-destructive hover:bg-background"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && <CountryForm value={editing} onCancel={() => setEditing(null)} onSave={saveCountry} />}
    </div>
  );
}

function CountryForm({ value, onCancel, onSave }: { value: Asu26MedalCountry; onCancel: () => void; onSave: (c: Asu26MedalCountry) => void }) {
  const [c, setC] = useState(value);
  const num = (f: Field) => (
    <label className="block">
      <span className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">{FIELDS.find((x) => x[0] === f)![1]}</span>
      <input type="number" min={0} value={c[f]} onChange={(e) => setC({ ...c, [f]: Math.max(0, Number(e.target.value) || 0) })} className="w-full border border-border bg-background px-3 py-2 text-sm" />
    </label>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-0 md:items-center md:p-4" role="dialog" aria-modal="true">
      <div className="max-h-[95vh] w-full max-w-lg overflow-y-auto border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl tracking-widest">{value.name ? "Editar país" : "Añadir país"}</h3>
          <button onClick={onCancel} aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-3">
          <label className="block">
            <span className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">País</span>
            <input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} className="w-full border border-border bg-background px-3 py-2 text-sm" placeholder="España" />
          </label>
          <label className="block">
            <span className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Código ISO (ESP, COL, ITA…)</span>
            <input value={c.iso} maxLength={3} onChange={(e) => setC({ ...c, iso: e.target.value.toUpperCase() })} className="w-full border border-border bg-background px-3 py-2 text-sm uppercase" />
            <span className="mt-1 block text-xs text-muted-foreground">Bandera automática: {flagFor(c.iso) || "—"}</span>
          </label>
          <ImageUploadField label="Bandera (opcional, sustituye a la automática)" value={c.flagUrl} onChange={(url) => setC({ ...c, flagUrl: url ?? "" })} />
          <div className="grid grid-cols-3 gap-3">{num("gold")}{num("silver")}{num("bronze")}</div>
          <p className="text-xs text-muted-foreground">Total: {c.gold + c.silver + c.bronze} (automático)</p>
        </div>
        <div className="sticky bottom-0 mt-5 flex justify-end gap-2 bg-surface pt-3">
          <button onClick={onCancel} className="font-condensed border border-border px-4 py-2 text-xs uppercase tracking-widest">Cancelar</button>
          <button onClick={() => onSave({ ...c, name: c.name.trim(), iso: c.iso.trim() })} className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background">
            <Save className="h-4 w-4" /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
