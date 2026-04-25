import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X, ExternalLink, Inbox, MessageSquareWarning, Newspaper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

type PendingNews = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  author: string;
  created_by: string | null;
  section_id: string | null;
  status: "draft" | "pending" | "published" | "rejected";
  published_at: string;
  updated_at: string;
};

type Section = { id: string; name: string };
type Profile = { user_id: string; display_name: string | null };

export const Route = createFileRoute("/admin/pendientes")({
  head: () => ({
    meta: [
      { title: "Cola de revisión — RollerZone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PendingPage,
});

function PendingPage() {
  const { isEditor } = useAuth();
  const [items, setItems] = useState<PendingNews[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [feedbackById, setFeedbackById] = useState<Record<string, string>>({});

  const reload = async () => {
    setLoading(true);
    const [{ data: n }, { data: s }, { data: p }] = await Promise.all([
      supabase
        .from("news")
        .select("id, title, slug, excerpt, author, created_by, section_id, status, published_at, updated_at")
        .eq("status", "pending")
        .order("updated_at", { ascending: false }),
      supabase.from("sections").select("id, name"),
      supabase.from("profiles").select("user_id, display_name"),
    ]);
    setItems((n as PendingNews[]) ?? []);
    setSections((s as Section[]) ?? []);
    setProfiles((p as Profile[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (isEditor) reload();
  }, [isEditor]);

  if (!isEditor) {
    return <p className="text-muted-foreground">Solo admin/editor pueden revisar.</p>;
  }

  const setStatus = async (id: string, status: "published" | "rejected") => {
    const review_feedback = status === "rejected" ? feedbackById[id]?.trim() : null;
    if (status === "rejected" && !review_feedback) {
      toast.error("Añade feedback editorial antes de rechazar.");
      return;
    }

    setBusyId(id);
    const { error } = await supabase.from("news").update({ status, review_feedback }).eq("id", id);
    setBusyId(null);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "published" ? "Noticia aprobada y publicada" : "Noticia rechazada");
      setRejectingId(null);
      setFeedbackById((current) => ({ ...current, [id]: "" }));
      reload();
    }
  };

  return (
    <div className="space-y-5">
      <div className="border border-border bg-surface p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-condensed mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
              <Newspaper className="h-4 w-4" /> Dashboard editorial
            </p>
            <h1 className="font-display text-2xl tracking-widest md:text-3xl">Cola de revisión</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Revisa las piezas enviadas por la redacción, publica las aprobadas o devuelve las que necesitan ajustes con feedback claro.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center sm:min-w-72">
            <div className="border border-border bg-background/40 p-3">
              <div className="font-display text-2xl text-foreground">{items.length}</div>
              <div className="font-condensed text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Pendientes</div>
            </div>
            <div className="border border-border bg-background/40 p-3">
              <div className="font-display text-2xl text-foreground">{sections.length}</div>
              <div className="font-condensed text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Secciones</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="border border-border bg-surface p-8 text-center text-muted-foreground">Cargando cola editorial…</div>
      ) : items.length === 0 ? (
        <div className="border border-border bg-surface p-8 text-center text-muted-foreground">
          <Inbox className="mx-auto mb-3 h-8 w-8 text-gold" />
          No hay noticias pendientes de revisión. ¡Buen trabajo!
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((n) => {
            const sec = sections.find((x) => x.id === n.section_id);
            const author = profiles.find((p) => p.user_id === n.created_by);
            return (
              <article
                key={n.id}
                className="border border-border bg-surface p-4 shadow-sm transition-colors hover:border-gold/50 md:p-5"
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                  <div className="min-w-0 flex-1">
                    <div className="font-condensed mb-2 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span className="bg-gold/15 px-2 py-1 text-gold">Pendiente</span>
                      {sec && <span className="bg-foreground/10 px-2 py-1">{sec.name}</span>}
                      <span>
                        por {author?.display_name ?? n.author}
                      </span>
                      <span>· {new Date(n.updated_at).toLocaleString("es-ES")}</span>
                    </div>
                    <h2 className="font-display text-xl tracking-wide text-foreground">
                      {n.title}
                    </h2>
                    {n.excerpt && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {n.excerpt}
                      </p>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground">
                      <Link
                        to="/noticias/articulo/$slug"
                        params={{ slug: n.slug }}
                        className="inline-flex items-center gap-1 text-gold hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Vista previa /{n.slug}
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 lg:items-stretch">
                    <button
                      onClick={() => setStatus(n.id, "published")}
                      disabled={busyId === n.id}
                      className="font-condensed inline-flex items-center justify-center gap-1.5 bg-gold px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Check className="h-3.5 w-3.5" /> Aprobar y publicar
                    </button>
                    <button
                      onClick={() => setRejectingId(rejectingId === n.id ? null : n.id)}
                      disabled={busyId === n.id}
                      className="font-condensed inline-flex items-center justify-center gap-1.5 border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-destructive hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X className="h-3.5 w-3.5" /> Rechazar
                    </button>
                  </div>
                </div>
                {rejectingId === n.id && (
                  <div className="mt-4 border border-destructive/40 bg-destructive/5 p-4">
                    <label className="font-condensed mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-destructive">
                      <MessageSquareWarning className="h-4 w-4" /> Feedback de rechazo
                    </label>
                    <textarea
                      value={feedbackById[n.id] ?? ""}
                      onChange={(event) => setFeedbackById((current) => ({ ...current, [n.id]: event.target.value }))}
                      placeholder="Explica qué debe corregirse antes de volver a revisión…"
                      className="min-h-24 w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-destructive"
                    />
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        onClick={() => setRejectingId(null)}
                        className="font-condensed border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => setStatus(n.id, "rejected")}
                        disabled={busyId === n.id}
                        className="font-condensed bg-destructive px-4 py-2 text-xs font-bold uppercase tracking-widest text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Confirmar rechazo
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
