import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Users, Trash2, Download } from "lucide-react";

export const Route = createFileRoute("/admin/formularios")({
  head: () => ({ meta: [{ title: "Formularios recibidos — Admin" }, { name: "robots", content: "noindex" }] }),
  component: FormulariosAdmin,
});

type Signup = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  country: string;
  region: string | null;
  club_or_federation: string | null;
  topics: string;
  role_type: string;
  message: string | null;
  status: string;
};
type Sub = { id: string; email: string; source: string | null; created_at: string };

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}
function download(name: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

function FormulariosAdmin() {
  const [tab, setTab] = useState<"colab" | "news">("colab");
  const [signups, setSignups] = useState<Signup[] | null>(null);
  const [subs, setSubs] = useState<Sub[] | null>(null);

  async function loadSignups() {
    setSignups(null);
    const { data } = await supabase.from("contributor_signups").select("*").order("created_at", { ascending: false });
    setSignups((data as Signup[]) ?? []);
  }
  async function loadSubs() {
    setSubs(null);
    const { data } = await supabase.from("newsletter_subscribers").select("id,email,source,created_at").order("created_at", { ascending: false });
    setSubs((data as Sub[]) ?? []);
  }
  useEffect(() => { loadSignups(); loadSubs(); }, []);

  async function deleteSignup(id: string) {
    if (!confirm("¿Eliminar esta solicitud?")) return;
    await supabase.from("contributor_signups").delete().eq("id", id);
    loadSignups();
  }
  async function updateStatus(id: string, status: string) {
    await supabase.from("contributor_signups").update({ status }).eq("id", id);
    loadSignups();
  }
  async function deleteSub(id: string) {
    if (!confirm("¿Eliminar este suscriptor?")) return;
    await supabase.from("newsletter_subscribers").delete().eq("id", id);
    loadSubs();
  }

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-display text-2xl uppercase tracking-widest text-gold">Formularios recibidos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solicitudes de colaboración y suscripciones al newsletter.
        </p>
      </header>

      <div className="mb-5 flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("colab")}
          className={`font-condensed flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest ${
            tab === "colab" ? "border-b-2 border-gold text-gold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" /> Red de redactores {signups && `(${signups.length})`}
        </button>
        <button
          onClick={() => setTab("news")}
          className={`font-condensed flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest ${
            tab === "news" ? "border-b-2 border-gold text-gold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail className="h-4 w-4" /> Newsletter {subs && `(${subs.length})`}
        </button>
      </div>

      {tab === "colab" && (
        <div>
          <div className="mb-3 flex justify-end">
            <button
              onClick={() => signups && download("colaboradores.csv", toCsv(signups))}
              className="font-condensed inline-flex items-center gap-2 rounded border border-gold/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-gold hover:bg-gold/10"
            >
              <Download className="h-3 w-3" /> Exportar CSV
            </button>
          </div>
          {signups === null ? (
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          ) : signups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay solicitudes.</p>
          ) : (
            <div className="space-y-3">
              {signups.map((s) => (
                <div key={s.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-foreground">{s.full_name}</div>
                      <a href={`mailto:${s.email}`} className="text-sm text-gold hover:underline">{s.email}</a>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleString("es-ES")} · {s.country}
                        {s.region ? ` · ${s.region}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={s.status}
                        onChange={(e) => updateStatus(s.id, e.target.value)}
                        className="rounded border border-border bg-background px-2 py-1 text-xs"
                      >
                        <option value="nuevo">Nuevo</option>
                        <option value="revisado">Revisado</option>
                        <option value="contactado">Contactado</option>
                        <option value="aceptado">Aceptado</option>
                        <option value="descartado">Descartado</option>
                      </select>
                      <button onClick={() => deleteSignup(s.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-1 text-sm">
                    <div><span className="text-muted-foreground">Rol:</span> {s.role_type}</div>
                    {s.club_or_federation && <div><span className="text-muted-foreground">Club/Fed:</span> {s.club_or_federation}</div>}
                    <div><span className="text-muted-foreground">Temas:</span> {s.topics}</div>
                    {s.message && <div className="mt-1 rounded bg-background p-2 text-xs">{s.message}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "news" && (
        <div>
          <div className="mb-3 flex justify-end">
            <button
              onClick={() => subs && download("newsletter.csv", toCsv(subs))}
              className="font-condensed inline-flex items-center gap-2 rounded border border-gold/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-gold hover:bg-gold/10"
            >
              <Download className="h-3 w-3" /> Exportar CSV
            </button>
          </div>
          {subs === null ? (
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          ) : subs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay suscriptores.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Origen</th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-3 py-2"><a href={`mailto:${s.email}`} className="text-gold hover:underline">{s.email}</a></td>
                      <td className="px-3 py-2 text-muted-foreground">{s.source ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{new Date(s.created_at).toLocaleString("es-ES")}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => deleteSub(s.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
