import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, ExternalLink, Eye, Plus, Trash2, ArrowUp, ArrowDown, Link2, Mail, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { renderMarkdown } from "@/lib/markdown";

type AboutLink = {
  id: string;
  label: string;
  link_type: "internal" | "external" | "email";
  target: string;
  icon: string;
  sort_order: number;
  active: boolean;
};

type AboutPage = {
  id: string;
  slug: string;
  title: string;
  content: string;
  published: boolean;
  updated_at: string;
};

const ICON_OPTIONS = [
  "Info",
  "Users",
  "PenTool",
  "Handshake",
  "Megaphone",
  "Mail",
  "FileText",
  "Heart",
  "Star",
  "Newspaper",
];

export const Route = createFileRoute("/admin/sobre-nosotros")({
  head: () => ({
    meta: [
      { title: "Admin · Sobre nosotros" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAboutUs,
});

function AdminAboutUs() {
  const [tab, setTab] = useState<"links" | "pages">("links");
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl tracking-widest">SOBRE NOSOTROS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona los enlaces del bloque "Sobre nosotros" del footer y el contenido de sus
          páginas internas.
        </p>
      </div>

      <div className="mb-6 flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("links")}
          className={`font-condensed border-b-2 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
            tab === "links"
              ? "border-gold text-gold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Enlaces del footer
        </button>
        <button
          onClick={() => setTab("pages")}
          className={`font-condensed border-b-2 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
            tab === "pages"
              ? "border-gold text-gold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Páginas internas
        </button>
      </div>

      {tab === "links" ? <LinksManager /> : <PagesManager />}
    </div>
  );
}

/* ===================== LINKS ===================== */

function LinksManager() {
  const [links, setLinks] = useState<AboutLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Omit<AboutLink, "id">>({
    label: "",
    link_type: "internal",
    target: "",
    icon: "Info",
    sort_order: 0,
    active: true,
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("about_links")
      .select("*")
      .order("sort_order");
    if (error) {
      toast.error("No se pudieron cargar los enlaces");
    } else {
      setLinks((data ?? []) as AboutLink[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (id: string, patch: Partial<AboutLink>) => {
    const { error } = await supabase.from("about_links").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setLinks((arr) => arr.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este enlace?")) return;
    const { error } = await supabase.from("about_links").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Enlace eliminado");
    setLinks((arr) => arr.filter((l) => l.id !== id));
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = links.findIndex((l) => l.id === id);
    const swap = links[idx + dir];
    if (!swap) return;
    const a = links[idx];
    await Promise.all([
      supabase.from("about_links").update({ sort_order: swap.sort_order }).eq("id", a.id),
      supabase.from("about_links").update({ sort_order: a.sort_order }).eq("id", swap.id),
    ]);
    load();
  };

  const create = async () => {
    if (!draft.label.trim() || !draft.target.trim()) {
      toast.error("Etiqueta y destino son obligatorios");
      return;
    }
    const nextOrder = (links[links.length - 1]?.sort_order ?? 0) + 1;
    const { error } = await supabase
      .from("about_links")
      .insert({ ...draft, sort_order: nextOrder });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Enlace creado");
    setCreating(false);
    setDraft({ label: "", link_type: "internal", target: "", icon: "Info", sort_order: 0, active: true });
    load();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Reordena con las flechas. Tipos: <strong>interna</strong> (slug de página interna,
          ej: <code className="text-gold">quienes-somos</code>), <strong>externa</strong> (URL
          completa), <strong>email</strong> (dirección de correo).
        </p>
        <button
          onClick={() => setCreating((v) => !v)}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Nuevo enlace
        </button>
      </div>

      {creating && (
        <div className="mb-4 grid gap-3 border border-gold/40 bg-surface p-4 md:grid-cols-[1fr_140px_1fr_120px_auto]">
          <input
            placeholder="Etiqueta"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            className="border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            value={draft.link_type}
            onChange={(e) => setDraft({ ...draft, link_type: e.target.value as AboutLink["link_type"] })}
            className="border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="internal">Interna</option>
            <option value="external">Externa</option>
            <option value="email">Email</option>
          </select>
          <input
            placeholder={
              draft.link_type === "internal"
                ? "slug (ej: quienes-somos)"
                : draft.link_type === "email"
                  ? "email@dominio.com"
                  : "https://..."
            }
            value={draft.target}
            onChange={(e) => setDraft({ ...draft, target: e.target.value })}
            className="border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            value={draft.icon}
            onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
            className="border border-border bg-background px-3 py-2 text-sm"
          >
            {ICON_OPTIONS.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          <button
            onClick={create}
            className="font-condensed bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
          >
            Crear
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : links.length === 0 ? (
        <div className="border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          No hay enlaces. Crea el primero.
        </div>
      ) : (
        <div className="border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-background text-left">
              <tr className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">Orden</th>
                <th className="px-3 py-2">Etiqueta</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Destino</th>
                <th className="px-3 py-2">Icono</th>
                <th className="px-3 py-2">Activo</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {links.map((l, i) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => move(l.id, -1)}
                        disabled={i === 0}
                        className="text-muted-foreground hover:text-gold disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => move(l.id, 1)}
                        disabled={i === links.length - 1}
                        className="text-muted-foreground hover:text-gold disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      defaultValue={l.label}
                      onBlur={(e) => e.target.value !== l.label && update(l.id, { label: e.target.value })}
                      className="w-full border border-border bg-background px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={l.link_type}
                      onChange={(e) => update(l.id, { link_type: e.target.value as AboutLink["link_type"] })}
                      className="border border-border bg-background px-2 py-1 text-xs"
                    >
                      <option value="internal">Interna</option>
                      <option value="external">Externa</option>
                      <option value="email">Email</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      {l.link_type === "internal" && <FileText className="h-3.5 w-3.5 text-gold/60" />}
                      {l.link_type === "external" && <Link2 className="h-3.5 w-3.5 text-gold/60" />}
                      {l.link_type === "email" && <Mail className="h-3.5 w-3.5 text-gold/60" />}
                      <input
                        defaultValue={l.target}
                        onBlur={(e) => e.target.value !== l.target && update(l.id, { target: e.target.value })}
                        className="w-full border border-border bg-background px-2 py-1 text-sm font-mono text-xs"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={l.icon}
                      onChange={(e) => update(l.id, { icon: e.target.value })}
                      className="border border-border bg-background px-2 py-1 text-xs"
                    >
                      {ICON_OPTIONS.map((i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={l.active}
                      onChange={(e) => update(l.id, { active: e.target.checked })}
                      className="h-4 w-4 accent-gold"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => remove(l.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Eliminar"
                    >
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
  );
}

/* ===================== PAGES ===================== */

function PagesManager() {
  const [pages, setPages] = useState<AboutPage[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>("");
  const [draft, setDraft] = useState({ title: "", content: "", slug: "", published: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("about_pages")
      .select("*")
      .order("slug");
    if (error) {
      toast.error("No se pudieron cargar las páginas");
      setLoading(false);
      return;
    }
    const list = (data ?? []) as AboutPage[];
    setPages(list);
    const current = list.find((p) => p.slug === activeSlug) ?? list[0];
    if (current) {
      setActiveSlug(current.slug);
      setDraft({ title: current.title, content: current.content, slug: current.slug, published: current.published });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchTo = (slug: string) => {
    const p = pages.find((x) => x.slug === slug);
    if (!p) return;
    setActiveSlug(slug);
    setDraft({ title: p.title, content: p.content, slug: p.slug, published: p.published });
    setPreview(false);
  };

  const save = async () => {
    if (draft.title.trim().length < 2) {
      toast.error("El título es obligatorio");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("about_pages")
      .update({ title: draft.title.trim(), content: draft.content, published: draft.published })
      .eq("slug", activeSlug);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Página guardada");
    load();
  };

  const create = async () => {
    const slug = newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (!slug || !newTitle.trim()) {
      toast.error("Slug y título son obligatorios");
      return;
    }
    const { error } = await supabase
      .from("about_pages")
      .insert({ slug, title: newTitle.trim(), content: `# ${newTitle.trim()}\n\n`, published: true });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Página creada");
    setCreating(false);
    setNewSlug("");
    setNewTitle("");
    setActiveSlug(slug);
    load();
  };

  const remove = async () => {
    if (!confirm(`¿Eliminar la página "${draft.title}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from("about_pages").delete().eq("slug", activeSlug);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Página eliminada");
    setActiveSlug("");
    load();
  };

  const current = pages.find((p) => p.slug === activeSlug);

  return (
    <>
      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <aside className="border border-border bg-surface p-3">
            <div className="font-condensed mb-2 flex items-center justify-between px-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              <span>Páginas</span>
              <button
                onClick={() => setCreating((v) => !v)}
                className="text-gold hover:text-gold-dark"
                aria-label="Nueva"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {creating && (
              <div className="mb-3 space-y-2 border border-gold/40 bg-background p-2">
                <input
                  placeholder="slug (ej: faq)"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="w-full border border-border bg-background px-2 py-1 text-xs"
                />
                <input
                  placeholder="Título"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-border bg-background px-2 py-1 text-xs"
                />
                <button
                  onClick={create}
                  className="font-condensed w-full bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
                >
                  Crear
                </button>
              </div>
            )}
            <ul className="space-y-1">
              {pages.map((p) => (
                <li key={p.slug}>
                  <button
                    onClick={() => switchTo(p.slug)}
                    className={`font-ui w-full text-left px-3 py-2 text-sm transition-colors ${
                      activeSlug === p.slug
                        ? "bg-background text-gold"
                        : "text-muted-foreground hover:bg-background hover:text-foreground"
                    }`}
                  >
                    {p.title}
                    {!p.published && <span className="ml-1 text-[10px] text-muted-foreground">(borrador)</span>}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {current ? (
            <section className="border border-border bg-surface p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                    Editando
                  </div>
                  <div className="font-display text-xl tracking-widest text-gold">
                    /sobre/{activeSlug}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/sobre/$slug"
                    params={{ slug: activeSlug }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-ui inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground hover:text-gold"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Ver pública
                  </Link>
                  <button
                    onClick={() => setPreview((v) => !v)}
                    className="font-ui inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground hover:text-gold"
                  >
                    <Eye className="h-3.5 w-3.5" /> {preview ? "Editar" : "Vista previa"}
                  </button>
                  <button
                    onClick={remove}
                    className="font-ui inline-flex items-center gap-1.5 border border-destructive/40 px-3 py-1.5 text-xs font-semibold tracking-wide text-destructive hover:bg-destructive hover:text-background"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar"}
                  </button>
                </div>
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
                <div>
                  <label className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                    Título
                  </label>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    className="font-ui w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                    Publicada
                  </label>
                  <label className="flex h-[42px] items-center gap-2 border border-border bg-background px-3 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.published}
                      onChange={(e) => setDraft((d) => ({ ...d, published: e.target.checked }))}
                      className="h-4 w-4 accent-gold"
                    />
                    Visible
                  </label>
                </div>
              </div>

              {preview ? (
                <div>
                  <div className="font-condensed mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                    Vista previa
                  </div>
                  <div className="border border-border bg-background p-6">
                    {draft.content.trim() ? (
                      <div
                        className="font-ui text-base"
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(draft.content) }}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">(Sin contenido todavía)</p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                    Contenido (Markdown)
                  </label>
                  <textarea
                    value={draft.content}
                    onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                    rows={20}
                    className="font-mono w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Markdown: # ## ###, **negrita**, listas, [enlaces](https://...)</span>
                    <span>{draft.content.length} caracteres</span>
                  </div>
                </div>
              )}

              <div className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
                Última actualización: {new Date(current.updated_at).toLocaleString("es-ES")}
              </div>
            </section>
          ) : (
            <div className="border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
              Selecciona o crea una página.
            </div>
          )}
        </div>
      )}
    </>
  );
}
