import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Radio, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

type LiveResult = {
  id: string;
  event_name: string;
  category: string | null;
  status: "en_vivo" | "finalizado";
  first_name: string | null;
  first_time: string | null;
  first_club: string | null;
  second_name: string | null;
  second_time: string | null;
  second_club: string | null;
  third_name: string | null;
  third_time: string | null;
  third_club: string | null;
  news_id: string | null;
  published: boolean;
  sort_order: number;
};

type NewsOption = { id: string; title: string; slug: string };

const EMPTY_FORM = {
  event_name: "",
  category: "",
  status: "en_vivo" as "en_vivo" | "finalizado",
  first_name: "",
  first_time: "",
  first_club: "",
  second_name: "",
  second_time: "",
  second_club: "",
  third_name: "",
  third_time: "",
  third_club: "",
  news_id: "",
  published: true,
  sort_order: 0,
};

export const Route = createFileRoute("/admin/resultados")({
  head: () => ({
    meta: [{ title: "Admin · Resultados en Vivo" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminResultados,
});

function AdminResultados() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<LiveResult[]>([]);
  const [news, setNews] = useState<NewsOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<LiveResult | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = async () => {
    setLoading(true);
    const [resultsRes, newsRes] = await Promise.all([
      supabase
        .from("live_results")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("news")
        .select("id, title, slug")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(200),
    ]);
    setItems((resultsRes.data ?? []) as LiveResult[]);
    setNews((newsRes.data ?? []) as NewsOption[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      sort_order: (items[items.length - 1]?.sort_order ?? 0) + 1,
    });
    setShowForm(true);
  };

  const openEdit = (it: LiveResult) => {
    setEditing(it);
    setForm({
      event_name: it.event_name,
      category: it.category ?? "",
      status: it.status,
      first_name: it.first_name ?? "",
      first_time: it.first_time ?? "",
      first_club: it.first_club ?? "",
      second_name: it.second_name ?? "",
      second_time: it.second_time ?? "",
      second_club: it.second_club ?? "",
      third_name: it.third_name ?? "",
      third_time: it.third_time ?? "",
      third_club: it.third_club ?? "",
      news_id: it.news_id ?? "",
      published: it.published,
      sort_order: it.sort_order,
    });
    setShowForm(true);
  };

  const save = async () => {
    const event_name = form.event_name.trim();
    if (event_name.length < 2) {
      toast.error("El nombre de la prueba es obligatorio");
      return;
    }
    const payload = {
      event_name,
      category: form.category.trim() || null,
      status: form.status,
      first_name: form.first_name.trim() || null,
      first_time: form.first_time.trim() || null,
      first_club: form.first_club.trim() || null,
      second_name: form.second_name.trim() || null,
      second_time: form.second_time.trim() || null,
      second_club: form.second_club.trim() || null,
      third_name: form.third_name.trim() || null,
      third_time: form.third_time.trim() || null,
      third_club: form.third_club.trim() || null,
      news_id: form.news_id || null,
      published: form.published,
      sort_order: form.sort_order,
    };
    if (editing) {
      const { error } = await supabase.from("live_results").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Resultado actualizado");
    } else {
      const { error } = await supabase.from("live_results").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Resultado creado");
    }
    setShowForm(false);
    load();
  };

  const toggleStatus = async (it: LiveResult) => {
    const next: "en_vivo" | "finalizado" = it.status === "en_vivo" ? "finalizado" : "en_vivo";
    const { error } = await supabase.from("live_results").update({ status: next }).eq("id", it.id);
    if (error) return toast.error(error.message);
    load();
  };

  const togglePublished = async (it: LiveResult) => {
    const { error } = await supabase
      .from("live_results")
      .update({ published: !it.published })
      .eq("id", it.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (it: LiveResult) => {
    if (!isAdmin) {
      toast.error("Solo los administradores pueden eliminar");
      return;
    }
    if (!confirm(`¿Eliminar "${it.event_name}"?`)) return;
    const { error } = await supabase.from("live_results").delete().eq("id", it.id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-widest">RESULTADOS EN VIVO</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea y edita resultados al instante. Vincular a una noticia es opcional.
          </p>
        </div>
        <button
          onClick={openNew}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Nueva prueba
        </button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-border p-8 text-center text-muted-foreground">
          No hay resultados todavía. Crea el primero.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const linkedNews = news.find((n) => n.id === it.news_id);
            return (
              <article
                key={it.id}
                className="border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {it.status === "en_vivo" ? (
                        <span className="font-condensed inline-flex items-center gap-1 bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                          <Radio className="h-3 w-3 animate-pulse" /> En vivo
                        </span>
                      ) : (
                        <span className="font-condensed inline-flex items-center gap-1 bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3" /> Finalizado
                        </span>
                      )}
                      {!it.published && (
                        <span className="font-condensed bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-yellow-500">
                          Borrador
                        </span>
                      )}
                      {it.category && (
                        <span className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                          {it.category}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 text-base font-semibold text-foreground">
                      {it.event_name}
                    </h3>
                    <ol className="mt-2 space-y-0.5 text-sm">
                      {[1, 2, 3].map((pos) => {
                        const name =
                          pos === 1 ? it.first_name : pos === 2 ? it.second_name : it.third_name;
                        const time =
                          pos === 1 ? it.first_time : pos === 2 ? it.second_time : it.third_time;
                        const club =
                          pos === 1 ? it.first_club : pos === 2 ? it.second_club : it.third_club;
                        if (!name) return null;
                        return (
                          <li key={pos} className="flex items-baseline gap-2">
                            <span className="font-condensed w-5 text-xs font-bold text-gold">
                              {pos}º
                            </span>
                            <span className="text-foreground">{name}</span>
                            {club && (
                              <span className="text-xs text-muted-foreground">· {club}</span>
                            )}
                            {time && (
                              <span className="ml-auto font-mono text-xs text-muted-foreground">
                                {time}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                    {linkedNews && (
                      <div className="mt-2 text-xs text-gold">
                        🔗 Vinculado a: {linkedNews.title}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStatus(it)}
                        className="font-condensed border border-border px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold"
                      >
                        {it.status === "en_vivo" ? "Finalizar" : "Reactivar"}
                      </button>
                      <Switch
                        checked={it.published}
                        onCheckedChange={() => togglePublished(it)}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(it)}
                        className="p-1.5 text-muted-foreground hover:text-gold"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(it)}
                        className="p-1.5 text-muted-foreground hover:text-destructive"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-border bg-background p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl tracking-widest">
                {editing ? "EDITAR RESULTADO" : "NUEVO RESULTADO"}
              </h2>
              <button onClick={() => setShowForm(false)} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre de la prueba *">
                  <input
                    type="text"
                    value={form.event_name}
                    onChange={(e) => setForm((f) => ({ ...f, event_name: e.target.value }))}
                    className="w-full border border-border bg-surface px-3 py-2 text-sm"
                    placeholder="Ej: 500m Eliminación Senior"
                  />
                </Field>
                <Field label="Categoría">
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full border border-border bg-surface px-3 py-2 text-sm"
                    placeholder="Senior · Junior · Cadete..."
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Estado">
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        status: e.target.value as "en_vivo" | "finalizado",
                      }))
                    }
                    className="w-full border border-border bg-surface px-3 py-2 text-sm"
                  >
                    <option value="en_vivo">🔴 En vivo</option>
                    <option value="finalizado">✅ Finalizado</option>
                  </select>
                </Field>
                <Field label="Orden">
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full border border-border bg-surface px-3 py-2 text-sm"
                  />
                </Field>
              </div>

              <div className="border-t border-border pt-4">
                <div className="font-condensed mb-3 text-xs font-bold uppercase tracking-widest text-gold">
                  Top 3 (todos opcionales)
                </div>
                <PodiumRow
                  position={1}
                  name={form.first_name}
                  time={form.first_time}
                  club={form.first_club}
                  onChange={(v) => setForm((f) => ({ ...f, ...v }))}
                  prefix="first"
                />
                <PodiumRow
                  position={2}
                  name={form.second_name}
                  time={form.second_time}
                  club={form.second_club}
                  onChange={(v) => setForm((f) => ({ ...f, ...v }))}
                  prefix="second"
                />
                <PodiumRow
                  position={3}
                  name={form.third_name}
                  time={form.third_time}
                  club={form.third_club}
                  onChange={(v) => setForm((f) => ({ ...f, ...v }))}
                  prefix="third"
                />
              </div>

              <Field label="Vincular a noticia (opcional)">
                <select
                  value={form.news_id}
                  onChange={(e) => setForm((f) => ({ ...f, news_id: e.target.value }))}
                  className="w-full border border-border bg-surface px-3 py-2 text-sm"
                >
                  <option value="">— Sin noticia vinculada —</option>
                  {news.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.published}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, published: v }))}
                />
                <span className="font-condensed text-xs uppercase tracking-widest text-muted-foreground">
                  {form.published ? "Publicado (visible en web)" : "Borrador"}
                </span>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="font-condensed border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  onClick={save}
                  className="font-condensed bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function PodiumRow({
  position,
  name,
  time,
  club,
  onChange,
  prefix,
}: {
  position: 1 | 2 | 3;
  name: string;
  time: string;
  club: string;
  onChange: (v: Record<string, string>) => void;
  prefix: "first" | "second" | "third";
}) {
  const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : "🥉";
  return (
    <div className="mb-2 grid gap-2 sm:grid-cols-[auto_1fr_1fr_120px]">
      <div className="font-condensed flex items-center justify-center bg-surface px-3 text-base font-bold text-gold">
        {medal} {position}º
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => onChange({ [`${prefix}_name`]: e.target.value })}
        placeholder="Nombre"
        className="border border-border bg-surface px-3 py-2 text-sm"
      />
      <input
        type="text"
        value={club}
        onChange={(e) => onChange({ [`${prefix}_club`]: e.target.value })}
        placeholder="Club (opcional)"
        className="border border-border bg-surface px-3 py-2 text-sm"
      />
      <input
        type="text"
        value={time}
        onChange={(e) => onChange({ [`${prefix}_time`]: e.target.value })}
        placeholder="Tiempo"
        className="border border-border bg-surface px-3 py-2 text-sm font-mono"
      />
    </div>
  );
}
