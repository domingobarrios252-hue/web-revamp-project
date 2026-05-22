import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Save, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Status = "en_vivo" | "finalizado" | "proxima";

type ResultEvent = {
  id: string;
  slug: string;
  name: string;
  event_date: string | null;
  country: string | null;
  banner_url: string | null;
  status: Status;
  published: boolean;
  featured_in_live_center: boolean;
  sort_order: number;
  placements: string[];
};

const PLACEMENT_OPTIONS: { value: string; label: string; help: string }[] = [
  { value: "home", label: "Home", help: "Página principal" },
  { value: "spain", label: "España", help: "Hub /hub/es" },
  { value: "general", label: "Resultados", help: "Cabecera /resultados" },
];

const empty: Omit<ResultEvent, "id"> = {
  slug: "",
  name: "",
  event_date: null,
  country: "",
  banner_url: "",
  status: "proxima",
  published: true,
  featured_in_live_center: false,
  sort_order: 0,
  placements: ["home"],
};

export const Route = createFileRoute("/admin/resultados")({
  head: () => ({ meta: [{ title: "Admin · Eventos de Resultados" }, { name: "robots", content: "noindex" }] }),
  component: AdminResultados,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150);
}

function AdminResultados() {
  const [events, setEvents] = useState<ResultEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<ResultEvent | (Omit<ResultEvent, "id"> & { id?: string })>(empty);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("result_events")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("event_date", { ascending: false });
    setEvents((data as ResultEvent[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!draft.name.trim()) return toast.error("Nombre obligatorio");
    const slug = (draft.slug || slugify(draft.name)).trim();
    const payload = {
      slug,
      name: draft.name.trim(),
      event_date: draft.event_date || null,
      country: draft.country?.trim() || null,
      banner_url: draft.banner_url?.trim() || null,
      status: draft.status,
      published: draft.published,
      featured_in_live_center: draft.featured_in_live_center,
      sort_order: Number(draft.sort_order) || 0,
      placements: draft.placements?.length ? draft.placements : ["home"],
    };
    const { error } = "id" in draft && draft.id
      ? await supabase.from("result_events").update(payload).eq("id", draft.id)
      : await supabase.from("result_events").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Guardado");
    setDraft(empty);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar evento?")) return;
    const { error } = await supabase.from("result_events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl tracking-widest">Eventos de Resultados</h1>
        <p className="text-sm text-muted-foreground">
          Crea aquí los eventos que aparecerán en <Link to="/resultados" className="text-gold hover:underline">/resultados</Link>. Las clasificaciones (filas) se gestionan en{" "}
          <Link to="/admin/live-results" className="text-gold hover:underline">Resultados en vivo</Link> usando el mismo <code className="text-gold">slug</code>.
        </p>
      </header>

      {/* Editor */}
      <section className="border border-border bg-surface p-4">
        <h2 className="font-display mb-4 flex items-center gap-2 text-lg uppercase tracking-widest text-gold">
          <Plus className="h-4 w-4" /> {"id" in draft && draft.id ? "Editar evento" : "Nuevo evento"}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nombre">
            <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.slug || slugify(e.target.value) })} />
          </Field>
          <Field label="Slug (URL)">
            <input className="input" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} />
          </Field>
          <Field label="Fecha">
            <input type="date" className="input" value={draft.event_date ?? ""} onChange={(e) => setDraft({ ...draft, event_date: e.target.value || null })} />
          </Field>
          <Field label="País">
            <input className="input" value={draft.country ?? ""} onChange={(e) => setDraft({ ...draft, country: e.target.value })} />
          </Field>
          <Field label="Banner URL (imagen)">
            <input className="input" value={draft.banner_url ?? ""} onChange={(e) => setDraft({ ...draft, banner_url: e.target.value })} placeholder="https://..." />
          </Field>
          <Field label="Estado">
            <select className="input" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })}>
              <option value="proxima">Próximo</option>
              <option value="en_vivo">En vivo</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </Field>
          <Field label="Orden">
            <input type="number" className="input" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
          </Field>
          <div className="flex flex-col gap-2 pt-5">
            <label className="font-condensed flex items-center gap-2 text-[11px] uppercase tracking-widest">
              <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> Publicado
            </label>
            <label className="font-condensed flex items-center gap-2 text-[11px] uppercase tracking-widest">
              <input type="checkbox" checked={draft.featured_in_live_center} onChange={(e) => setDraft({ ...draft, featured_in_live_center: e.target.checked })} /> Destacado en Live Center
            </label>
          </div>
          <div className="md:col-span-2">
            <span className="font-condensed mb-2 block text-[10px] uppercase tracking-widest text-muted-foreground">Mostrar slider de podios en</span>
            <div className="flex flex-wrap gap-2">
              {PLACEMENT_OPTIONS.map((opt) => {
                const checked = (draft.placements ?? []).includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={
                      "font-condensed flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-[11px] uppercase tracking-widest " +
                      (checked ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-gold/60")
                    }
                  >
                    <input
                      type="checkbox"
                      className="accent-gold"
                      checked={checked}
                      onChange={(e) => {
                        const cur = new Set(draft.placements ?? []);
                        if (e.target.checked) cur.add(opt.value); else cur.delete(opt.value);
                        setDraft({ ...draft, placements: Array.from(cur) });
                      }}
                    />
                    <span>{opt.label}</span>
                    <span className="text-[9px] normal-case tracking-normal text-muted-foreground">{opt.help}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={save} className="font-condensed inline-flex items-center gap-2 bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark">
            <Save className="h-4 w-4" /> Guardar
          </button>
          {"id" in draft && draft.id && (
            <button onClick={() => setDraft(empty)} className="font-condensed border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest hover:bg-background">Cancelar</button>
          )}
        </div>
      </section>

      {/* List */}
      <section className="border border-border bg-surface">
        <div className="border-b border-border px-4 py-3 font-display text-lg uppercase tracking-widest text-gold">Eventos</div>
        {loading ? (
          <p className="p-4 text-muted-foreground">Cargando…</p>
        ) : events.length === 0 ? (
          <p className="p-4 text-muted-foreground">Aún no hay eventos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-border">
                <tr className="font-condensed text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">País</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Pub</th>
                  <th className="px-3 py-2">LC</th>
                  <th className="px-3 py-2">Slider en</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b border-border/70 hover:bg-background/40">
                    <td className="px-3 py-2 font-semibold">{e.name}</td>
                    <td className="px-3 py-2 text-muted-foreground"><code>{e.slug}</code></td>
                    <td className="px-3 py-2 text-muted-foreground">{e.event_date ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{e.country ?? "—"}</td>
                    <td className="px-3 py-2"><span className="text-gold">{e.status}</span></td>
                    <td className="px-3 py-2">{e.published ? "✓" : "—"}</td>
                    <td className="px-3 py-2">{e.featured_in_live_center ? "★" : "—"}</td>
                    <td className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                      {(e.placements ?? []).length ? (e.placements ?? []).join(", ") : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-2">
                        <a href={`/resultados/${e.slug}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-gold" title="Ver"><ExternalLink className="h-4 w-4" /></a>
                        <button onClick={() => setDraft(e)} className="font-condensed text-[10px] font-bold uppercase tracking-widest text-gold hover:underline">Editar</button>
                        <button onClick={() => remove(e.id)} className="text-tv-red hover:opacity-80"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
