import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, ExternalLink, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { renderMarkdown } from "@/lib/markdown";

type LegalPage = {
  id: string;
  slug: string;
  title: string;
  content: string;
  updated_at: string;
};

const SLUG_LABELS: Record<string, string> = {
  privacidad: "Política de Privacidad",
  "aviso-legal": "Aviso Legal",
  cookies: "Política de Cookies",
};

export const Route = createFileRoute("/admin/legal")({
  head: () => ({
    meta: [
      { title: "Admin · Páginas legales" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLegal,
});

function AdminLegal() {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>("privacidad");
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("legal_pages")
      .select("*")
      .order("slug");
    if (error) {
      toast.error("No se pudieron cargar las páginas legales");
      setLoading(false);
      return;
    }
    const list = (data ?? []) as LegalPage[];
    setPages(list);
    const current = list.find((p) => p.slug === activeSlug) ?? list[0];
    if (current) {
      setActiveSlug(current.slug);
      setDraft({ title: current.title, content: current.content });
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
    setDraft({ title: p.title, content: p.content });
    setPreview(false);
  };

  const save = async () => {
    const title = draft.title.trim();
    if (title.length < 2) {
      toast.error("El título es obligatorio");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("legal_pages")
      .update({ title, content: draft.content })
      .eq("slug", activeSlug);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Página guardada");
    load();
  };

  const current = pages.find((p) => p.slug === activeSlug);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-widest">PÁGINAS LEGALES</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edita el contenido de las páginas legales. Soporta{" "}
            <span className="font-mono text-gold">Markdown</span> (## títulos, **negrita**,
            listas, [enlaces](https://...)).
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          {/* Tab list */}
          <aside className="border border-border bg-surface p-3">
            <div className="font-condensed mb-2 px-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              Páginas
            </div>
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
                    {SLUG_LABELS[p.slug] ?? p.title}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Editor */}
          <section className="border border-border bg-surface p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                  Editando
                </div>
                <div className="font-display text-xl tracking-widest text-gold">
                  /{activeSlug}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/legal/$slug"
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
                  onClick={save}
                  disabled={saving}
                  className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>

            <div className="mb-4">
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
                    <p className="text-sm text-muted-foreground">
                      (Sin contenido todavía)
                    </p>
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
                  rows={24}
                  className="font-mono w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
                  placeholder={`## Sección\n\nTexto del párrafo. Usa **negrita**, *cursiva* y [enlaces](https://...).\n\n- Lista\n- De\n- Puntos\n`}
                />
                <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Markdown soportado: # ## ###, **negrita**, *cursiva*, listas (- o 1.),
                    [enlaces](https://...), --- (separador)
                  </span>
                  <span>{draft.content.length} caracteres</span>
                </div>
              </div>
            )}

            {current && (
              <div className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
                Última actualización:{" "}
                {new Date(current.updated_at).toLocaleString("es-ES")}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
