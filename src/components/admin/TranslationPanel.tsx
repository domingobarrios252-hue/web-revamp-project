import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Languages, Loader2, RefreshCw, Save, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  approveNewsTranslation,
  getNewsTranslation,
  saveNewsTranslation,
  translateNews,
} from "@/lib/news/translations.functions";
import { sourceHash, type NewsTranslation } from "@/lib/news/translations";
import { cleanBlocks, parseBlocks, type NewsBlock } from "@/lib/newsBlocks";

import { extractTranslationFields, restoreTranslationFields } from "@/lib/news/translationFields";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";
const labelCls = "font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador (no visible)",
  pending: "Pendiente de aprobación",
  approved: "Aprobada y publicada",
};

/**
 * Panel «Versión en inglés» del editor de noticias.
 * Genera la traducción con IA (servidor), permite revisarla y guardarla;
 * solo un administrador puede aprobarla para que sea pública.
 */
export function TranslationPanel({
  newsId,
  source,
}: {
  newsId: string;
  source: { title: string; excerpt: string; blocks: NewsBlock[] };
}) {
  const [tr, setTr] = useState<NewsTranslation | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"translate" | "save" | "approve" | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchTranslation = useServerFn(getNewsTranslation);
  const runTranslate = useServerFn(translateNews);
  const runSave = useServerFn(saveNewsTranslation);
  const runApprove = useServerFn(approveNewsTranslation);

  const currentHash = useMemo(
    () =>
      sourceHash({
        title: source.title,
        excerpt: source.excerpt,
        content: cleanBlocks(source.blocks).filter(b => b.type === "text" || b.type === "heading").map(b => (b as { text: string }).text).join("\n\n") || null,
        content_blocks: cleanBlocks(source.blocks),
      }),
    [source.title, source.excerpt, source.blocks],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { translation } = await fetchTranslation({ data: { newsId } });
      setTr(translation);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fetchTranslation, newsId]);

  useEffect(() => {
    void load();
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      const { data: ok } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
      setIsAdmin(ok === true);
    });
  }, [load]);

  const outdated = Boolean(tr && (!tr.source_hash || tr.source_hash !== currentHash));

  const generate = async () => {
    setBusy("translate");
    try {
      const { translation } = await runTranslate({ data: { newsId } });
      setTr(translation);
      toast.success("Traducción generada. Revísala antes de aprobarla.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (!tr) return;
    setBusy("save");
    try {
      const { translation } = await runSave({
        data: {
          newsId,
          sourceHash: currentHash,
          title: tr.title,
          subtitle: tr.subtitle,
          excerpt: tr.excerpt,
          content: tr.content,
          content_blocks: Array.isArray(tr.content_blocks)
            ? (tr.content_blocks as Record<string, unknown>[])
            : [],
          seo_title: tr.seo_title,
          seo_description: tr.seo_description,
        },
      });
      setTr(translation);
      toast.success("Traducción guardada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const approve = async (approveFlag: boolean) => {
    setBusy("approve");
    try {
      const { translation } = await runApprove({ data: { newsId, approve: approveFlag } });
      setTr(translation);
      toast.success(approveFlag ? "Traducción aprobada y visible en /en/news/" : "Traducción retirada de la vista pública");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const upd = (patch: Partial<NewsTranslation>) => setTr((prev) => (prev ? { ...prev, ...patch } : prev));

  return (
    <section className="space-y-3 border border-border bg-surface p-4">
      <h3 className="font-condensed flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
        <Languages className="h-3.5 w-3.5" /> Versión en inglés
      </h3>

      {loading ? (
        <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando…
        </p>
      ) : (
        <>
          <p className="text-[11px] text-muted-foreground">
            {tr ? STATUS_LABEL[tr.status] ?? tr.status : "Sin traducción todavía."}
            {outdated && (
              <span className="mt-1 block font-bold text-gold">
                El original cambió: la traducción necesita actualizarse.
              </span>
            )}
          </p>

          <Button variant="outline"
            type="button"
            onClick={() => void generate()}
            disabled={busy !== null}
            className="font-condensed inline-flex min-h-11 w-full items-center justify-center gap-2 border border-gold px-3 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold/10 disabled:opacity-50"
          >
            {busy === "translate" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {tr ? "Regenerar con IA" : "Generar versión en inglés"}
          </Button>

          {tr && (
            <>
              <label className="block">
                <span className={labelCls}>Titular (EN)</span>
                <textarea rows={2} value={tr.title} onChange={(e) => upd({ title: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>Subtítulo (EN)</span>
                <textarea rows={2} value={tr.subtitle ?? ""} onChange={(e) => upd({ subtitle: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>Entradilla (EN)</span>
                <textarea rows={3} maxLength={500} value={tr.excerpt ?? ""} onChange={(e) => upd({ excerpt: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>Cuerpo (EN, texto plano)</span>
                <textarea rows={8} value={tr.content ?? ""} onChange={(e) => upd({ content: e.target.value })} className={inputCls} />
              </label>
              {extractTranslationFields(parseBlocks(tr.content_blocks)).map(field => (
                <label key={field.key} className="block">
                  <span className={labelCls}>Bloque EN · {field.key}</span>
                  <textarea rows={3} value={field.value} className={inputCls} onChange={e => {
                    const blocks = parseBlocks(tr.content_blocks);
                    const fields = extractTranslationFields(blocks).map(f => f.key === field.key ? { ...f, value: e.target.value } : f);
                    upd({ content_blocks: restoreTranslationFields(blocks, fields) as unknown as NewsTranslation["content_blocks"] });
                  }} />
                </label>
              ))}
              <label className="block">
                <span className={labelCls}>Título SEO (EN, máx. 60)</span>
                <input maxLength={60} value={tr.seo_title ?? ""} onChange={(e) => upd({ seo_title: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>Descripción SEO (EN, máx. 155)</span>
                <textarea rows={2} maxLength={155} value={tr.seo_description ?? ""} onChange={(e) => upd({ seo_description: e.target.value })} className={inputCls} />
              </label>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline"
                  type="button"
                  onClick={() => void save()}
                  disabled={busy !== null}
                  className="font-condensed inline-flex min-h-11 flex-1 items-center justify-center gap-2 border border-border px-3 text-xs font-bold uppercase tracking-widest hover:border-gold hover:text-gold disabled:opacity-50"
                >
                  {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar
                </Button>
                {isAdmin && tr.status !== "approved" && (
                  <Button variant="outline"
                    type="button"
                    onClick={() => void approve(true)}
                    disabled={busy !== null || outdated}
                    className="font-condensed inline-flex min-h-11 flex-1 items-center justify-center gap-2 bg-gold px-3 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
                  >
                    {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Aprobar
                  </Button>
                )}
                {isAdmin && tr.status === "approved" && (
                  <Button variant="outline"
                    type="button"
                    onClick={() => void approve(false)}
                    disabled={busy !== null}
                    className="font-condensed inline-flex min-h-11 flex-1 items-center justify-center gap-2 border border-border px-3 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold disabled:opacity-50"
                  >
                    Retirar
                  </Button>
                )}
              </div>
              {!isAdmin && (
                <p className="text-[11px] text-muted-foreground">
                  La aprobación final corresponde al administrador.
                </p>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
