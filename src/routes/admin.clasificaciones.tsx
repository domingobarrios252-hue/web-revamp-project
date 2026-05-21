import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, GripVertical, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

export const Route = createFileRoute("/admin/clasificaciones")({
  head: () => ({ meta: [{ title: "Clasificaciones — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminClasificacionesPage,
});

type Group = {
  id: string;
  competition_group: string;
  division_name: string;
  season: string;
  display_order: number;
  visible: boolean;
};

type Row = {
  id: string;
  group_id: string;
  position: number;
  club_name: string;
  club_logo: string | null;
  points: number;
};

function AdminClasificacionesPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [rowsByGroup, setRowsByGroup] = useState<Record<string, Row[]>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const sb = supabase as any;

  async function load() {
    setLoading(true);
    const { data: g } = await sb
      .from("home_standings_groups")
      .select("*")
      .order("display_order", { ascending: true });
    const groups = (g ?? []) as Group[];
    setGroups(groups);
    if (groups.length === 0) {
      setRowsByGroup({});
      setActiveId(null);
      setLoading(false);
      return;
    }
    const { data: r } = await sb
      .from("home_standings_rows")
      .select("*")
      .in("group_id", groups.map((x) => x.id))
      .order("position", { ascending: true });
    const map: Record<string, Row[]> = {};
    groups.forEach((x) => (map[x.id] = []));
    (r ?? []).forEach((row: Row) => map[row.group_id].push(row));
    setRowsByGroup(map);
    setActiveId((prev) => prev ?? groups[0].id);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createGroup() {
    const next = (groups[groups.length - 1]?.display_order ?? 0) + 1;
    const { data, error } = await sb
      .from("home_standings_groups")
      .insert({
        competition_group: "Liga Nacional Absoluta",
        division_name: "Nueva división",
        season: "Temporada 2026",
        display_order: next,
        visible: true,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    toast.success("Clasificación creada");
    await load();
    setActiveId(data.id);
  }

  async function saveGroup(g: Group) {
    const { error } = await sb
      .from("home_standings_groups")
      .update({
        competition_group: g.competition_group,
        division_name: g.division_name,
        season: g.season,
        display_order: g.display_order,
        visible: g.visible,
      })
      .eq("id", g.id);
    if (error) return toast.error(error.message);
    toast.success("Guardado");
  }

  async function deleteGroup(id: string) {
    if (!confirm("¿Eliminar esta clasificación y todas sus filas?")) return;
    const { error } = await sb.from("home_standings_groups").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada");
    if (activeId === id) setActiveId(null);
    await load();
  }

  async function toggleVisible(g: Group) {
    const { error } = await sb
      .from("home_standings_groups")
      .update({ visible: !g.visible })
      .eq("id", g.id);
    if (error) return toast.error(error.message);
    await load();
  }

  async function addRow(group_id: string) {
    const list = rowsByGroup[group_id] ?? [];
    const next = (list[list.length - 1]?.position ?? 0) + 1;
    const { error } = await sb
      .from("home_standings_rows")
      .insert({ group_id, position: next, club_name: "Nuevo club", points: 0 });
    if (error) return toast.error(error.message);
    await load();
  }

  async function saveRow(r: Row) {
    const { error } = await sb
      .from("home_standings_rows")
      .update({
        position: r.position,
        club_name: r.club_name,
        club_logo: r.club_logo,
        points: r.points,
      })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Fila guardada");
  }

  async function deleteRow(id: string) {
    const { error } = await sb.from("home_standings_rows").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await load();
  }

  const active = groups.find((g) => g.id === activeId) ?? null;
  const activeRows = activeId ? rowsByGroup[activeId] ?? [] : [];

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 border-b border-border pb-3">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-widest text-foreground">
            Clasificaciones <span className="text-gold">Liga Nacional</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Editor del módulo de clasificaciones de la portada.
          </p>
        </div>
        <button
          type="button"
          onClick={createGroup}
          className="font-condensed inline-flex items-center gap-2 rounded-md bg-gold px-3 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-light"
        >
          <Plus className="h-4 w-4" /> Nueva clasificación
        </button>
      </header>

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[300px_1fr]">
          {/* Group list */}
          <aside className="space-y-1">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveId(g.id)}
                className={
                  "w-full rounded border px-3 py-2 text-left transition-colors " +
                  (g.id === activeId
                    ? "border-gold bg-background"
                    : "border-border bg-surface hover:border-gold/50")
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-condensed text-[10px] uppercase tracking-widest text-gold">
                    {g.competition_group}
                  </span>
                  <span className="flex items-center gap-1">
                    {!g.visible && <EyeOff className="h-3 w-3 text-muted-foreground" />}
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">#{g.display_order}</span>
                  </span>
                </div>
                <div className="mt-1 text-sm font-bold text-foreground">{g.division_name}</div>
                <div className="text-[11px] text-muted-foreground">{g.season}</div>
              </button>
            ))}
            {groups.length === 0 && (
              <div className="rounded border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                Crea la primera clasificación
              </div>
            )}
          </aside>

          {/* Active group editor */}
          {active ? (
            <section className="space-y-5">
              <GroupEditor
                key={active.id}
                group={active}
                onSave={saveGroup}
                onDelete={() => deleteGroup(active.id)}
                onToggle={() => toggleVisible(active)}
              />

              <div className="rounded border border-border bg-surface p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-sm uppercase tracking-widest text-foreground">
                    Tabla de clasificación
                  </h3>
                  <button
                    type="button"
                    onClick={() => addRow(active.id)}
                    className="font-condensed inline-flex items-center gap-1 rounded bg-background px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-gold hover:bg-black"
                  >
                    <Plus className="h-3 w-3" /> Fila
                  </button>
                </div>
                <div className="space-y-2">
                  {activeRows.length === 0 && (
                    <div className="rounded border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      Añade clubes a la tabla. Se mostrarán los 5 primeros.
                    </div>
                  )}
                  {activeRows.map((r) => (
                    <RowEditor key={r.id} row={r} onSave={saveRow} onDelete={() => deleteRow(r.id)} />
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <div className="rounded border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Selecciona una clasificación o crea una nueva.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GroupEditor({
  group,
  onSave,
  onDelete,
  onToggle,
}: {
  group: Group;
  onSave: (g: Group) => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const [draft, setDraft] = useState<Group>(group);
  useEffect(() => setDraft(group), [group]);
  const upd = <K extends keyof Group>(k: K, v: Group[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="rounded border border-border bg-surface p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Competición">
          <select
            value={draft.competition_group}
            onChange={(e) => upd("competition_group", e.target.value)}
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
          >
            <option>Liga Nacional Absoluta</option>
            <option>Liga Nacional Sub15</option>
          </select>
        </Field>
        <Field label="División / Categoría">
          <input
            value={draft.division_name}
            onChange={(e) => upd("division_name", e.target.value)}
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
          />
        </Field>
        <Field label="Temporada">
          <input
            value={draft.season}
            onChange={(e) => upd("season", e.target.value)}
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
          />
        </Field>
        <Field label="Orden">
          <input
            type="number"
            value={draft.display_order}
            onChange={(e) => upd("display_order", Number(e.target.value))}
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
          />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="font-condensed inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1.5 text-[11px] font-bold uppercase tracking-widest text-foreground hover:border-gold"
        >
          {group.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {group.visible ? "Visible" : "Oculta"}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="font-condensed inline-flex items-center gap-1 rounded border border-destructive/40 bg-background px-2 py-1.5 text-[11px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" /> Eliminar
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="font-condensed inline-flex items-center gap-1 rounded bg-gold px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-background hover:bg-gold-light"
          >
            <Save className="h-3 w-3" /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function RowEditor({
  row,
  onSave,
  onDelete,
}: {
  row: Row;
  onSave: (r: Row) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<Row>(row);
  useEffect(() => setDraft(row), [row]);
  const upd = <K extends keyof Row>(k: K, v: Row[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="grid gap-2 rounded border border-border bg-background p-3 md:grid-cols-[60px_1fr_1fr_80px_auto]">
      <input
        type="number"
        value={draft.position}
        onChange={(e) => upd("position", Number(e.target.value))}
        className="rounded border border-border bg-surface px-2 py-1.5 text-sm"
        placeholder="Pos"
      />
      <input
        value={draft.club_name}
        onChange={(e) => upd("club_name", e.target.value)}
        className="rounded border border-border bg-surface px-2 py-1.5 text-sm"
        placeholder="Club"
      />
      <ImageUploadField
        value={draft.club_logo ?? ""}
        onChange={(url) => upd("club_logo", url)}
        folder="standings"
        nameHint={draft.club_name}
        previewClassName="mt-1 h-8 w-8 object-contain bg-black/30 rounded"
        placeholder="Logo URL o subir"
      />
      <input
        type="number"
        step="0.1"
        value={draft.points}
        onChange={(e) => upd("points", Number(e.target.value))}
        className="rounded border border-border bg-surface px-2 py-1.5 text-sm"
        placeholder="Pts"
      />
      <div className="flex items-start gap-1">
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="rounded bg-gold px-2 py-1.5 text-xs font-bold text-background hover:bg-gold-light"
          title="Guardar"
        >
          <Save className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded border border-destructive/40 px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10"
          title="Eliminar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
