import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, X, Eye, Inbox, MessageSquareWarning, Newspaper, Mic, Archive, Calendar, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type EditorialStatus = "draft" | "pending" | "published" | "rejected" | "archived";

type QueueItem = {
  id: string;
  kind: "news" | "interview";
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  author: string;
  created_by: string | null;
  country_code: string;
  status: EditorialStatus;
  created_at: string;
  submitted_at: string | null;
  updated_at: string;
  review_feedback: string | null;
};

type Profile = { user_id: string; display_name: string | null };

const TERRITORIES: { code: string; label: string }[] = [
  { code: "all", label: "Todos los territorios" },
  { code: "mia", label: "Miami" },
  { code: "es", label: "España" },
  { code: "co", label: "Colombia" },
  { code: "ve", label: "Venezuela" },
];

const STATUSES: { value: EditorialStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pendiente de revisión" },
  { value: "draft", label: "Borrador" },
  { value: "rejected", label: "Cambios solicitados" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Archivado" },
  { value: "all", label: "Todos los estados" },
];

export const Route = createFileRoute("/admin/pendientes")({
  head: () => ({
    meta: [
      { title: "Cola de revisión | RollerZone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PendingPage,
});

function PendingPage() {
  const { isEditor, isAdmin } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [feedbackById, setFeedbackById] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<QueueItem | null>(null);
  const [previewBody, setPreviewBody] = useState<string | null>(null);

  const [fTerritory, setFTerritory] = useState("all");
  const [fKind, setFKind] = useState<"all" | "news" | "interview">("all");
  const [fStatus, setFStatus] = useState<EditorialStatus | "all">("pending");
  const [fAuthor, setFAuthor] = useState("all");
  const [fFrom, setFFrom] = useState("");

  const reload = async () => {
    setLoading(true);
    const [{ data: n }, { data: i }, { data: p }] = await Promise.all([
      supabase
        .from("news")
        .select("id,title,slug,excerpt,image_url,author,created_by,country_code,status,created_at,submitted_at,updated_at,review_feedback")
        .order("updated_at", { ascending: false })
        .limit(300),
      supabase
        .from("interviews")
        .select("id,title,slug,excerpt,cover_url,interviewee_name,created_by,country_code,status,created_at,submitted_at,updated_at,review_feedback")
        .order("updated_at", { ascending: false })
        .limit(300),
      supabase.from("profiles").select("user_id, display_name"),
    ]);

    const newsItems: QueueItem[] = ((n as Record<string, unknown>[]) ?? []).map((r) => ({
      id: r.id as string,
      kind: "news",
      title: r.title as string,
      slug: r.slug as string,
      excerpt: (r.excerpt as string) ?? null,
      image_url: (r.image_url as string) ?? null,
      author: (r.author as string) ?? "",
      created_by: (r.created_by as string) ?? null,
      country_code: (r.country_code as string) ?? "es",
      status: r.status as EditorialStatus,
      created_at: r.created_at as string,
      submitted_at: (r.submitted_at as string) ?? null,
      updated_at: r.updated_at as string,
      review_feedback: (r.review_feedback as string) ?? null,
    }));

    const interviewItems: QueueItem[] = ((i as Record<string, unknown>[]) ?? []).map((r) => ({
      id: r.id as string,
      kind: "interview",
      title: r.title as string,
      slug: r.slug as string,
      excerpt: (r.excerpt as string) ?? null,
      image_url: (r.cover_url as string) ?? null,
      author: (r.interviewee_name as string) ?? "",
      created_by: (r.created_by as string) ?? null,
      country_code: (r.country_code as string) ?? "es",
      status: (r.status as EditorialStatus) ?? "draft",
      created_at: r.created_at as string,
      submitted_at: (r.submitted_at as string) ?? null,
      updated_at: r.updated_at as string,
      review_feedback: (r.review_feedback as string) ?? null,
    }));

    setItems([...newsItems, ...interviewItems].sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
    setProfiles((p as Profile[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (isEditor) reload();
  }, [isEditor]);

  const authors = useMemo(() => {
    const ids = Array.from(new Set(items.map((i) => i.created_by).filter(Boolean))) as string[];
    return ids.map((id) => ({
      id,
      label: profiles.find((p) => p.user_id === id)?.display_name ?? id.slice(0, 8),
    }));
  }, [items, profiles]);

  const filtered = useMemo(
    () =>
      items.filter((i) => {
        if (fTerritory !== "all" && i.country_code !== fTerritory) return false;
        if (fKind !== "all" && i.kind !== fKind) return false;
        if (fStatus !== "all" && i.status !== fStatus) return false;
        if (fAuthor !== "all" && i.created_by !== fAuthor) return false;
        if (fFrom && new Date(i.created_at) < new Date(fFrom)) return false;
        return true;
      }),
    [items, fTerritory, fKind, fStatus, fAuthor, fFrom],
  );

  if (!isEditor) {
    return <p className="text-muted-foreground">Solo admin/editor pueden revisar.</p>;
  }

  const table = (item: QueueItem) => (item.kind === "news" ? "news" : "interviews");

  const setStatus = async (item: QueueItem, status: EditorialStatus) => {
    if (!isAdmin) {
      toast.error("Solo el administrador puede aprobar, publicar o archivar contenido.");
      return;
    }
    const review_feedback = status === "rejected" ? feedbackById[item.id]?.trim() : null;
    if (status === "rejected" && !review_feedback) {
      toast.error("Añade una nota para el editor antes de solicitar cambios.");
      return;
    }
    setBusyId(item.id);
    const { error } = await supabase
      .from(table(item))
      .update({ status, review_feedback })
      .eq("id", item.id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      status === "published"
        ? "Contenido aprobado y publicado"
        : status === "rejected"
          ? "Cambios solicitados al editor"
          : status === "archived"
            ? "Contenido archivado"
            : "Estado actualizado",
    );
    setRejectingId(null);
    setFeedbackById((c) => ({ ...c, [item.id]: "" }));
    reload();
  };

  const openPreview = async (item: QueueItem) => {
    setPreview(item);
    setPreviewBody(null);
    const { data } = await supabase.from(table(item)).select("content").eq("id", item.id).maybeSingle();
    setPreviewBody(((data as { content: string | null } | null)?.content) ?? "");
  };

  const territoryLabel = (code: string) =>
    TERRITORIES.find((t) => t.code === code)?.label ?? code.toUpperCase();

  return (
    <div className="space-y-5">
      <div className="border border-border bg-surface p-5 md:p-6">
        <p className="font-condensed mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
          <Newspaper className="h-4 w-4" /> Dashboard editorial
        </p>
        <h1 className="font-display text-2xl tracking-widest md:text-3xl">Contenido pendiente de revisión</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Noticias y entrevistas enviadas por la redacción de cada territorio. Solo el administrador puede
          aprobar, publicar o archivar.
        </p>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          <Select value={fTerritory} onChange={setFTerritory} options={TERRITORIES.map((t) => ({ value: t.code, label: t.label }))} />
          <Select
            value={fKind}
            onChange={(v) => setFKind(v as typeof fKind)}
            options={[
              { value: "all", label: "Noticias y entrevistas" },
              { value: "news", label: "Noticias" },
              { value: "interview", label: "Entrevistas" },
            ]}
          />
          <Select value={fStatus} onChange={(v) => setFStatus(v as EditorialStatus | "all")} options={STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
          <Select
            value={fAuthor}
            onChange={setFAuthor}
            options={[{ value: "all", label: "Todos los autores" }, ...authors.map((a) => ({ value: a.id, label: a.label }))]}
          />
          <input
            type="date"
            value={fFrom}
            onChange={(e) => setFFrom(e.target.value)}
            className="min-h-11 shrink-0 border border-border bg-background px-3 text-xs text-foreground focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="border border-border bg-surface p-8 text-center text-muted-foreground">Cargando cola editorial…</div>
      ) : filtered.length === 0 ? (
        <div className="border border-border bg-surface p-8 text-center text-muted-foreground">
          <Inbox className="mx-auto mb-3 h-8 w-8 text-gold" />
          No hay contenidos con estos filtros.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((n) => {
            const author = profiles.find((p) => p.user_id === n.created_by);
            return (
              <article key={`${n.kind}-${n.id}`} className="border border-border bg-surface p-4 transition-colors hover:border-gold/50 md:p-5">
                <div className="grid gap-4 lg:grid-cols-[120px_1fr_220px]">
                  <div className="aspect-[4/3] w-full overflow-hidden border border-border bg-background lg:w-[120px]">
                    {n.image_url ? (
                      <img src={n.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] uppercase text-muted-foreground">Sin foto</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-condensed mb-2 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span className="inline-flex items-center gap-1 bg-foreground/10 px-2 py-1">
                        {n.kind === "news" ? <Newspaper className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                        {n.kind === "news" ? "Noticia" : "Entrevista"}
                      </span>
                      <span className="bg-gold/15 px-2 py-1 text-gold">{territoryLabel(n.country_code)}</span>
                      <StatusBadge status={n.status} />
                      <span>por {author?.display_name ?? n.author}</span>
                      <span>· creado {new Date(n.created_at).toLocaleDateString("es-ES")}</span>
                      {n.submitted_at && <span>· enviado {new Date(n.submitted_at).toLocaleDateString("es-ES")}</span>}
                    </div>
                    <h2 className="font-display text-xl tracking-wide text-foreground">{n.title}</h2>
                    {n.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.excerpt}</p>}
                    {n.review_feedback && (
                      <p className="mt-2 border-l-2 border-destructive pl-2 text-xs text-destructive">
                        Cambios solicitados: {n.review_feedback}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => openPreview(n)}
                      className="mt-2 inline-flex min-h-11 items-center gap-1 text-xs text-gold hover:underline"
                    >
                      <Eye className="h-3.5 w-3.5" /> Vista previa /{n.slug}
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {n.status !== "published" && (
                      <button
                        onClick={() => setStatus(n, "published")}
                        disabled={busyId === n.id || !isAdmin}
                        className="font-condensed inline-flex min-h-11 items-center justify-center gap-1.5 bg-gold px-4 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" /> Aprobar y publicar
                      </button>
                    )}
                    <button
                      onClick={() => setRejectingId(rejectingId === n.id ? null : n.id)}
                      disabled={busyId === n.id || !isAdmin}
                      className="font-condensed inline-flex min-h-11 items-center justify-center gap-1.5 border border-border px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50"
                    >
                      <MessageSquareWarning className="h-3.5 w-3.5" /> Solicitar cambios
                    </button>
                    {n.status !== "archived" && (
                      <button
                        onClick={() => setStatus(n, "archived")}
                        disabled={busyId === n.id || !isAdmin}
                        className="font-condensed inline-flex min-h-11 items-center justify-center gap-1.5 border border-border px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold disabled:opacity-50"
                      >
                        <Archive className="h-3.5 w-3.5" /> Archivar
                      </button>
                    )}
                  </div>
                </div>

                {rejectingId === n.id && (
                  <div className="mt-4 border border-destructive/40 bg-destructive/5 p-4">
                    <label className="font-condensed mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-destructive">
                      <X className="h-4 w-4" /> Nota para el editor
                    </label>
                    <textarea
                      value={feedbackById[n.id] ?? ""}
                      onChange={(e) => setFeedbackById((c) => ({ ...c, [n.id]: e.target.value }))}
                      placeholder="Ej.: Cambiar fotografía principal y revisar el segundo párrafo."
                      className="min-h-24 w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-destructive"
                    />
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        onClick={() => setRejectingId(null)}
                        className="font-condensed min-h-11 border border-border px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => setStatus(n, "rejected")}
                        disabled={busyId === n.id}
                        className="font-condensed min-h-11 bg-destructive px-4 text-xs font-bold uppercase tracking-widest text-destructive-foreground disabled:opacity-60"
                      >
                        Enviar solicitud de cambios
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl uppercase tracking-wider">
              {preview?.title ?? ""}
            </DialogTitle>
          </DialogHeader>
          {preview && (
            <article>
              {preview.excerpt && <p className="text-base text-muted-foreground">{preview.excerpt}</p>}
              <div className="font-condensed mt-4 flex flex-wrap items-center gap-4 border-y border-border py-3 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-gold" />
                  <span className="text-foreground">{preview.author}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gold" />
                  {new Date(preview.created_at).toLocaleDateString("es-ES")}
                </span>
              </div>
              {preview.image_url && (
                <img src={preview.image_url} alt="" className="my-6 aspect-[16/9] w-full object-cover" />
              )}
              <div className="space-y-4 text-[15px] leading-relaxed text-foreground/90">
                {previewBody === null ? (
                  <p className="text-muted-foreground">Cargando contenido…</p>
                ) : previewBody.trim() === "" ? (
                  <p className="italic text-muted-foreground">(Sin contenido)</p>
                ) : (
                  previewBody
                    .split("\n")
                    .map((p) => p.trim())
                    .filter(Boolean)
                    .map((p, idx) => <p key={idx}>{p}</p>)
                )}
              </div>
            </article>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: EditorialStatus }) {
  const map: Record<EditorialStatus, { label: string; cls: string }> = {
    draft: { label: "Borrador", cls: "bg-muted text-muted-foreground" },
    pending: { label: "Pendiente", cls: "bg-gold/15 text-gold" },
    published: { label: "Publicado", cls: "bg-foreground/10 text-foreground" },
    rejected: { label: "Cambios solicitados", cls: "bg-destructive/15 text-destructive" },
    archived: { label: "Archivado", cls: "bg-muted text-muted-foreground" },
  };
  const m = map[status] ?? map.draft;
  return <span className={`px-2 py-1 ${m.cls}`}>{m.label}</span>;
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="font-condensed min-h-11 shrink-0 border border-border bg-background px-3 text-xs uppercase tracking-widest text-foreground focus:border-gold focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
