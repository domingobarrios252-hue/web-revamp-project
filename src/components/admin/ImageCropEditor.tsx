import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { CROP_RATIOS, type CropArea, type CropRatio, type ImageCrops } from "@/lib/imageCrops";

type Props = {
  imageUrl: string;
  value: ImageCrops;
  onChange: (next: ImageCrops) => void;
  onClose: () => void;
};

/**
 * Modal-style editor that lets the admin frame the same source image
 * once per ratio. Stores only metadata — never re-uploads the file.
 */
export function ImageCropEditor({ imageUrl, value, onChange, onClose }: Props) {
  const [activeRatio, setActiveRatio] = useState<CropRatio>("hero");
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pending, setPending] = useState<ImageCrops>(value);

  const activeMeta = CROP_RATIOS.find((r) => r.key === activeRatio)!;

  const onCropComplete = useCallback(
    (_: CropArea, areaPx: CropArea, areaPct?: CropArea) => {
      // react-easy-crop v6 callback signature: (croppedArea, croppedAreaPixels)
      // The first arg is already in percent. Use it directly.
      const pct = areaPct ?? _;
      setPending((prev) => ({ ...prev, [activeRatio]: pct }));
    },
    [activeRatio]
  );

  const switchRatio = (key: CropRatio) => {
    setActiveRatio(key);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const reset = () => {
    setPending((prev) => {
      const next = { ...prev };
      delete next[activeRatio];
      return next;
    });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const save = () => {
    onChange(pending);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col border border-border bg-background">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-display text-sm uppercase tracking-widest text-gold">
            Editar encuadre
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="font-condensed text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
        </header>

        <div className="flex flex-wrap gap-1 border-b border-border px-4 py-2">
          {CROP_RATIOS.map((r) => {
            const has = !!pending[r.key];
            const active = r.key === activeRatio;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => switchRatio(r.key)}
                className={`font-condensed px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${
                  active
                    ? "bg-gold text-background"
                    : "border border-border text-muted-foreground hover:text-gold"
                }`}
              >
                {r.label} · {r.ratioText}
                {has && !active && <span className="ml-1.5 text-gold">●</span>}
              </button>
            );
          })}
        </div>

        <div className="relative h-[55vh] w-full bg-black">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={activeMeta.aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
            restrictPosition={false}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex flex-1 items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            Zoom
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[var(--gold,#caa15a)]"
            />
            <span className="w-10 text-right text-foreground">{zoom.toFixed(2)}×</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="font-condensed border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-destructive"
            >
              Quitar este ratio
            </button>
            <button
              type="button"
              onClick={save}
              className="font-condensed bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:opacity-90"
            >
              Guardar encuadres
            </button>
          </div>
        </div>

        <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          La imagen original no se modifica. Solo guardamos los metadatos del recorte por ratio
          (Hero 16:9 para portadas, Card 3:2 para tarjetas, Miniatura 1:1, Retrato 4:5).
        </p>
      </div>
    </div>
  );
}
