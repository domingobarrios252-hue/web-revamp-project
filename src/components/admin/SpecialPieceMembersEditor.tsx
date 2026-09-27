import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  GripVertical,
  Pencil,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  parseFeatureData,
  type FeatureData,
  type MemberResult,
  type PieceMember,
} from "@/lib/specials/pieceMembers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const input = "w-full border border-border bg-surface px-3 py-2 text-sm";
const label = "font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground";
const btn =
  "font-condensed inline-flex items-center gap-1 border border-border px-3 py-2 text-[11px] uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold";

type Tab = "resumen" | "patinadores" | "cierre";

export function SpecialPieceMembersEditor({ pieceId, nameHint }: { pieceId: string; nameHint: string }) {
  const [tab, setTab] = useState<Tab>("patinadores");
  return (
    <div className="border border-gold/40 bg-surface/40 p-3">
      <div className="mb-3 flex flex-wrap gap-1">
        {(
          [
            ["resumen", "Resumen"],
            ["patinadores", "Patinadores"],
            ["cierre", "Cierre"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={
              "font-condensed px-3 py-2 text-[11px] font-bold uppercase tracking-widest " +
              (tab === k ? "bg-gold text-background" : "border border-border text-muted-foreground")
            }
          >
            {l}
          </button>
        ))}
      </div>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Estos bloques se guardan al momento con su propio botón. Solo aparecen en la página si tienen
        contenido.
      </p>
      {tab === "patinadores" ? (
        <MembersTab pieceId={pieceId} nameHint={nameHint} />
      ) : (
        <FeatureTab pieceId={pieceId} nameHint={nameHint} part={tab} />
      )}
    </div>
  );
}

/* ---------------- Resumen / Cierre ---------------- */

function FeatureTab({ pieceId, nameHint, part }: { pieceId: string; nameHint: string; part: "resumen" | "cierre" }) {
  const [data, setData] = useState<FeatureData | null>(null);
  useEffect(() => {
    db.from("special_pieces")
      .select("feature_data")
      .eq("id", pieceId)
      .maybeSingle()
      .then(({ data: d }: { data: { feature_data: unknown } | null }) => setData(parseFeatureData(d?.feature_data)));
  }, [pieceId]);

  if (!data) return <p className="text-xs text-muted-foreground">Cargando…</p>;

  const save = async () => {
    const { error } = await db.from("special_pieces").update({ feature_data: data }).eq("id", pieceId);
    if (error) return toast.error(error.message);
    toast.success("Guardado");
  };

  if (part === "resumen") {
    const s = data.summary ?? {};
    const set = (k: keyof NonNullable<FeatureData["summary"]>, v: string) =>
      setData({ ...data, summary: { ...s, [k]: v } });
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Número de patinadores</label>
            <input className={input} value={s.total ?? ""} onChange={(e) => set("total", e.target.value)} />
          </div>
          <div>
            <label className={label}>Categorías representadas</label>
            <input className={input} value={s.categories ?? ""} onChange={(e) => set("categories", e.target.value)} />
          </div>
          <div>
            <label className={label}>Sede</label>
            <input className={input} value={s.venue ?? ""} onChange={(e) => set("venue", e.target.value)} />
          </div>
          <div>
            <label className={label}>Competición</label>
            <input className={input} value={s.competition ?? ""} onChange={(e) => set("competition", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={label}>Lista Júnior (un nombre por línea)</label>
          <textarea rows={4} className={input} value={s.junior ?? ""} onChange={(e) => set("junior", e.target.value)} />
        </div>
        <div>
          <label className={label}>Lista Sénior (un nombre por línea)</label>
          <textarea rows={4} className={input} value={s.senior ?? ""} onChange={(e) => set("senior", e.target.value)} />
        </div>
        <button type="button" onClick={save} className="font-condensed bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background">
          Guardar resumen
        </button>
      </div>
    );
  }

  const c = data.closing ?? {};
  const setC = (k: keyof NonNullable<FeatureData["closing"]>, v: string) =>
    setData({ ...data, closing: { ...c, [k]: v } });
  return (
    <div className="space-y-3">
      <div>
        <label className={label}>Título</label>
        <input className={input} value={c.title ?? ""} placeholder="Un equipo con ambición" onChange={(e) => setC("title", e.target.value)} />
      </div>
      <div>
        <label className={label}>Texto</label>
        <textarea rows={5} className={input} value={c.text ?? ""} onChange={(e) => setC("text", e.target.value)} />
      </div>
      <div>
        <label className={label}>Imagen de equipo (opcional)</label>
        <ImageUploadField
          value={c.image_url ?? ""}
          onChange={(url) => setData((d) => ({ ...(d ?? {}), closing: { ...((d ?? {}).closing ?? {}), image_url: url } }))}
          folder="specials"
          nameHint={nameHint + "-equipo"}
          previewClassName="mt-2 h-24 w-40 object-cover rounded"
        />
      </div>
      <button type="button" onClick={save} className="font-condensed bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background">
        Guardar cierre
      </button>
    </div>
  );
}

/* ---------------- Patinadores ---------------- */

const emptyMember = (pieceId: string, sort: number) => ({
  piece_id: pieceId,
  first_name: "",
  last_name: "",
  category: "",
  club: "",
  specialty: "",
  image_url: "",
  alt_image_url: "",
  country_code: "es",
  sort_order: sort,
  published: false,
  bio: "",
  button_label: "",
  link_url: "",
});

function MembersTab({ pieceId, nameHint }: { pieceId: string; nameHint: string }) {
  const [items, setItems] = useState<PieceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PieceMember | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = async () => {
    setLoading(true);
    const { data, error } = await db
      .from("special_piece_members")
      .select("*")
      .eq("piece_id", pieceId)
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setItems((data ?? []) as PieceMember[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieceId]);

  const create = async () => {
    const sort = (items[items.length - 1]?.sort_order ?? 0) + 10;
    const { data, error } = await db
      .from("special_piece_members")
      .insert({ ...emptyMember(pieceId, sort), first_name: "Nuevo patinador" })
      .select("*")
      .single();
    if (error) return toast.error(error.message);
    await load();
    setEditing(data as PieceMember);
  };

  const duplicate = async (m: PieceMember) => {
    const { id: _id, results: _r, ...rest } = m;
    void _id;
    void _r;
    const { data, error } = await db
      .from("special_piece_members")
      .insert({ ...rest, first_name: `${m.first_name} (copia)`, published: false, sort_order: m.sort_order + 1 })
      .select("id")
      .single();
    if (error) return toast.error(error.message);
    const { data: res } = await db.from("special_piece_member_results").select("*").eq("member_id", m.id);
    if (res?.length) {
      await db.from("special_piece_member_results").insert(
        (res as MemberResult[]).map(({ id: _x, ...r }) => ({ ...r, member_id: data.id })),
      );
    }
    toast.success("Ficha duplicada (oculta)");
    load();
  };

  const toggle = async (m: PieceMember) => {
    const { error } = await db.from("special_piece_members").update({ published: !m.published }).eq("id", m.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (m: PieceMember) => {
    if (!confirm(`¿Eliminar la ficha de ${m.first_name} ${m.last_name} y sus resultados?`)) return;
    const { error } = await db.from("special_piece_members").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    load();
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const next = arrayMove(
      items,
      items.findIndex((i) => i.id === active.id),
      items.findIndex((i) => i.id === over.id),
    ).map((m, i) => ({ ...m, sort_order: (i + 1) * 10 }));
    setItems(next);
    const results = await Promise.all(
      next.map((m) => db.from("special_piece_members").update({ sort_order: m.sort_order }).eq("id", m.id)),
    );
    if (results.some((r: { error: unknown }) => r.error)) toast.error("No se pudo guardar el orden");
  };

  if (editing) {
    return (
      <MemberForm
        member={editing}
        nameHint={nameHint}
        onClose={() => {
          setEditing(null);
          load();
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={create} className="font-condensed inline-flex items-center gap-1 bg-gold px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-background">
        <Plus className="h-3.5 w-3.5" /> Crear patinador
      </button>
      {loading ? (
        <p className="text-xs text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Todavía no hay patinadores. Mientras la lista esté vacía, la página pública se muestra como hasta ahora.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {items.map((m) => (
                <MemberRow
                  key={m.id}
                  m={m}
                  onEdit={() => setEditing(m)}
                  onDuplicate={() => duplicate(m)}
                  onToggle={() => toggle(m)}
                  onDelete={() => remove(m)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function MemberRow({
  m,
  onEdit,
  onDuplicate,
  onToggle,
  onDelete,
}: {
  m: PieceMember;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: m.id });
  const iconBtn = "flex h-9 w-9 items-center justify-center border border-border text-muted-foreground hover:text-gold";
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-2 border border-border bg-background p-2"
    >
      <button type="button" {...attributes} {...listeners} className="cursor-grab text-muted-foreground" aria-label="Arrastrar">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="h-12 w-10 shrink-0 overflow-hidden bg-surface">
        {m.image_url && <img src={m.image_url} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">
          {m.first_name} {m.last_name}
        </div>
        <div className="truncate text-[11px] text-muted-foreground">
          {[m.category, m.club].filter(Boolean).join(" · ")} {m.published ? "" : "· Oculto"}
        </div>
      </div>
      <button type="button" className={iconBtn} onClick={onEdit} aria-label="Editar"><Pencil className="h-4 w-4" /></button>
      <button type="button" className={iconBtn} onClick={onDuplicate} aria-label="Duplicar"><Copy className="h-4 w-4" /></button>
      <button type="button" className={iconBtn} onClick={onToggle} aria-label={m.published ? "Ocultar" : "Publicar"}>
        {m.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <button type="button" className={iconBtn} onClick={onDelete} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
    </li>
  );
}

function MemberForm({ member, nameHint, onClose }: { member: PieceMember; nameHint: string; onClose: () => void }) {
  const [f, setF] = useState<PieceMember>({ ...member });
  const [results, setResults] = useState<MemberResult[]>([]);
  const hint = `${nameHint}-${f.first_name}-${f.last_name}`;

  useEffect(() => {
    db.from("special_piece_member_results")
      .select("*")
      .eq("member_id", member.id)
      .order("sort_order", { ascending: true })
      .then(({ data }: { data: MemberResult[] | null }) => setResults(data ?? []));
  }, [member.id]);

  const txt = (k: keyof PieceMember) => ({
    value: (f[k] as string | null) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value }),
    className: input,
  });

  const save = async () => {
    const { id, results: _r, ...rest } = f;
    void _r;
    const { error } = await db.from("special_piece_members").update(rest).eq("id", id);
    if (error) return toast.error(error.message);
    // Resultados: borrar eliminados, upsert el resto con su orden
    const { data: existing } = await db.from("special_piece_member_results").select("id").eq("member_id", id);
    const keep = new Set(results.filter((r) => !r.id.startsWith("new-")).map((r) => r.id));
    const toDelete = ((existing ?? []) as { id: string }[]).map((r) => r.id).filter((x) => !keep.has(x));
    if (toDelete.length) await db.from("special_piece_member_results").delete().in("id", toDelete);
    for (const [i, r] of results.entries()) {
      const row = {
        member_id: id,
        competition: r.competition,
        event_name: r.event_name || null,
        result: r.result || null,
        medal: r.medal || null,
        result_date: r.result_date || null,
        sort_order: (i + 1) * 10,
      };
      const q = r.id.startsWith("new-")
        ? db.from("special_piece_member_results").insert(row)
        : db.from("special_piece_member_results").update(row).eq("id", r.id);
      const { error: e2 } = await q;
      if (e2) return toast.error(e2.message);
    }
    toast.success("Ficha guardada");
    onClose();
  };

  const setR = (i: number, patch: Partial<MemberResult>) =>
    setResults((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, d: number) =>
    setResults((rs) => {
      const j = i + d;
      if (j < 0 || j >= rs.length) return rs;
      return arrayMove(rs, i, j);
    });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base uppercase tracking-widest">Editar ficha</h3>
        <button type="button" onClick={onClose} aria-label="Volver"><X className="h-5 w-5" /></button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className={label}>Nombre visible (opcional)</label><input {...txt("display_name")} placeholder="Ej.: CHEVI GUZMÁN — si está vacío se usa el nombre completo" /></div>
        <div><label className={label}>Nombre</label><input {...txt("first_name")} /></div>
        <div><label className={label}>Apellidos</label><input {...txt("last_name")} /></div>
        <div><label className={label}>Categoría</label><input {...txt("category")} placeholder="Júnior / Sénior" /></div>
        <div><label className={label}>Club</label><input {...txt("club")} /></div>
        <div><label className={label}>Especialidad</label><input {...txt("specialty")} /></div>
        <div><label className={label}>País (código de 2 letras)</label><input {...txt("country_code")} placeholder="es" maxLength={2} /></div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>Imagen / cromo principal</label>
          <ImageUploadField value={f.image_url ?? ""} onChange={(url) => setF((x) => ({ ...x, image_url: url }))} folder="specials" nameHint={hint} previewClassName="mt-2 h-32 w-24 object-cover rounded" />
        </div>
        <div>
          <label className={label}>Imagen alternativa (opcional)</label>
          <ImageUploadField value={f.alt_image_url ?? ""} onChange={(url) => setF((x) => ({ ...x, alt_image_url: url }))} folder="specials" nameHint={hint + "-alt"} previewClassName="mt-2 h-32 w-24 object-cover rounded" />
        </div>
      </div>
      <div><label className={label}>Texto editorial breve</label><textarea rows={3} {...txt("bio")} /></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><label className={label}>Texto del botón (opcional)</label><input {...txt("button_label")} /></div>
        <div><label className={label}>Enlace (opcional)</label><input {...txt("link_url")} placeholder="https://… o /hub/es/patinadores/…" /></div>
      </div>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />
        <span className="font-condensed uppercase tracking-widest text-muted-foreground">Publicado</span>
      </label>

      <div className="border-t border-border pt-3">
        <div className="mb-2 flex items-center justify-between">
          <span className={label}>Resultados 2026</span>
          <button
            type="button"
            className={btn}
            onClick={() =>
              setResults((rs) => [
                ...rs,
                { id: `new-${Date.now()}`, member_id: member.id, competition: "", event_name: "", result: "", medal: null, result_date: null, sort_order: 0 },
              ])
            }
          >
            <Plus className="h-3.5 w-3.5" /> Añadir resultado
          </button>
        </div>
        {results.length === 0 && <p className="text-[11px] text-muted-foreground">Sin resultados.</p>}
        <ul className="space-y-2">
          {results.map((r, i) => (
            <li key={r.id} className="grid grid-cols-2 gap-2 border border-border bg-background p-2 sm:grid-cols-6">
              <input className={input + " col-span-2"} placeholder="Competición" value={r.competition} onChange={(e) => setR(i, { competition: e.target.value })} />
              <input className={input} placeholder="Prueba" value={r.event_name ?? ""} onChange={(e) => setR(i, { event_name: e.target.value })} />
              <input className={input} placeholder="Resultado" value={r.result ?? ""} onChange={(e) => setR(i, { result: e.target.value })} />
              <select className={input} value={r.medal ?? ""} onChange={(e) => setR(i, { medal: (e.target.value || null) as MemberResult["medal"] })}>
                <option value="">Sin medalla</option>
                <option value="oro">Oro</option>
                <option value="plata">Plata</option>
                <option value="bronce">Bronce</option>
              </select>
              <input type="date" className={input} value={r.result_date ?? ""} onChange={(e) => setR(i, { result_date: e.target.value || null })} />
              <div className="col-span-2 flex justify-end gap-1 sm:col-span-6">
                <button type="button" className={btn} onClick={() => move(i, -1)} aria-label="Subir"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" className={btn} onClick={() => move(i, 1)} aria-label="Bajar"><ArrowDown className="h-3.5 w-3.5" /></button>
                <button type="button" className={btn} onClick={() => setResults((rs) => rs.filter((_, j) => j !== i))} aria-label="Eliminar resultado"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className={btn}>Cancelar</button>
        <button type="button" onClick={save} className="font-condensed bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background">Guardar ficha</button>
      </div>
    </div>
  );
}
