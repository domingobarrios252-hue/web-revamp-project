import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Globe2, Newspaper, Mic, Plus, Pencil, Send, Check, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { GalleryUploadField } from "@/components/admin/GalleryUploadField";
import { MIAMI_CODE } from "@/lib/miami/useMiami";

type Status = "draft" | "pending" | "published" | "rejected" | "archived";

type Row = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  status: Status;
  updated_at: string;
  image_url: string | null;
  gallery: string[];
  interviewee_name?: string;
  subtitle?: string | null;
  seo_title?: string | null;
  meta_description?: string | null;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function MiamiWorkspace() {
  const { isAdmin, isEditor } = useAuth();
  const [tab, setTab] = useState<"news" | "interviews">("news");
  const [news, setNews] = useState<Row[]>([]);
  const [interviews, setInterviews] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ kind: "news" | "interviews"; row: Row | null } | null>(null);

  const reload = async () => {
    setLoading(true);
    const [{ data: n }, { data: i }] = await Promise.all([
      supabase
        .from("news")
        .select("id,title,slug,excerpt,content,status,updated_at,image_url,gallery")
        .eq("country_code", MIAMI_CODE)
        .order("updated_at", { ascending: false }),
      supabase
        .from("interviews")
        .select("id,title,slug,excerpt,content,status,updated_at,cover_url,gallery,interviewee_name,subtitle,seo_title,meta_description")
        .eq("country_code", MIAMI_CODE)
        .order("updated_at", { ascending: false }),
    ]);
    setNews(
      ((n as Record<string, unknown>[]) ?? []).map((r) => ({
        ...(r as unknown as Row),
        gallery: (r.gallery as string[]) ?? [],
      })),
    );
    setInterviews(
      ((i as Record<string, unknown>[]) ?? []).map((r) => ({
        ...(r as unknown as Row),
        image_url: (r.cover_url as string) ?? null,
        gallery: (r.gallery as string[]) ?? [],
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    if (isEditor) reload();
  }, [isEditor]);

  if (!isEditor) return <p className="text-muted-foreground">Sin permisos.</p>;

  const publish = async (kind: "news" | "interviews", row: Row) => {
    if (!isAdmin) {
      toast.error("Solo el administrador puede publicar.");
      return;
    }
    const { error } = await supabase.from(kind).update({ status: "published" }).eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Publicado");
      reload();
    }
  };

  const submit = async (kind: "news" | "interviews", row: Row) => {
    const { error } = await supabase.from(kind).update({ status: "pending" }).eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Enviado a revisión");
      reload();
    }
  };

  const rows = tab === "news" ? news : interviews;

  return (
    <div className="space-y-5">
      <div className="border border-border bg-surface p-5 md:p-6">
        <p className="font-condensed mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
          <Globe2 className="h-4 w-4" /> Edición territorial
        </p>
        <h1 className="font-display text-2xl tracking-widest md:text-3xl">RollerZone Miami</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Solo noticias y entrevistas. El territorio se asigna automáticamente en el servidor
          (<code className="text-gold">country_code = {MIAMI_CODE}</code>) y ningún editor puede publicar sin
          aprobación del administrador.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/miami"
            className="font-condensed inline-flex min-h-11 items-center gap-1.5 border border-border px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Ver /miami
          </Link>
          {isAdmin && (
            <Link
              to="/admin/pendientes"
              className="font-condensed inline-flex min-h-11 items-center gap-1.5 border border-border px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
            >
              Cola de revisión
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["news", "interviews"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-condensed inline-flex min-h-11 items-center gap-1.5 border px-4 text-xs font-bold uppercase tracking-widest ${
              tab === t ? "border-gold bg-gold text-background" : "border-border text-muted-foreground hover:text-gold"
            }`}
          >
            {t === "news" ? <Newspaper className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            {t === "news" ? "Noticias Miami" : "Entrevistas Miami"}
          </button>
        ))}
        <button
          onClick={() => setEditing({ kind: tab, row: null })}
          className="font-condensed ml-auto inline-flex min-h-11 items-center gap-1.5 bg-gold px-4 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-3.5 w-3.5" /> {tab === "news" ? "Nueva noticia" : "Nueva entrevista"}
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : rows.length === 0 ? (
        <div className="border border-border bg-surface p-8 text-center text-muted-foreground">
          Aún no hay contenido de Miami.
        </div>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="font-condensed border-b border-border bg-background text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">Título</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Actualizado</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-2">
                    <div className="font-semibold text-foreground">{r.title}</div>
                    <div className="text-xs text-muted-foreground">/{r.slug}</div>
                  </td>
                  <td className="px-3 py-2 text-xs uppercase text-muted-foreground">{r.status}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(r.updated_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      {r.status !== "published" && (
                        <button
                          onClick={() => submit(tab, r)}
                          title="Enviar a revisión"
                          className="border border-border bg-background p-2 text-muted-foreground hover:border-gold hover:text-gold"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      {isAdmin && r.status !== "published" && (
                        <button
                          onClick={() => publish(tab, r)}
                          title="Publicar"
                          className="border border-border bg-background p-2 text-muted-foreground hover:border-gold hover:text-gold"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditing({ kind: tab, row: r })}
                        title="Editar"
                        className="border border-border bg-background p-2 text-muted-foreground hover:border-gold hover:text-gold"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <MiamiEditor
          kind={editing.kind}
          row={editing.row}
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

function MiamiEditor({
  kind,
  row,
  onClose,
  onSaved,
}: {
  kind: "news" | "interviews";
  row: Row | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState(row?.title ?? "");
  const [slug, setSlug] = useState(row?.slug ?? "");
  const [subtitle, setSubtitle] = useState(row?.subtitle ?? "");
  const [interviewee, setInterviewee] = useState(row?.interviewee_name ?? "");
  const [excerpt, setExcerpt] = useState(row?.excerpt ?? "");
  const [content, setContent] = useState(row?.content ?? "");
  const [image, setImage] = useState(row?.image_url ?? "");
  const [gallery, setGallery] = useState<string[]>(row?.gallery ?? []);
  const [seoTitle, setSeoTitle] = useState(row?.seo_title ?? "");
  const [metaDesc, setMetaDesc] = useState(row?.meta_description ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!row && title && !slug) setSlug(slugify(title));
  }, [title]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (status: "draft" | "pending") => {
    if (title.trim().length < 3 || slug.trim().length < 3) {
      toast.error("Título y slug son obligatorios");
      return;
    }
    setSaving(true);
    let error;
    if (kind === "news") {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt || null,
        content: content || null,
        image_url: image || null,
        gallery,
        status,
        country_code: MIAMI_CODE,
        author: user?.email ?? "RollerZone Miami",
      };
      ({ error } = row
        ? await supabase.from("news").update(payload).eq("id", row.id)
        : await supabase.from("news").insert({ ...payload, created_by: user?.id ?? null }));
    } else {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        subtitle: subtitle || null,
        interviewee_name: interviewee || title.trim(),
        excerpt: excerpt || null,
        content: content || null,
        cover_url: image || null,
        gallery,
        seo_title: seoTitle || null,
        meta_description: metaDesc || null,
        status,
        country_code: MIAMI_CODE,
        interview_date: new Date().toISOString().slice(0, 10),
      };
      ({ error } = row
        ? await supabase.from("interviews").update(payload).eq("id", row.id)
        : await supabase.from("interviews").insert({ ...payload, created_by: user?.id ?? null }));
    }
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "pending" ? "Enviado a revisión" : "Borrador guardado");
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur">
      <div className="w-full max-w-3xl border border-border bg-surface p-5 md:p-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-widest">
            {row ? "Editar" : "Nueva"} {kind === "news" ? "noticia" : "entrevista"} · Miami
          </h2>
          <button onClick={onClose} className="min-h-11 px-2 text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="space-y-3">
          <Field label="Titular" value={title} onChange={setTitle} />
          <Field label="Slug (URL)" value={slug} onChange={setSlug} />
          {kind === "interviews" && (
            <>
              <Field label="Protagonista" value={interviewee} onChange={setInterviewee} />
              <Field label="Subtítulo" value={subtitle} onChange={setSubtitle} />
            </>
          )}
          <div>
            <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              Fotografía principal
            </span>
            <ImageUploadField
              value={image}
              onChange={setImage}
              folder={kind === "news" ? "news" : "interviews"}
              nameHint={slug || title}
              placeholder="URL o subir archivo"
            />
          </div>
          <div>
            <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              Galería fotográfica
            </span>
            <GalleryUploadField value={gallery} onChange={setGallery} folder={kind === "news" ? "news" : "interviews"} />
          </div>
          <Textarea label="Entradilla" value={excerpt} onChange={setExcerpt} rows={3} />
          <Textarea label="Contenido (un párrafo por línea)" value={content} onChange={setContent} rows={12} />
          {kind === "interviews" && (
            <>
              <Field label="SEO title" value={seoTitle} onChange={setSeoTitle} />
              <Textarea label="Meta description" value={metaDesc} onChange={setMetaDesc} rows={2} />
            </>
          )}
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
          <button
            onClick={onClose}
            className="font-condensed min-h-11 border border-border px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={() => save("draft")}
            disabled={saving}
            className="font-condensed min-h-11 border border-border px-4 text-xs font-bold uppercase tracking-widest text-foreground hover:border-gold hover:text-gold disabled:opacity-50"
          >
            Guardar borrador
          </button>
          <button
            onClick={() => save("pending")}
            disabled={saving}
            className="font-condensed min-h-11 bg-gold px-5 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
          >
            Enviar a revisión
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full border border-border bg-background px-3 text-sm focus:border-gold focus:outline-none"
      />
    </label>
  );
}

function Textarea({
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
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none"
      />
    </label>
  );
}
