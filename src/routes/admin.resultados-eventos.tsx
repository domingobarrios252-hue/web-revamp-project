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
  end_date: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  venue: string | null;
  banner_url: string | null;
  poster_url: string | null;
  pdf_url: string | null;
  stream_url: string | null;
  organizer: string | null;
  source_url: string | null;
  season: string | null;
  competition_type: string | null;
  main_category: string | null;
  status: Status;
  published: boolean;
  featured_in_live_center: boolean;
  featured: boolean;
  show_in_home: boolean;
  home_order: number;
  sort_order: number;
};

const empty: Omit<ResultEvent, "id"> = {
  slug: "",
  name: "",
  event_date: null,
  end_date: null,
  country: "",
  region: "",
  city: "",
  venue: "",
  banner_url: "",
  poster_url: "",
  pdf_url: "",
  stream_url: "",
  organizer: "",
  source_url: "",
  season: "",
  competition_type: "",
  main_category: "",
  status: "proxima",
  published: true,
  featured_in_live_center: false,
  featured: false,
  show_in_home: false,
  home_order: 0,
  sort_order: 0,
};


export const Route = createFileRoute("/admin/resultados-eventos")({
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
      end_date: draft.end_date || null,
      country: draft.country?.trim() || null,
      region: draft.region?.trim() || null,
      city: draft.city?.trim() || null,
      venue: draft.venue?.trim() || null,
      banner_url: draft.banner_url?.trim() || null,
      poster_url: draft.poster_url?.trim() || null,
      pdf_url: draft.pdf_url?.trim() || null,
      stream_url: draft.stream_url?.trim() || null,
      organizer: draft.organizer?.trim() || null,
      source_url: draft.source_url?.trim() || null,
      season: draft.season?.trim() || null,
      competition_type: draft.competition_type?.trim() || null,
      main_category: draft.main_category?.trim() || null,
      status: draft.status,
      published: draft.published,
      featured_in_live_center: draft.featured_in_live_center,
      featured: draft.featured,
      show_in_home: draft.show_in_home,
      home_order: Number(draft.home_order) || 0,
      sort_order: Number(draft.sort_order) || 0,
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
          <Field label="Nombre"><input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.slug || slugify(e.target.value) })} /></Field>
          <Field label="Slug (URL)"><input className="input" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} /></Field>
          <Field label="Tipo de competición"><input list="rz-comp-types" className="input" value={draft.competition_type ?? ""} onChange={(e) => setDraft({ ...draft, competition_type: e.target.value })} placeholder="Campeonato de España, Copa, Liga, Europeo…" />
            <datalist id="rz-comp-types">
              <option value="Campeonato de España" /><option value="Copa de España" /><option value="Liga Nacional" />
              <option value="Europeo" /><option value="Mundial" /><option value="Panamericano" />
              <option value="Torneo nacional" /><option value="Torneo internacional" />
            </datalist>
          </Field>
          <Field label="Temporada"><input className="input" value={draft.season ?? ""} onChange={(e) => setDraft({ ...draft, season: e.target.value })} placeholder="2026" /></Field>
          <Field label="Categoría principal"><input className="input" value={draft.main_category ?? ""} onChange={(e) => setDraft({ ...draft, main_category: e.target.value })} placeholder="Infantil, Junior, Senior…" /></Field>
          <Field label="Fecha inicio"><input type="date" className="input" value={draft.event_date ?? ""} onChange={(e) => setDraft({ ...draft, event_date: e.target.value || null })} /></Field>
          <Field label="Fecha fin"><input type="date" className="input" value={draft.end_date ?? ""} onChange={(e) => setDraft({ ...draft, end_date: e.target.value || null })} /></Field>
          <Field label="País"><input className="input" value={draft.country ?? ""} onChange={(e) => setDraft({ ...draft, country: e.target.value })} /></Field>
          <Field label="Comunidad / Región"><input className="input" value={draft.region ?? ""} onChange={(e) => setDraft({ ...draft, region: e.target.value })} /></Field>
          <Field label="Ciudad"><input className="input" value={draft.city ?? ""} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></Field>
          <Field label="Sede"><input className="input" value={draft.venue ?? ""} onChange={(e) => setDraft({ ...draft, venue: e.target.value })} /></Field>
          <Field label="Organizador"><input className="input" value={draft.organizer ?? ""} onChange={(e) => setDraft({ ...draft, organizer: e.target.value })} /></Field>
          <Field label="Banner URL (imagen fondo)"><input className="input" value={draft.banner_url ?? ""} onChange={(e) => setDraft({ ...draft, banner_url: e.target.value })} placeholder="https://..." /></Field>
          <Field label="Cartel URL"><input className="input" value={draft.poster_url ?? ""} onChange={(e) => setDraft({ ...draft, poster_url: e.target.value })} placeholder="https://..." /></Field>
          <Field label="PDF oficial de resultados"><input className="input" value={draft.pdf_url ?? ""} onChange={(e) => setDraft({ ...draft, pdf_url: e.target.value })} placeholder="https://..." /></Field>
          <Field label="Streaming / vídeo URL"><input className="input" value={draft.stream_url ?? ""} onChange={(e) => setDraft({ ...draft, stream_url: e.target.value })} placeholder="https://youtube.com/..." /></Field>
          <Field label="Fuente oficial (URL)"><input className="input" value={draft.source_url ?? ""} onChange={(e) => setDraft({ ...draft, source_url: e.target.value })} placeholder="https://..." /></Field>
          <Field label="Estado">
            <select className="input" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })}>
              <option value="proxima">Próximo</option>
              <option value="en_vivo">En directo</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </Field>
          <Field label="Orden general"><input type="number" className="input" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} /></Field>
          <Field label="Orden en Home"><input type="number" className="input" value={draft.home_order} onChange={(e) => setDraft({ ...draft, home_order: Number(e.target.value) })} /></Field>
          <div className="md:col-span-2 grid gap-2 rounded-lg border border-border/60 bg-background/40 p-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="font-condensed flex items-center gap-2 text-[11px] uppercase tracking-widest">
              <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> Visible en web
            </label>
            <label className="font-condensed flex items-center gap-2 text-[11px] uppercase tracking-widest">
              <input type="checkbox" checked={draft.show_in_home} onChange={(e) => setDraft({ ...draft, show_in_home: e.target.checked })} /> Mostrar en Home
            </label>
            <label className="font-condensed flex items-center gap-2 text-[11px] uppercase tracking-widest">
              <input type="checkbox" checked={draft.featured} onChange={(e) => setDraft({ ...draft, featured: e.target.checked })} /> Destacado
            </label>
            <label className="font-condensed flex items-center gap-2 text-[11px] uppercase tracking-widest">
              <input type="checkbox" checked={draft.featured_in_live_center} onChange={(e) => setDraft({ ...draft, featured_in_live_center: e.target.checked })} /> Destacado en Live Center
            </label>
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
