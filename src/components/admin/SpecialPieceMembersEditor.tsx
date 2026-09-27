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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h3 className="font-display truncate text-base uppercase tracking-widest">Patinadores</h3>
          <p className="mt-1 text-xs text-muted-foreground">Arrastra las fichas para cambiar su orden.</p>
        </div>
        <Button type="button" onClick={create} className="min-h-11 bg-gold font-condensed text-xs font-bold uppercase tracking-widest text-background hover:bg-gold/90">
          <Plus /> Añadir patinador
        </Button>
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Todavía no hay patinadores. Mientras la lista esté vacía, la página pública se muestra como hasta ahora.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
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
      <Sheet
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            load();
          }
        }}
      >
        <SheetContent side="right" className="flex h-dvh w-[96vw] max-w-none flex-col gap-0 overflow-hidden border-gold/30 p-0 sm:w-[min(92vw,980px)] sm:max-w-none">
          {editing && (
            <MemberForm
              member={editing}
              nameHint={nameHint}
              onClose={() => {
                setEditing(null);
                load();
              }}
            />
          )}
        </SheetContent>
      </Sheet>
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
  const actionClass = "min-h-11 justify-start px-3 font-condensed text-[11px] uppercase tracking-wider";
  const fullName = `${m.first_name} ${m.last_name}`.trim();
  const mainName = m.display_name?.trim() || fullName || "Sin nombre";
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="grid min-w-0 grid-cols-[auto_4.5rem_minmax(0,1fr)] gap-3 border border-border bg-background p-3"
    >
      <Button type="button" variant="ghost" size="icon" {...attributes} {...listeners} className="h-11 w-8 cursor-grab self-center text-muted-foreground" aria-label="Arrastrar patinador">
        <GripVertical className="h-4 w-4" />
      </Button>
      <div className="aspect-[4/5] w-[4.5rem] shrink-0 overflow-hidden bg-surface">
        {m.image_url ? <img src={m.image_url} alt="" className="h-full w-full object-cover object-top" /> : <div className="grid h-full place-items-center font-display text-xl text-gold/40">{mainName.charAt(0)}</div>}
      </div>
      <div className="min-w-0 self-center">
        <div className="truncate text-sm font-semibold">{mainName}</div>
        {m.display_name?.trim() && <div className="truncate text-[11px] text-muted-foreground">{fullName}</div>}
        <div className="mt-1 truncate text-[11px] text-muted-foreground">
          {[m.category, m.club].filter(Boolean).join(" · ") || "Sin categoría ni club"}
        </div>
        <span className={"mt-2 inline-flex border px-2 py-0.5 font-condensed text-[10px] uppercase tracking-widest " + (m.published ? "border-gold/50 text-gold" : "border-border text-muted-foreground")}>
          {m.published ? "Publicado" : "Oculto"}
        </span>
      </div>
      <div className="col-span-3 grid grid-cols-2 gap-2 border-t border-border pt-3 sm:grid-cols-4">
        <Button type="button" variant="outline" className={actionClass} onClick={onEdit}><Pencil /> Editar</Button>
        <Button type="button" variant="outline" className={actionClass} onClick={onDuplicate}><Copy /> Duplicar</Button>
        <Button type="button" variant="outline" className={actionClass} onClick={onToggle}>
          {m.published ? <EyeOff /> : <Eye />} {m.published ? "Ocultar" : "Publicar"}
        </Button>
        <Button type="button" variant="outline" className={actionClass + " hover:text-destructive"} onClick={onDelete}><Trash2 /> Eliminar</Button>
      </div>
    </li>
  );
}

function MemberForm({ member, nameHint, onClose }: { member: PieceMember; nameHint: string; onClose: () => void }) {
  const [f, setF] = useState<PieceMember>({ ...member });
  const [results, setResults] = useState<MemberResult[]>([]);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
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
    setSaving(true);
    const { id, results: _r, ...rest } = f;
    void _r;
    const { error } = await db.from("special_piece_members").update(rest).eq("id", id);
    if (error) {
      setSaving(false);
      return toast.error(error.message);
    }
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
      if (e2) {
        setSaving(false);
        return toast.error(e2.message);
      }
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
    <>
      <SheetHeader className="shrink-0 border-b border-border px-4 py-4 pr-14 text-left sm:px-6">
        <SheetTitle className="font-display text-lg uppercase tracking-widest">Editar patinador</SheetTitle>
        <SheetDescription className="truncate">{f.display_name?.trim() || `${f.first_name} ${f.last_name}`.trim()}</SheetDescription>
      </SheetHeader>
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
      {preview && <MemberPreview member={f} results={results} />}
      <FormSection title="Datos básicos">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className={label}>Nombre visible (opcional)</label><input {...txt("display_name")} placeholder="Ej.: CHEVI GUZMÁN — si está vacío se usa el nombre completo" /></div>
        <div><label className={label}>Nombre</label><input {...txt("first_name")} /></div>
        <div><label className={label}>Apellidos</label><input {...txt("last_name")} /></div>
        <div><label className={label}>Categoría</label><input {...txt("category")} placeholder="Júnior / Sénior" /></div>
        <div><label className={label}>Club</label><input {...txt("club")} /></div>
        <div><label className={label}>Especialidad</label><input {...txt("specialty")} /></div>
        <div><label className={label}>País (código de 2 letras)</label><input {...txt("country_code")} placeholder="es" maxLength={2} /></div>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-xs">
        <input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />
        <span className="font-condensed uppercase tracking-widest text-muted-foreground">Publicado</span>
      </label>
      </FormSection>
      <FormSection title="Imágenes">
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
      </FormSection>
      <FormSection title="Texto editorial">
        <div><label className={label}>Texto editorial breve</label><textarea rows={5} {...txt("bio")} /></div>
      </FormSection>
      <FormSection title="Botón y enlace">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><label className={label}>Texto del botón (opcional)</label><input {...txt("button_label")} /></div>
        <div><label className={label}>Enlace (opcional)</label><input {...txt("link_url")} placeholder="https://… o /hub/es/patinadores/…" /></div>
      </div>
      </FormSection>

      <FormSection title="Resultados 2026">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{results.length} resultados</span>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 font-condensed text-[11px] uppercase tracking-widest"
            onClick={() =>
              setResults((rs) => [
                ...rs,
                { id: `new-${Date.now()}`, member_id: member.id, competition: "", event_name: "", result: "", medal: null, result_date: null, sort_order: 0 },
              ])
            }
          >
            <Plus className="h-3.5 w-3.5" /> Añadir resultado
          </Button>
        </div>
        {results.length === 0 && <p className="text-[11px] text-muted-foreground">Sin resultados.</p>}
        {results.length > 0 && <div className="mb-1 hidden grid-cols-[2fr_1.35fr_1fr_1fr_1.15fr_auto] gap-2 px-2 sm:grid">
          {['Competición', 'Prueba', 'Resultado', 'Medalla', 'Fecha', 'Orden'].map((heading) => <span key={heading} className={label}>{heading}</span>)}
        </div>}
        <ul className="space-y-2">
          {results.map((r, i) => (
            <li key={r.id} className="grid grid-cols-1 gap-2 border border-border bg-background p-3 sm:grid-cols-[2fr_1.35fr_1fr_1fr_1.15fr_auto] sm:items-end sm:p-2">
              <ResultField labelText="Competición"><input className={input} placeholder="Competición" value={r.competition} onChange={(e) => setR(i, { competition: e.target.value })} /></ResultField>
              <ResultField labelText="Prueba"><input className={input} placeholder="Prueba" value={r.event_name ?? ""} onChange={(e) => setR(i, { event_name: e.target.value })} /></ResultField>
              <ResultField labelText="Resultado"><input className={input} placeholder="Resultado" value={r.result ?? ""} onChange={(e) => setR(i, { result: e.target.value })} /></ResultField>
              <ResultField labelText="Medalla"><select className={input} value={r.medal ?? ""} onChange={(e) => setR(i, { medal: (e.target.value || null) as MemberResult["medal"] })}>
                <option value="">Sin medalla</option>
                <option value="oro">Oro</option>
                <option value="plata">Plata</option>
                <option value="bronce">Bronce</option>
              </select></ResultField>
              <ResultField labelText="Fecha"><input type="date" className={input} value={r.result_date ?? ""} onChange={(e) => setR(i, { result_date: e.target.value || null })} /></ResultField>
              <div className="flex justify-end gap-1">
                <Button type="button" variant="outline" size="icon" className="h-11 w-11" onClick={() => move(i, -1)} aria-label="Subir"><ArrowUp /></Button>
                <Button type="button" variant="outline" size="icon" className="h-11 w-11" onClick={() => move(i, 1)} aria-label="Bajar"><ArrowDown /></Button>
                <Button type="button" variant="outline" size="icon" className="h-11 w-11 hover:text-destructive" onClick={() => setResults((rs) => rs.filter((_, j) => j !== i))} aria-label="Eliminar resultado"><Trash2 /></Button>
              </div>
            </li>
          ))}
        </ul>
      </FormSection>
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border bg-background px-4 py-3 sm:flex sm:justify-end sm:px-6">
        <Button type="button" variant="outline" className="min-h-11 font-condensed text-xs uppercase tracking-widest" onClick={() => setPreview((value) => !value)}><Eye />{preview ? "Ocultar vista" : "Previsualizar ficha"}</Button>
        <Button type="button" variant="outline" className="min-h-11 font-condensed text-xs uppercase tracking-widest" onClick={onClose}>Cancelar</Button>
        <Button type="button" disabled={saving} onClick={save} className="col-span-2 min-h-11 bg-gold font-condensed text-xs font-bold uppercase tracking-widest text-background hover:bg-gold/90 sm:col-span-1">{saving ? "Guardando…" : "Guardar ficha"}</Button>
      </div>
    </>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border border-border bg-surface/30 p-4"><h4 className="font-display mb-4 text-sm uppercase tracking-widest text-gold">{title}</h4>{children}</section>;
}

function ResultField({ labelText, children }: { labelText: string; children: React.ReactNode }) {
  return <label className="block"><span className={label + " sm:hidden"}>{labelText}</span>{children}</label>;
}

function MemberPreview({ member, results }: { member: PieceMember; results: MemberResult[] }) {
  const fullName = `${member.first_name} ${member.last_name}`.trim();
  const title = member.display_name?.trim() || fullName || "Sin nombre";
  return (
    <section className="grid gap-4 border border-gold/40 bg-background p-4 sm:grid-cols-[9rem_minmax(0,1fr)]" aria-label="Previsualización de la ficha">
      <div className="aspect-[4/5] overflow-hidden bg-surface">
        {member.image_url ? <img src={member.image_url} alt="" className="h-full w-full object-cover object-top" /> : <div className="grid h-full place-items-center font-display text-4xl text-gold/40">{title.charAt(0)}</div>}
      </div>
      <div className="min-w-0">
        <span className="font-condensed text-[10px] uppercase tracking-widest text-gold">Vista previa</span>
        <h4 className="font-display mt-2 break-words text-2xl uppercase text-foreground">{title}</h4>
        {member.display_name?.trim() && <p className="mt-1 text-xs text-muted-foreground">{fullName}</p>}
        <p className="mt-2 text-xs uppercase text-muted-foreground">{[member.category, member.club].filter(Boolean).join(" · ")}</p>
        {results.length > 0 && <p className="mt-3 text-xs text-gold">{results.length} resultado{results.length === 1 ? "" : "s"} en 2026</p>}
        {member.bio && <p className="mt-3 line-clamp-3 text-sm text-foreground/80">{member.bio}</p>}
      </div>
    </section>
  );
}
