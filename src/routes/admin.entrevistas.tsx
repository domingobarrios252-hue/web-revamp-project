import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Upload, X, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

type Interview = {
  id: string;
  title: string;
  slug: string;
  interviewee_name: string;
  interviewee_bio: string | null;
  interview_date: string;
  cover_url: string | null;
  photos: string[];
  content: string | null;
  excerpt: string | null;
  published: boolean;
  sort_order: number;
};

const schema = z.object({
  title: z.string().trim().min(2).max(180),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9-]+$/),
  interviewee_name: z.string().trim().min(2).max(120),
  interviewee_bio: z.string().trim().max(2000).optional().or(z.literal("")),
  interview_date: z.string().min(8),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  content: z.string().trim().max(20000).optional().or(z.literal("")),
  cover_url: z.string().trim().url().optional().or(z.literal("")),
  published: z.boolean(),
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

export const Route = createFileRoute("/admin/entrevistas")({
  head: () => ({
    meta: [{ title: "Admin · Entrevistas" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminEntrevistas,
});

function AdminEntrevistas() {
  const [items, setItems] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Interview | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("interviews")
      .select("*")
      .order("interview_date", { ascending: false });
    const normalized = ((data as unknown as Interview[]) ?? []).map((it) => ({
      ...it,
      photos: Array.isArray(it.photos) ? it.photos : [],
    }));
    setItems(normalized);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar entrevista?")) return;
    const { error } = await supabase.from("interviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Entrevista eliminada");
    load();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest">Entrevistas</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Nueva entrevista
        </button>
      </div>

      {showForm && (
        <InterviewForm
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Aún no hay entrevistas.</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full">
            <thead className="border-b border-border bg-surface">
              <tr className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 text-left">Portada</th>
                <th className="px-3 py-2 text-left">Título</th>
                <th className="px-3 py-2 text-left">Entrevistado</th>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Fotos</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">
                    {m.cover_url && <img src={m.cover_url} alt="" className="h-12 w-16 object-cover" />}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-display text-sm uppercase">{m.title}</div>
                    <div className="font-condensed text-[10px] text-muted-foreground">/{m.slug}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">{m.interviewee_name}</td>
                  <td className="px-3 py-2 text-xs">{m.interview_date}</td>
                  <td className="px-3 py-2 text-xs">{m.photos.length}</td>
                  <td className="px-3 py-2 text-xs">
                    {m.published ? (
                      <span className="text-gold">Publicada</span>
                    ) : (
                      <span className="text-muted-foreground">Borrador</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => {
                        setEditing(m);
                        setShowForm(true);
                      }}
                      className="mr-2 text-muted-foreground hover:text-gold"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(m.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InterviewForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Interview | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [interviewee_name, setName] = useState(initial?.interviewee_name ?? "");
  const [interviewee_bio, setBio] = useState(initial?.interviewee_bio ?? "");
  const [interview_date, setDate] = useState(initial?.interview_date ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [cover_url, setCover] = useState(initial?.cover_url ?? "");
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [published, setPublished] = useState(initial?.published ?? true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const uploadCover = async (file: File) => {
    setUploadingCover(true);
    const ext = file.name.split(".").pop();
    const path = `interviews/${slug || slugify(title) || crypto.randomUUID()}-cover-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) {
      toast.error(error.message);
      setUploadingCover(false);
      return;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setCover(data.publicUrl);
    setUploadingCover(false);
  };

  const uploadPhotos = async (files: FileList) => {
    setUploadingPhoto(true);
    const next: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `interviews/${slug || slugify(title) || crypto.randomUUID()}-photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file);
      if (error) {
        toast.error(error.message);
        continue;
      }
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      next.push(data.publicUrl);
    }
    setPhotos((p) => [...p, ...next]);
    setUploadingPhoto(false);
  };

  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));
  const movePhoto = (i: number, dir: -1 | 1) => {
    setPhotos((p) => {
      const next = [...p];
      const j = i + dir;
      if (j < 0 || j >= next.length) return p;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const onSave = async () => {
    const parsed = schema.safeParse({
      title,
      slug,
      interviewee_name,
      interviewee_bio,
      interview_date,
      excerpt,
      content,
      cover_url,
      published,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");
    setSaving(true);
    const payload = {
      title: parsed.data.title,
      slug: parsed.data.slug,
      interviewee_name: parsed.data.interviewee_name,
      interviewee_bio: parsed.data.interviewee_bio || null,
      interview_date: parsed.data.interview_date,
      excerpt: parsed.data.excerpt || null,
      content: parsed.data.content || null,
      cover_url: parsed.data.cover_url || null,
      photos,
      published: parsed.data.published,
    };
    const { error } = initial
      ? await supabase.from("interviews").update(payload).eq("id", initial.id)
      : await supabase.from("interviews").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Entrevista actualizada" : "Entrevista creada");
    onSaved();
  };

  return (
    <div className="mb-6 border border-gold bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg tracking-widest text-gold">
          {initial ? "Editar entrevista" : "Nueva entrevista"}
        </h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Título *
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => !slug && setSlug(slugify(title))}
            className="input"
          />
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Slug *
          </span>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Entrevistado *
          </span>
          <input value={interviewee_name} onChange={(e) => setName(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Fecha *
          </span>
          <input
            type="date"
            value={interview_date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Biografía del entrevistado
          </span>
          <textarea
            value={interviewee_bio}
            onChange={(e) => setBio(e.target.value)}
            className="input min-h-[80px]"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Cita destacada / extracto
          </span>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="input min-h-[60px]"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Contenido (texto plano)
          </span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input min-h-[200px]"
            placeholder="P: ¿Cómo empezaste a patinar?&#10;R: ..."
          />
        </label>

        <label className="block md:col-span-2">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Portada
          </span>
          <div className="flex items-center gap-2">
            <input
              value={cover_url}
              onChange={(e) => setCover(e.target.value)}
              placeholder="URL o subir archivo"
              className="input flex-1"
            />
            <label className="font-condensed inline-flex cursor-pointer items-center gap-1 border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/10">
              <Upload className="h-3.5 w-3.5" /> {uploadingCover ? "…" : "Subir"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>
          {cover_url && <img src={cover_url} alt="" className="mt-2 h-32 w-48 object-cover" />}
        </label>

        <div className="md:col-span-2">
          <div className="font-condensed mb-2 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Fotos del carrusel ({photos.length})
            </span>
            <label className="inline-flex cursor-pointer items-center gap-1 border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/10">
              <Upload className="h-3.5 w-3.5" /> {uploadingPhoto ? "Subiendo…" : "Añadir fotos"}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && uploadPhotos(e.target.files)}
                className="hidden"
              />
            </label>
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((src, i) => (
                <div key={src + i} className="relative border border-border bg-background">
                  <img src={src} alt={`Foto ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-background/90 px-2 py-1">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => movePhoto(i, -1)}
                        disabled={i === 0}
                        className="text-[10px] text-muted-foreground hover:text-gold disabled:opacity-30"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        onClick={() => movePhoto(i, 1)}
                        disabled={i === photos.length - 1}
                        className="text-[10px] text-muted-foreground hover:text-gold disabled:opacity-30"
                      >
                        ▶
                      </button>
                      <span className="font-condensed text-[10px] uppercase text-muted-foreground">
                        <GripVertical className="inline h-3 w-3" /> {i + 1}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="text-[10px] text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          <span className="font-condensed text-xs uppercase tracking-widest">Publicada</span>
        </label>
      </div>
      <div className="mt-5 flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
        >
          {saving ? "Guardando…" : initial ? "Guardar" : "Crear entrevista"}
        </button>
        <button
          onClick={onClose}
          className="font-condensed border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
