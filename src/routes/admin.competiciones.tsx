import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

type Region = { id: string; name: string };
type Skater = { id: string; full_name: string };
type Comp = {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  scope: string;
  region_id: string | null;
  description: string | null;
  regions: { name: string } | null;
};
type Result = {
  id: string;
  skater_id: string;
  competition_id: string;
  event_name: string;
  category: string | null;
  position: number | null;
  points: number;
  result_time: string | null;
  notes: string | null;
  skaters: { full_name: string } | null;
};

const compSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9-]+$/),
  start_date: z.string().min(8),
  end_date: z.string().optional().or(z.literal("")),
  location: z.string().trim().max(160).optional(),
  scope: z.enum(["Nacional", "Autonómico", "Internacional"]),
  region_id: z.string().uuid().optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional(),
});

const resSchema = z.object({
  skater_id: z.string().uuid(),
  event_name: z.string().trim().min(2).max(120),
  category: z.string().trim().max(60).optional(),
  position: z.number().int().min(1).max(9999).optional(),
  points: z.number().min(0).max(100000),
  result_time: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(500).optional(),
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const Route = createFileRoute("/admin/competiciones")({
  head: () => ({
    meta: [{ title: "Admin · Competiciones" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminComps,
});

function AdminComps() {
  const [items, setItems] = useState<Comp[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [skaters, setSkaters] = useState<Skater[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Comp | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, Result[]>>({});

  const load = async () => {
    setLoading(true);
    const [c, r, s] = await Promise.all([
      supabase
        .from("competitions")
        .select("id, name, slug, start_date, end_date, location, scope, region_id, description, regions(name)")
        .order("start_date", { ascending: false }),
      supabase.from("regions").select("id, name").order("sort_order"),
      supabase.from("skaters").select("id, full_name").eq("active", true).order("full_name"),
    ]);
    setItems((c.data as unknown as Comp[]) ?? []);
    setRegions((r.data as unknown as Region[]) ?? []);
    setSkaters((s.data as unknown as Skater[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const loadResults = async (compId: string) => {
    const { data } = await supabase
      .from("competition_results")
      .select(
        "id, skater_id, competition_id, event_name, category, position, points, result_time, notes, skaters(full_name)"
      )
      .eq("competition_id", compId)
      .order("event_name");
    setResults((prev) => ({ ...prev, [compId]: (data as unknown as Result[]) ?? [] }));
  };

  const toggleExpand = (id: string) => {
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
      if (!results[id]) loadResults(id);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar competición? También se eliminan los resultados.")) return;
    const { error } = await supabase.from("competitions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Competición eliminada");
    load();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest">Competiciones</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Nueva
        </button>
      </div>

      {showForm && (
        <CompForm
          initial={editing}
          regions={regions}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Aún no hay competiciones.</p>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className="border border-border bg-surface">
              <div className="flex items-center justify-between gap-3 p-3">
                <button
                  onClick={() => toggleExpand(c.id)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  {expanded === c.id ? (
                    <ChevronDown className="h-4 w-4 text-gold" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <div className="font-display text-sm uppercase tracking-wider">{c.name}</div>
                    <div className="font-condensed text-[11px] uppercase text-muted-foreground">
                      {new Date(c.start_date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {c.location && ` · ${c.location}`} · {c.scope}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditing(c);
                      setShowForm(true);
                    }}
                    className="text-muted-foreground hover:text-gold"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {expanded === c.id && (
                <ResultsManager
                  competitionId={c.id}
                  skaters={skaters}
                  results={results[c.id] ?? []}
                  reload={() => loadResults(c.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompForm({
  initial,
  regions,
  onClose,
  onSaved,
}: {
  initial: Comp | null;
  regions: Region[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [start_date, setStart] = useState(initial?.start_date ?? "");
  const [end_date, setEnd] = useState(initial?.end_date ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [scope, setScope] = useState<"Nacional" | "Autonómico" | "Internacional">(
    (initial?.scope as "Nacional" | "Autonómico" | "Internacional") ?? "Nacional"
  );
  const [region_id, setRegionId] = useState(initial?.region_id ?? "");
  const [description, setDesc] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const parsed = compSchema.safeParse({
      name,
      slug,
      start_date,
      end_date: end_date || undefined,
      location: location || undefined,
      scope,
      region_id: region_id || undefined,
      description: description || undefined,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");
    setSaving(true);
    const payload = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date || null,
      location: parsed.data.location ?? null,
      scope: parsed.data.scope,
      region_id: parsed.data.region_id || null,
      description: parsed.data.description ?? null,
    };
    const { error } = initial
      ? await supabase.from("competitions").update(payload).eq("id", initial.id)
      : await supabase.from("competitions").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Competición actualizada" : "Competición creada");
    onSaved();
  };

  return (
    <div className="mb-6 border border-gold bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg tracking-widest text-gold">
          {initial ? "Editar competición" : "Nueva competición"}
        </h2>
        <button onClick={onClose} className="text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nombre *">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => !slug && setSlug(slugify(name))}
            className="input"
          />
        </Field>
        <Field label="Slug *">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input" />
        </Field>
        <Field label="Fecha inicio *">
          <input
            type="date"
            value={start_date}
            onChange={(e) => setStart(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Fecha fin">
          <input
            type="date"
            value={end_date}
            onChange={(e) => setEnd(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Lugar">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Ámbito *">
          <select
            value={scope}
            onChange={(e) =>
              setScope(e.target.value as "Nacional" | "Autonómico" | "Internacional")
            }
            className="input"
          >
            <option>Nacional</option>
            <option>Autonómico</option>
            <option>Internacional</option>
          </select>
        </Field>
        <Field label="Comunidad / región">
          <select
            value={region_id}
            onChange={(e) => setRegionId(e.target.value)}
            className="input"
          >
            <option value="">—</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="md:col-span-2">
          <Field label="Descripción">
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="input"
            />
          </Field>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
        >
          {saving ? "Guardando…" : initial ? "Guardar" : "Crear"}
        </button>
        <button
          onClick={onClose}
          className="font-condensed border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function ResultsManager({
  competitionId,
  skaters,
  results,
  reload,
}: {
  competitionId: string;
  skaters: Skater[];
  results: Result[];
  reload: () => void;
}) {
  const [skater_id, setSkaterId] = useState("");
  const [event_name, setEvent] = useState("");
  const [category, setCategory] = useState("");
  const [position, setPosition] = useState("");
  const [points, setPoints] = useState("0");
  const [result_time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);

  const onAdd = async () => {
    const parsed = resSchema.safeParse({
      skater_id,
      event_name,
      category: category || undefined,
      position: position ? Number(position) : undefined,
      points: Number(points),
      result_time: result_time || undefined,
      notes: notes || undefined,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");
    setAdding(true);
    const { error } = await supabase.from("competition_results").insert({
      competition_id: competitionId,
      skater_id: parsed.data.skater_id,
      event_name: parsed.data.event_name,
      category: parsed.data.category ?? null,
      position: parsed.data.position ?? null,
      points: parsed.data.points,
      result_time: parsed.data.result_time ?? null,
      notes: parsed.data.notes ?? null,
    });
    setAdding(false);
    if (error) return toast.error(error.message);
    toast.success("Resultado añadido");
    setSkaterId("");
    setEvent("");
    setCategory("");
    setPosition("");
    setPoints("0");
    setTime("");
    setNotes("");
    reload();
  };

  const onDel = async (id: string) => {
    if (!confirm("¿Eliminar resultado?")) return;
    const { error } = await supabase.from("competition_results").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    reload();
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <h3 className="font-display mb-3 text-sm tracking-widest text-gold">
        Resultados ({results.length})
      </h3>

      {/* Tabla */}
      {results.length > 0 && (
        <div className="mb-4 overflow-x-auto border border-border">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-surface">
              <tr className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-2 py-2 text-left">Patinador</th>
                <th className="px-2 py-2 text-left">Prueba</th>
                <th className="px-2 py-2 text-left">Cat.</th>
                <th className="px-2 py-2 text-center">Pos</th>
                <th className="px-2 py-2 text-left">Tiempo</th>
                <th className="px-2 py-2 text-right">Pts</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="px-2 py-2">{r.skaters?.full_name}</td>
                  <td className="px-2 py-2">{r.event_name}</td>
                  <td className="px-2 py-2">{r.category ?? "—"}</td>
                  <td className="px-2 py-2 text-center">{r.position ?? "—"}</td>
                  <td className="px-2 py-2 font-mono">{r.result_time ?? "—"}</td>
                  <td className="px-2 py-2 text-right font-display text-gold">{r.points}</td>
                  <td className="px-2 py-2 text-right">
                    <button
                      onClick={() => onDel(r.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form rápido */}
      <div className="border border-border bg-surface p-3">
        <div className="font-condensed mb-2 text-[11px] uppercase tracking-widest text-gold">
          Añadir resultado
        </div>
        <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-7">
          <select
            value={skater_id}
            onChange={(e) => setSkaterId(e.target.value)}
            className="input lg:col-span-2"
          >
            <option value="">— Patinador —</option>
            {skaters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
          <input
            value={event_name}
            onChange={(e) => setEvent(e.target.value)}
            placeholder="Prueba (300m CR)"
            className="input lg:col-span-2"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Cat."
            className="input"
          />
          <input
            type="number"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Pos"
            className="input"
          />
          <input
            value={result_time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="Tiempo"
            className="input"
          />
          <input
            type="number"
            step="0.01"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="Pts"
            className="input"
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas"
            className="input lg:col-span-2"
          />
        </div>
        <button
          onClick={onAdd}
          disabled={adding || !skater_id}
          className="font-condensed mt-3 inline-flex items-center gap-1 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> {adding ? "Añadiendo…" : "Añadir"}
        </button>
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
