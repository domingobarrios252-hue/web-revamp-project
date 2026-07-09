import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Save, ExternalLink, FileType2, Trash2, Upload, Plus, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ResultadosHubTabs } from "@/components/admin/ResultadosHubTabs";

export const Route = createFileRoute("/admin/resultados-pdfs")({
  head: () => ({ meta: [{ title: "Admin · PDFs oficiales" }, { name: "robots", content: "noindex" }] }),
  component: AdminResultadosPdfs,
});

type EventOpt = { id: string; slug: string; name: string };

type DocRow = {
  id: string;
  event_id: string;
  jornada: string | null;
  name: string;
  doc_type: "clasificacion" | "resultados" | "acta" | "medallero" | "ranking" | "otro";
  status: "borrador" | "provisional" | "oficial" | "oculto";
  file_url: string;
  file_path: string | null;
  file_size: number | null;
  sort_order: number;
  visible: boolean;
  created_at: string;
};

const DOC_TYPES: { value: DocRow["doc_type"]; label: string }[] = [
  { value: "clasificacion", label: "Clasificación" },
  { value: "resultados", label: "Resultados completos" },
  { value: "acta", label: "Acta" },
  { value: "medallero", label: "Medallero" },
  { value: "ranking", label: "Ranking" },
  { value: "otro", label: "Otro" },
];

const STATUSES: { value: DocRow["status"]; label: string; cls: string }[] = [
  { value: "borrador", label: "Borrador", cls: "bg-muted/40 text-muted-foreground" },
  { value: "provisional", label: "Provisional", cls: "bg-amber-500/20 text-amber-400" },
  { value: "oficial", label: "Oficial", cls: "bg-emerald-500/20 text-emerald-400" },
  { value: "oculto", label: "Oculto", cls: "bg-destructive/20 text-destructive" },
];

function AdminResultadosPdfs() {
  const [events, setEvents] = useState<EventOpt[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEvent, setFilterEvent] = useState("");
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: ev }, { data: dc }] = await Promise.all([
      supabase.from("result_events").select("id, slug, name").order("event_date", { ascending: false, nullsFirst: false }),
      supabase.from("result_documents").select("*").order("sort_order").order("created_at", { ascending: false }),
    ]);
    setEvents((ev as EventOpt[]) ?? []);
    setDocs((dc as DocRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const eventMap = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);

  const filtered = docs.filter((d) => {
    if (filterEvent && d.event_id !== filterEvent) return false;
    if (q) {
      const s = q.toLowerCase();
      const evName = eventMap.get(d.event_id)?.name.toLowerCase() ?? "";
      if (!d.name.toLowerCase().includes(s) && !evName.includes(s)) return false;
    }
    return true;
  });

  const updateDoc = async (id: string, patch: Partial<DocRow>) => {
    const { error } = await supabase.from("result_documents").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Guardado");
    load();
  };

  const deleteDoc = async (row: DocRow) => {
    if (!confirm(`¿Eliminar el documento "${row.name}"? Esta acción no se puede deshacer.`)) return;
    if (row.file_path) {
      await supabase.storage.from("result-documents").remove([row.file_path]);
    }
    const { error } = await supabase.from("result_documents").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Documento eliminado");
    load();
  };

  return (
    <div>
      <ResultadosHubTabs active="pdfs" />

      <section className="mb-6 border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="font-display text-lg uppercase tracking-widest text-gold">PDFs oficiales</h2>
            <p className="text-xs text-muted-foreground">
              Sube y organiza documentos oficiales (clasificaciones, actas, medalleros…) por evento y jornada.
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="font-condensed inline-flex items-center gap-1.5 bg-gold px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
          >
            <Plus className="h-3.5 w-3.5" /> {showForm ? "Cerrar" : "Subir nuevo PDF"}
          </button>
        </div>

        {showForm && (
          <UploadForm events={events} onDone={() => { setShowForm(false); load(); }} />
        )}

        <div className="grid gap-2 border-b border-border px-4 py-3 sm:grid-cols-2">
          <select className="input" value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)}>
            <option value="">Todos los eventos</option>
            {events.map((e) => (<option key={e.id} value={e.id}>{e.name}</option>))}
          </select>
          <input className="input" placeholder="Buscar por nombre o evento…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {loading ? (
          <p className="p-4 text-muted-foreground">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-muted-foreground">No hay documentos aún. Sube tu primer PDF con el botón superior.</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((d) => (
              <DocRowEditor
                key={d.id}
                doc={d}
                events={events}
                onSave={(patch) => updateDoc(d.id, patch)}
                onDelete={() => deleteDoc(d)}
              />
            ))}
          </div>
        )}

        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <FileType2 className="mr-1 inline h-3 w-3 text-gold" />
          Los PDFs se guardan en el bucket <code>result-documents</code>. Solo se muestran en la web pública los estados «Oficial» y «Provisional» marcados como visibles.
        </div>
      </section>
    </div>
  );
}

function UploadForm({ events, onDone }: { events: EventOpt[]; onDone: () => void }) {
  const [eventId, setEventId] = useState("");
  const [name, setName] = useState("");
  const [jornada, setJornada] = useState("");
  const [docType, setDocType] = useState<DocRow["doc_type"]>("clasificacion");
  const [status, setStatus] = useState<DocRow["status"]>("borrador");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return toast.error("Selecciona un evento");
    if (!file) return toast.error("Selecciona un archivo PDF");
    if (!name.trim()) return toast.error("Escribe un nombre para el documento");

    setUploading(true);
    try {
      const ev = events.find((x) => x.id === eventId);
      const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
      const path = `${ev?.slug ?? eventId}/${Date.now()}-${safe}`;
      const up = await supabase.storage.from("result-documents").upload(path, file, {
        contentType: file.type || "application/pdf",
        upsert: false,
      });
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("result-documents").getPublicUrl(path);

      const { error } = await supabase.from("result_documents").insert({
        event_id: eventId,
        name: name.trim(),
        jornada: jornada.trim() || null,
        doc_type: docType,
        status,
        file_url: pub.publicUrl,
        file_path: path,
        file_size: file.size,
        visible: true,
      });
      if (error) throw error;
      toast.success("PDF subido correctamente");
      onDone();
    } catch (err: any) {
      toast.error(err.message ?? "Error subiendo PDF");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 border-b border-border bg-background/40 p-4 sm:grid-cols-2">
      <label className="text-xs">
        <span className="font-condensed mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Evento</span>
        <select className="input" value={eventId} onChange={(e) => setEventId(e.target.value)} required>
          <option value="">— Selecciona —</option>
          {events.map((e) => (<option key={e.id} value={e.id}>{e.name}</option>))}
        </select>
      </label>
      <label className="text-xs">
        <span className="font-condensed mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Nombre del documento</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Clasificación 300m Sub-15" />
      </label>
      <label className="text-xs">
        <span className="font-condensed mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Jornada / Día</span>
        <input className="input" value={jornada} onChange={(e) => setJornada(e.target.value)} placeholder="Ej: Jornada 3 · Día 2" />
      </label>
      <label className="text-xs">
        <span className="font-condensed mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Tipo</span>
        <select className="input" value={docType} onChange={(e) => setDocType(e.target.value as DocRow["doc_type"])}>
          {DOC_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
        </select>
      </label>
      <label className="text-xs">
        <span className="font-condensed mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Estado</span>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as DocRow["status"])}>
          {STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
        </select>
      </label>
      <label className="text-xs">
        <span className="font-condensed mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Archivo PDF</span>
        <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required className="input" />
      </label>
      <div className="sm:col-span-2">
        <button type="submit" disabled={uploading} className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Subiendo…" : "Subir PDF"}
        </button>
      </div>
    </form>
  );
}

function DocRowEditor({
  doc,
  events,
  onSave,
  onDelete,
}: {
  doc: DocRow;
  events: EventOpt[];
  onSave: (patch: Partial<DocRow>) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<DocRow>(doc);
  useEffect(() => setDraft(doc), [doc]);
  const changed = JSON.stringify(draft) !== JSON.stringify(doc);
  const st = STATUSES.find((s) => s.value === draft.status)!;

  return (
    <div className="grid gap-2 p-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]">
      <div className="text-xs">
        <div className="font-condensed mb-1 flex flex-wrap items-center gap-1.5">
          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${st.cls}`}>{st.label}</span>
          {!draft.visible && <span className="bg-muted/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Oculto</span>}
        </div>
        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gold hover:underline">
          <ExternalLink className="h-3 w-3" /> Abrir PDF
        </a>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {new Date(doc.created_at).toLocaleDateString("es-ES")}
          {doc.file_size ? ` · ${(doc.file_size / 1024).toFixed(0)} KB` : ""}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nombre" />
        <input className="input" value={draft.jornada ?? ""} onChange={(e) => setDraft({ ...draft, jornada: e.target.value })} placeholder="Jornada" />
        <select className="input" value={draft.event_id} onChange={(e) => setDraft({ ...draft, event_id: e.target.value })}>
          {events.map((e) => (<option key={e.id} value={e.id}>{e.name}</option>))}
        </select>
        <select className="input" value={draft.doc_type} onChange={(e) => setDraft({ ...draft, doc_type: e.target.value as DocRow["doc_type"] })}>
          {DOC_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
        </select>
        <select className="input" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as DocRow["status"] })}>
          {STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
        </select>
        <input className="input" type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} placeholder="Orden" />
      </div>

      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => onSave({ visible: !draft.visible })}
          className="font-condensed inline-flex items-center gap-1 border border-border px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
        >
          {draft.visible ? <><EyeOff className="h-3 w-3" /> Ocultar</> : <><Eye className="h-3 w-3" /> Mostrar</>}
        </button>
        <button
          onClick={() => onSave({
            name: draft.name,
            jornada: draft.jornada,
            event_id: draft.event_id,
            doc_type: draft.doc_type,
            status: draft.status,
            sort_order: draft.sort_order,
          })}
          disabled={!changed}
          className="font-condensed inline-flex items-center gap-1 bg-gold px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-40"
        >
          <Save className="h-3 w-3" /> Guardar
        </button>
        <button
          onClick={onDelete}
          className="font-condensed inline-flex items-center gap-1 border border-destructive/50 px-2 py-1 text-[10px] uppercase tracking-widest text-destructive hover:bg-destructive hover:text-background"
        >
          <Trash2 className="h-3 w-3" /> Eliminar
        </button>
      </div>
    </div>
  );
}
