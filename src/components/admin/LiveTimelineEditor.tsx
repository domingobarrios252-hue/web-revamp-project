import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Radio, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

type EventRow = { id: string; name: string; start_date: string; status: string };
type TimelineEntry = {
  id: string;
  event_id: string;
  entry_type: string;
  message: string;
  occurred_at: string;
  published: boolean;
};

const ENTRY_TYPES = [
  { value: "update", label: "Actualización" },
  { value: "race_start", label: "Inicio de prueba" },
  { value: "result", label: "Resultado" },
  { value: "incident", label: "Incidencia" },
  { value: "medal", label: "Medalla" },
  { value: "note", label: "Nota" },
] as const;

const entrySchema = z.object({
  event_id: z.string().uuid(),
  entry_type: z.string().min(1).max(40),
  message: z.string().trim().min(2).max(1000),
  occurred_at: z.string().min(1),
  published: z.boolean(),
});

function toLocalInput(iso: string | null | undefined) {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function LiveTimelineEditor() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [activeEventId, setActiveEventId] = useState<string>("");
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TimelineEntry | "new" | null>(null);

  const loadEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("id,name,start_date,status")
      .order("start_date", { ascending: false })
      .limit(80);
    const list = (data as EventRow[]) ?? [];
    setEvents(list);
    if (!activeEventId && list.length > 0) {
      const live = list.find((e) => e.status === "en_curso") ?? list[0];
      setActiveEventId(live.id);
    }
  };

  const loadEntries = async (eventId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("live_timeline")
      .select("*")
      .eq("event_id", eventId)
      .order("occurred_at", { ascending: false });
    setEntries((data as TimelineEntry[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (activeEventId) loadEntries(activeEventId);
  }, [activeEventId]);

  const togglePublished = async (e: TimelineEntry) => {
    const { error } = await supabase
      .from("live_timeline")
      .update({ published: !e.published })
      .eq("id", e.id);
    if (error) return toast.error(error.message);
    loadEntries(activeEventId);
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta entrada?")) return;
    const { error } = await supabase.from("live_timeline").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Entrada eliminada");
    loadEntries(activeEventId);
  };

  const activeEvent = useMemo(() => events.find((e) => e.id === activeEventId), [events, activeEventId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div className="space-y-1">
          <h2 className="font-display text-xl tracking-widest text-foreground">
            Cronología en vivo
          </h2>
          <p className="text-xs text-muted-foreground">
            Actualizaciones en tiempo real para el evento seleccionado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={activeEventId}
            onChange={(e) => setActiveEventId(e.target.value)}
            className="input min-w-[260px]"
          >
            <option value="">— Selecciona un evento —</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.status === "en_curso" ? "● " : ""}
                {e.name} · {e.start_date}
              </option>
            ))}
          </select>
          <button
            disabled={!activeEventId}
            onClick={() => setEditing("new")}
            className="font-condensed inline-flex items-center gap-1.5 bg-gold px-3 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Entrada
          </button>
        </div>
      </div>

      {activeEvent && activeEvent.status === "en_curso" && (
        <div className="flex items-center gap-2 border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs">
          <Radio className="h-3.5 w-3.5 text-destructive" />
          <span className="font-condensed uppercase tracking-widest text-destructive">
            Evento en curso · publicación en directo
          </span>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : !activeEventId ? (
        <p className="text-sm text-muted-foreground">Selecciona un evento para gestionar su cronología.</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin entradas. Pulsa "Entrada" para añadir la primera actualización.
        </p>
      ) : (
        <ol className="space-y-2">
          {entries.map((e) => {
            const typeLabel = ENTRY_TYPES.find((t) => t.value === e.entry_type)?.label ?? e.entry_type;
            const time = new Date(e.occurred_at).toLocaleString("es-ES", {
              dateStyle: "short",
              timeStyle: "short",
            });
            return (
              <li
                key={e.id}
                className={`flex items-start gap-3 border bg-surface p-3 ${
                  e.published ? "border-border" : "border-dashed border-muted-foreground/40 opacity-70"
                }`}
              >
                <div className="font-condensed w-20 shrink-0 text-[10px] uppercase tracking-widest text-gold">
                  {typeLabel}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground">{e.message}</div>
                  <div className="font-condensed mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                    {time}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => togglePublished(e)}
                    className="text-muted-foreground hover:text-gold"
                    aria-label={e.published ? "Ocultar" : "Publicar"}
                  >
                    {e.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setEditing(e)}
                    className="text-muted-foreground hover:text-gold"
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(e.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {editing && activeEventId && (
        <EntryForm
          initial={editing === "new" ? null : editing}
          eventId={activeEventId}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            loadEntries(activeEventId);
          }}
        />
      )}
    </div>
  );
}

function EntryForm({
  initial,
  eventId,
  onClose,
  onSaved,
}: {
  initial: TimelineEntry | null;
  eventId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [entryType, setEntryType] = useState(initial?.entry_type ?? "update");
  const [message, setMessage] = useState(initial?.message ?? "");
  const [occurredAt, setOccurredAt] = useState(toLocalInput(initial?.occurred_at));
  const [published, setPublished] = useState(initial?.published ?? true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const iso = new Date(occurredAt).toISOString();
    const parsed = entrySchema.safeParse({
      event_id: eventId,
      entry_type: entryType,
      message,
      occurred_at: iso,
      published,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setSaving(true);
    const payload = {
      event_id: eventId,
      entry_type: entryType,
      message: message.trim(),
      occurred_at: iso,
      published,
    };
    const res = isEdit
      ? await supabase.from("live_timeline").update(payload).eq("id", initial!.id)
      : await supabase.from("live_timeline").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(isEdit ? "Entrada actualizada" : "Entrada creada");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur">
      <div className="relative my-8 w-full max-w-xl border border-border bg-background p-6">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-display mb-5 text-xl tracking-widest text-gold">
          {isEdit ? "Editar entrada" : "Nueva entrada"}
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Tipo
              </label>
              <select
                value={entryType}
                onChange={(e) => setEntryType(e.target.value)}
                className="input"
              >
                {ENTRY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Fecha y hora
              </label>
              <input
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              Mensaje *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="input"
              placeholder="¡Oro para Ana García en 500m sprint!"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            Publicado (visible en directo)
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="font-condensed border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
