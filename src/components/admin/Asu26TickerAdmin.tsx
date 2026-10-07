import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  TICKER_TYPE_LABEL,
  loadAsu26Ticker,
  saveAsu26Ticker,
  type TickerMsg,
  type TickerMsgType,
} from "@/lib/tv/asu26Ticker";

/** Bloque «TICKER ROLLERZONE TV» del editor del Especial ASU26. Las pruebas salen del calendario. */
export function Asu26TickerAdmin() {
  const [list, setList] = useState<TickerMsg[] | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    loadAsu26Ticker().then(setList);
  }, []);

  const set = (id: string, patch: Partial<TickerMsg>) => setList((l) => l!.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const save = async () => {
    if (!list) return;
    if (list.some((m) => !m.date || !m.text.trim())) return toast.error("Cada mensaje necesita fecha y texto");
    if (list.some((m) => m.type === "previa" && (!m.start || !m.end || m.start >= m.end)))
      return toast.error("La previa necesita hora de inicio y de fin (la de fin, posterior)");
    setSaving(true);
    const { error } = await saveAsu26Ticker([...list].sort((a, b) => a.date.localeCompare(b.date)));
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Ticker guardado");
  };

  return (
    <section className="mb-8 border border-border bg-surface p-4 md:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl tracking-widest">TICKER ROLLERZONE TV</h2>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            Prioridad: carrera «En curso» → «En directo ahora»; «Previa de jornada» activa dentro de su franja (hora de Asunción) → «ASU26 · Previa»; si hay carreras ese día se muestran las del calendario
            (un mensaje «Jornada finalizada» activo sustituye al texto automático al terminar). Sin carreras se usa el
            mensaje activo de esa fecha; si no hay ninguno, el ticker se oculta. Separa frases con «·».
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setList((l) => [...(l ?? []), { id: crypto.randomUUID(), date: "2026-10-10", type: "especial", text: "", active: true }])}
            className="font-condensed inline-flex items-center gap-2 border border-border px-3 py-2 text-xs uppercase tracking-widest hover:border-gold"
          >
            <Plus className="h-4 w-4" /> Añadir mensaje
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !list}
            className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
      {!list ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin mensajes. Los días sin carreras el ticker no se mostrará.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((m) => (
            <li key={m.id} className={"grid gap-2 border border-border bg-background p-3 md:grid-cols-[10rem_11rem_minmax(0,1fr)_auto_auto] md:items-start " + (m.active ? "" : "opacity-60")}>
              <label className="block">
                <span className="font-condensed mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Fecha</span>
                <input type="date" value={m.date} onChange={(e) => set(m.id, { date: e.target.value })} className="w-full border border-border bg-surface px-2 py-1.5 text-sm" />
              </label>
              <label className="block">
                <span className="font-condensed mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Tipo de mensaje</span>
                <select value={m.type} onChange={(e) => set(m.id, { type: e.target.value as TickerMsgType })} className="w-full border border-border bg-surface px-2 py-1.5 text-sm">
                  {(Object.keys(TICKER_TYPE_LABEL) as TickerMsgType[]).map((k) => <option key={k} value={k}>{TICKER_TYPE_LABEL[k]}</option>)}
                </select>
              </label>
              <div className="space-y-2">
              {m.type === "previa" && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="font-condensed mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Hora inicio (PY)</span>
                    <input type="time" value={m.start ?? ""} onChange={(e) => set(m.id, { start: e.target.value })} className="w-full border border-border bg-surface px-2 py-1.5 text-sm" />
                  </label>
                  <label className="block">
                    <span className="font-condensed mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Hora fin (PY)</span>
                    <input type="time" value={m.end ?? ""} onChange={(e) => set(m.id, { end: e.target.value })} className="w-full border border-border bg-surface px-2 py-1.5 text-sm" />
                  </label>
                </div>
              )}
              <label className="block">
                <span className="font-condensed mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Texto</span>
                <textarea value={m.text} rows={2} onChange={(e) => set(m.id, { text: e.target.value })} className="w-full border border-border bg-surface px-2 py-1.5 text-sm" placeholder="Frase 1 · Frase 2 · Frase 3" />
              </label>
              </div>
              <label className="flex items-center gap-2 md:mt-6">
                <input type="checkbox" checked={m.active} onChange={(e) => set(m.id, { active: e.target.checked })} />
                <span className="font-condensed text-[11px] uppercase tracking-widest">{m.active ? "Activo" : "Inactivo"}</span>
              </label>
              <button
                type="button"
                aria-label="Eliminar mensaje"
                onClick={() => confirm("¿Eliminar este mensaje del ticker?") && setList((l) => l!.filter((x) => x.id !== m.id))}
                className="inline-flex h-9 w-9 items-center justify-center border border-border text-destructive md:mt-5"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
