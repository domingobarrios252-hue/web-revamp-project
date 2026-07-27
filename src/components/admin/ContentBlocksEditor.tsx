import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
  Type,
  Heading as HeadingIcon,
  Image as ImageIcon,
  Images,
  Film,
  Quote,
  Minus,
} from "lucide-react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { GalleryUploadField } from "@/components/admin/GalleryUploadField";
import { NewsVideoUploadField } from "@/components/admin/NewsVideoUploadField";
import { NewsContentBlocks } from "@/components/site/NewsContentBlocks";
import {
  BLOCK_LABELS,
  createBlock,
  type NewsBlock,
  type NewsBlockType,
} from "@/lib/newsBlocks";

const TYPE_ICONS: Record<NewsBlockType, React.ComponentType<{ className?: string }>> = {
  text: Type,
  heading: HeadingIcon,
  image: ImageIcon,
  gallery: Images,
  video: Film,
  quote: Quote,
  divider: Minus,
};

const TYPE_ORDER: NewsBlockType[] = [
  "text",
  "heading",
  "image",
  "gallery",
  "video",
  "quote",
  "divider",
];

type Props = {
  value: NewsBlock[];
  onChange: (blocks: NewsBlock[]) => void;
  /** Slug o título para nombrar los archivos subidos. */
  nameHint?: string;
  /** Título de la noticia para la previsualización. */
  title?: string;
};

export function ContentBlocksEditor({ value, onChange, nameHint, title }: Props) {
  const [preview, setPreview] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const update = (index: number, patch: Partial<NewsBlock>) => {
    onChange(value.map((b, i) => (i === index ? ({ ...b, ...patch } as NewsBlock) : b)));
  };
  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const insertAt = (index: number, type: NewsBlockType) => {
    const next = [...value];
    next.splice(index, 0, createBlock(type));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
          Bloques de contenido ({value.length})
        </span>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="font-condensed inline-flex min-h-11 items-center gap-2 border border-border px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/10"
        >
          {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {preview ? "Volver a editar" : "Previsualizar"}
        </button>
      </div>

      {preview ? (
        <div className="border border-border bg-background p-4">
          {value.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">Sin bloques que previsualizar.</p>
          ) : (
            <NewsContentBlocks blocks={value} title={title || "Vista previa"} />
          )}
        </div>
      ) : (
        <>
          <AddBar onAdd={(t) => insertAt(0, t)} label="Insertar al principio" />

          {value.map((block, index) => {
            const Icon = TYPE_ICONS[block.type];
            return (
              <div key={block.id}>
                <div
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverIndex(index);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null) move(dragIndex, index);
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  className={`border bg-surface p-3 ${
                    overIndex === index && dragIndex !== null && dragIndex !== index
                      ? "border-gold"
                      : "border-border"
                  } ${dragIndex === index ? "opacity-60" : ""}`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="font-condensed inline-flex cursor-grab items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gold">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Icon className="h-3.5 w-3.5" />
                      {index + 1}. {BLOCK_LABELS[block.type]}
                    </span>
                    <div className="flex items-center gap-1">
                      <SmallBtn title="Subir" onClick={() => move(index, index - 1)}>
                        <ArrowUp className="h-4 w-4" />
                      </SmallBtn>
                      <SmallBtn title="Bajar" onClick={() => move(index, index + 1)}>
                        <ArrowDown className="h-4 w-4" />
                      </SmallBtn>
                      <SmallBtn title="Eliminar" danger onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </SmallBtn>
                    </div>
                  </div>

                  <BlockFields
                    block={block}
                    nameHint={nameHint}
                    onPatch={(patch) => update(index, patch)}
                  />
                </div>
                <AddBar onAdd={(t) => insertAt(index + 1, t)} label="Insertar aquí" />
              </div>
            );
          })}

          {value.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Añade bloques para construir el reportaje: texto → imagen → texto → vídeo… Se
              publicarán en este mismo orden. Si no añades ninguno, la noticia usará el contenido
              clásico.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function AddBar({ onAdd, label }: { onAdd: (t: NewsBlockType) => void; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-1">
      {open ? (
        <div className="flex flex-wrap items-center gap-2 border border-dashed border-gold/50 p-2">
          {TYPE_ORDER.map((t) => {
            const Icon = TYPE_ICONS[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  onAdd(t);
                  setOpen(false);
                }}
                className="font-condensed inline-flex min-h-11 items-center gap-1.5 border border-border bg-background px-3 py-2 text-[11px] uppercase tracking-widest hover:border-gold hover:text-gold"
              >
                <Icon className="h-3.5 w-3.5" /> {BLOCK_LABELS[t]}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="font-condensed px-2 py-2 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-condensed inline-flex min-h-11 w-full items-center justify-center gap-1.5 border border-dashed border-border py-2 text-[11px] uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
        >
          <Plus className="h-3.5 w-3.5" /> {label}
        </button>
      )}
    </div>
  );
}

function SmallBtn({
  children,
  title,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`inline-flex h-11 w-11 items-center justify-center border border-border hover:border-gold ${
        danger ? "text-destructive hover:border-destructive" : "text-muted-foreground hover:text-gold"
      }`}
    >
      {children}
    </button>
  );
}

function BlockFields({
  block,
  nameHint,
  onPatch,
}: {
  block: NewsBlock;
  nameHint?: string;
  onPatch: (patch: Partial<NewsBlock>) => void;
}) {
  const inputCls =
    "w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

  switch (block.type) {
    case "text":
      return (
        <textarea
          value={block.text}
          onChange={(e) => onPatch({ text: e.target.value })}
          rows={6}
          placeholder="Texto del párrafo. Admite **negrita**, *cursiva*, listas y [enlaces](https://…)."
          className={inputCls}
        />
      );

    case "heading":
      return (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={block.text}
            onChange={(e) => onPatch({ text: e.target.value })}
            placeholder="Título de la sección"
            className={inputCls}
          />
          <select
            value={block.level}
            onChange={(e) => onPatch({ level: Number(e.target.value) === 3 ? 3 : 2 })}
            className="border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none"
          >
            <option value={2}>Título (H2)</option>
            <option value={3}>Subtítulo (H3)</option>
          </select>
        </div>
      );

    case "image":
      return (
        <div className="space-y-2">
          <ImageUploadField
            value={block.url}
            onChange={(url) => onPatch({ url })}
            folder="news/blocks"
            nameHint={nameHint}
            placeholder="URL o subir imagen"
          />
          <input
            value={block.caption ?? ""}
            onChange={(e) => onPatch({ caption: e.target.value })}
            placeholder="Pie de foto (opcional)"
            className={inputCls}
          />
          <input
            value={block.alt ?? ""}
            onChange={(e) => onPatch({ alt: e.target.value })}
            placeholder="Texto alternativo (SEO y accesibilidad)"
            className={inputCls}
          />
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={(block.width ?? "normal") === "normal"}
                onChange={() => onPatch({ width: "normal" })}
                className="accent-[var(--gold,#caa15a)]"
              />
              Ancho normal
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={block.width === "full"}
                onChange={() => onPatch({ width: "full" })}
                className="accent-[var(--gold,#caa15a)]"
              />
              Ancho completo
            </label>
          </div>
        </div>
      );

    case "gallery":
      return (
        <div className="space-y-2">
          <GalleryUploadField
            value={block.images}
            onChange={(images) => onPatch({ images })}
            folder="news/blocks"
            nameHint={nameHint}
          />
          <input
            value={block.caption ?? ""}
            onChange={(e) => onPatch({ caption: e.target.value })}
            placeholder="Pie de galería (opcional)"
            className={inputCls}
          />
        </div>
      );

    case "video":
      return (
        <div className="space-y-2">
          <NewsVideoUploadField
            value={block.fileUrl ?? ""}
            onChange={(fileUrl) => onPatch({ fileUrl })}
            nameHint={nameHint}
          />
          <input
            value={block.embedUrl ?? ""}
            onChange={(e) => onPatch({ embedUrl: e.target.value })}
            placeholder="URL o embed externo (YouTube, Vimeo, Facebook, Twitch…)"
            className={inputCls}
          />
          <ImageUploadField
            value={block.posterUrl ?? ""}
            onChange={(posterUrl) => onPatch({ posterUrl })}
            folder="news/blocks"
            nameHint={nameHint}
            placeholder="Miniatura del vídeo (opcional)"
          />
          <input
            value={block.caption ?? ""}
            onChange={(e) => onPatch({ caption: e.target.value })}
            placeholder="Pie del vídeo (opcional)"
            className={inputCls}
          />
        </div>
      );

    case "quote":
      return (
        <div className="space-y-2">
          <textarea
            value={block.text}
            onChange={(e) => onPatch({ text: e.target.value })}
            rows={3}
            placeholder="Texto de la cita"
            className={inputCls}
          />
          <input
            value={block.author ?? ""}
            onChange={(e) => onPatch({ author: e.target.value })}
            placeholder="Autor de la cita (opcional)"
            className={inputCls}
          />
        </div>
      );

    case "divider":
      return <hr className="border-border" />;
  }
}
