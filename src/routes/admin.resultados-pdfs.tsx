import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, ExternalLink, FileType2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ResultadosHubTabs } from "@/components/admin/ResultadosHubTabs";

export const Route = createFileRoute("/admin/resultados-pdfs")({
  head: () => ({ meta: [{ title: "Admin · PDFs oficiales" }, { name: "robots", content: "noindex" }] }),
  component: AdminResultadosPdfs,
});

type EventRow = {
  id: string;
  slug: string;
  name: string;
  event_date: string | null;
  pdf_url: string | null;
  status: string;
  published: boolean;
};

function AdminResultadosPdfs() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("result_events")
      .select("id, slug, name, event_date, pdf_url, status, published")
      .order("event_date", { ascending: false, nullsFirst: false });
    setRows((data as EventRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const savePdf = async (id: string) => {
    const url = (drafts[id] ?? "").trim() || null;
    const { error } = await supabase.from("result_events").update({ pdf_url: url }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("PDF guardado");
    setDrafts((d) => { const n = { ...d }; delete n[id]; return n; });
    load();
  };

  const filtered = rows.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()) || r.slug.includes(q.toLowerCase()));

  return (
    <div>
      <ResultadosHubTabs active="pdfs" />

      <section className="border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="font-display text-lg uppercase tracking-widest text-gold">PDFs oficiales por evento</h2>
            <p className="text-xs text-muted-foreground">
              Asocia la URL del PDF oficial (clasificación, acta, medallero…) a cada evento. El PDF aparecerá en la ficha pública del evento.
            </p>
          </div>
          <input
            className="input w-full max-w-xs"
            placeholder="Buscar evento…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="p-4 text-muted-foreground">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-muted-foreground">Sin eventos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-border">
                <tr className="font-condensed text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="px-3 py-2">Evento</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">PDF URL</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-border/70 align-top hover:bg-background/40">
                    <td className="px-3 py-2">
                      <div className="font-semibold">{e.name}</div>
                      <div className="text-xs text-muted-foreground"><code>{e.slug}</code></div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{e.event_date ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">
                      <span className="text-gold">{e.status}</span>
                      {e.published ? "" : " · oculto"}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="input w-full"
                        placeholder="https://…"
                        defaultValue={e.pdf_url ?? ""}
                        onChange={(ev) => setDrafts((d) => ({ ...d, [e.id]: ev.target.value }))}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        {e.pdf_url && (
                          <a href={e.pdf_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-gold" title="Abrir PDF">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => savePdf(e.id)}
                          disabled={drafts[e.id] === undefined}
                          className="font-condensed inline-flex items-center gap-1 bg-gold px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-40"
                        >
                          <Save className="h-3 w-3" /> Guardar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <FileType2 className="mr-1 inline h-3 w-3 text-gold" />
          Tip: sube el PDF a tu almacenamiento y pega la URL pública aquí.
        </div>
      </section>
    </div>
  );
}
