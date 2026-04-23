import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Send, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { z } from "zod";
import { Link } from "@tanstack/react-router";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

type Section = { id: string; name: string };
type Writer = { id: string; full_name: string };

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  status: "draft" | "pending" | "published";
  section_id: string | null;
  updated_at: string;
};

const schema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  excerpt: z.string().trim().max(500).optional(),
  content: z.string().trim().max(20000).optional(),
  image_url: z.string().trim().url().optional().or(z.literal("")),
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const Route = createFileRoute("/dashboard/")({
  component: MyPostsPage,
});

function MyPostsPage() {
  const { user, sectionId } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [editing, setEditing] = useState<Post | "new" | null>(null);
  const [loading, setLoading] = useState(true);

  const mySection = sections.find((s) => s.id === sectionId);

  const reload = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: n }, { data: s }, { data: w }] = await Promise.all([
      supabase
        .from("news")
        .select("id, title, slug, excerpt, content, image_url, status, section_id, updated_at")
        .eq("created_by", user.id)
        .order("updated_at", { ascending: false }),
      supabase.from("sections").select("id, name").order("sort_order"),
      supabase.from("writers").select("id, full_name").eq("published", true).order("sort_order"),
    ]);
    setPosts((n as Post[]) ?? []);
    setSections((s as Section[]) ?? []);
    setWriters((w as Writer[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const onDelete = async (p: Post) => {
    if (!confirm(`¿Borrar "${p.title}"?`)) return;
    const { error } = await supabase.from("news").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Noticia borrada");
      reload();
    }
  };

  const sendForReview = async (p: Post) => {
    const { error } = await supabase.from("news").update({ status: "pending" }).eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Enviada a revisión");
      reload();
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest md:text-3xl">Mis noticias</h1>
        <button
          onClick={() => setEditing("new")}
          disabled={!sectionId}
          className="font-condensed inline-flex items-center gap-1.5 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" /> Nueva noticia
        </button>
      </div>

      <div className="mb-5 border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
        {sectionId ? (
          <>
            Tu sección asignada: <strong className="text-gold">{mySection?.name ?? "…"}</strong>.
            Todas tus noticias se publicarán en esta sección.
          </>
        ) : (
          <span className="text-destructive">
            Aún no tienes sección asignada. Pide a un administrador que te asigne una.
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : posts.length === 0 ? (
        <div className="border border-border bg-surface p-8 text-center text-muted-foreground">
          Aún no has creado ninguna noticia. Pulsa «Nueva noticia» para empezar.
        </div>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="font-condensed border-b border-border bg-background text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">Título</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Actualizado</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-2">
                    <div className="font-semibold text-foreground">{p.title}</div>
                    <div className="text-xs text-muted-foreground">/{p.slug}</div>
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(p.updated_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      {p.status === "published" && (
                        <Link
                          to="/noticias/articulo/$slug"
                          params={{ slug: p.slug }}
                          className="border border-border bg-background p-1.5 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
                          title="Ver publicada"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      )}
                      {p.status === "draft" && (
                        <button
                          onClick={() => sendForReview(p)}
                          title="Enviar a revisión"
                          className="border border-border bg-background p-1.5 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditing(p)}
                        title="Editar"
                        className="border border-border bg-background p-1.5 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {p.status === "draft" && (
                        <button
                          onClick={() => onDelete(p)}
                          title="Borrar"
                          className="border border-border bg-background p-1.5 text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <PostEditor
          item={editing === "new" ? null : editing}
          writers={writers}
          mySectionName={mySection?.name ?? null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Post["status"] }) {
  const map: Record<Post["status"], { label: string; cls: string }> = {
    draft: { label: "Borrador", cls: "bg-muted text-muted-foreground" },
    pending: { label: "En revisión", cls: "bg-gold/15 text-gold" },
    published: { label: "Publicada", cls: "bg-foreground/10 text-foreground" },
  };
  const m = map[status];
  return (
    <span className={`font-condensed px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest ${m.cls}`}>
      {m.label}
    </span>
  );
}

function PostEditor({
  item,
  writers,
  mySectionName,
  onClose,
  onSaved,
}: {
  item: Post | null;
  writers: Writer[];
  mySectionName: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState(item?.title ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [excerpt, setExcerpt] = useState(item?.excerpt ?? "");
  const [content, setContent] = useState(item?.content ?? "");
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item && title && !slug) setSlug(slugify(title));
  }, [title]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (asPending: boolean) => {
    const parsed = schema.safeParse({
      title,
      slug,
      excerpt: excerpt || undefined,
      content: content || undefined,
      image_url: imageUrl || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos no válidos");
      return;
    }
    setSaving(true);
    const newStatus: "draft" | "pending" = asPending ? "pending" : "draft";
    // Buscar un writer por defecto: el primero publicado, o usar email
    const defaultWriter = writers[0];
    const payload: Record<string, unknown> = {
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt ?? null,
      content: parsed.data.content ?? null,
      image_url: parsed.data.image_url || null,
      status: newStatus,
      author: defaultWriter?.full_name ?? user?.email ?? "Colaborador",
      writer_id: defaultWriter?.id ?? null,
    };
    const { error } = item
      ? await supabase.from("news").update(payload).eq("id", item.id)
      : await supabase.from("news").insert({ ...payload, created_by: user?.id });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        asPending
          ? "Enviada a revisión"
          : item
          ? "Borrador guardado"
          : "Borrador creado"
      );
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur">
      <div className="w-full max-w-3xl border border-border bg-surface p-5 md:p-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-widest">
            {item ? "Editar noticia" : "Nueva noticia"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        {mySectionName && (
          <div className="mb-3 border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
            Sección (asignada automáticamente):{" "}
            <strong className="text-gold">{mySectionName}</strong>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(false);
          }}
          className="space-y-3"
        >
          <Field label="Título" value={title} onChange={setTitle} required />
          <Field label="Slug (URL)" value={slug} onChange={setSlug} required />
          <div>
            <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              Imagen destacada
            </span>
            <ImageUploadField
              value={imageUrl}
              onChange={setImageUrl}
              folder="news"
              nameHint={slug || title}
              placeholder="URL o subir archivo"
            />
          </div>
          <TextareaField label="Resumen" value={excerpt} onChange={setExcerpt} rows={3} />
          <TextareaField
            label="Contenido (un párrafo por línea)"
            value={content}
            onChange={setContent}
            rows={12}
          />

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={onClose}
              className="font-condensed border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="font-condensed border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest text-foreground hover:border-gold hover:text-gold disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar borrador"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => save(true)}
              className="font-condensed inline-flex items-center gap-1.5 bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" /> Enviar a revisión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </label>
  );
}
