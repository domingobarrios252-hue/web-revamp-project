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
                className="border border-border bg-surface p-4 md:p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-condensed mb-1 flex flex-wrap gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                      <span className="bg-gold/15 px-2 py-0.5 text-gold">PENDIENTE</span>
                      {sec && <span className="bg-foreground/10 px-2 py-0.5">{sec.name}</span>}
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
                  <div className="flex gap-2 md:flex-col">
                    <button
                      onClick={() => setStatus(n.id, "published")}
                      className="font-condensed inline-flex items-center gap-1.5 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
                    >
                      <Check className="h-3.5 w-3.5" /> Publicar
                    </button>
                    <button
                      onClick={() => setStatus(n.id, "rejected")}
                      className="font-condensed inline-flex items-center gap-1.5 border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-destructive hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" /> Rechazar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
