// Shared types & helpers for manual image crop metadata.
// We never modify the original file — only store framing info per ratio.

export type CropRatio = "hero" | "card" | "thumb" | "portrait";

export const CROP_RATIOS: { key: CropRatio; label: string; aspect: number; ratioText: string }[] = [
  { key: "hero", label: "Hero", aspect: 16 / 9, ratioText: "16:9" },
  { key: "card", label: "Card", aspect: 3 / 2, ratioText: "3:2" },
  { key: "thumb", label: "Miniatura", aspect: 1, ratioText: "1:1" },
  { key: "portrait", label: "Retrato", aspect: 4 / 5, ratioText: "4:5" },
];

/** Percent-based crop area returned by react-easy-crop (0–100). */
export type CropArea = { x: number; y: number; width: number; height: number };

/** Stored shape: { hero: CropArea, card: CropArea, ... }. Missing keys = default centered. */
export type ImageCrops = Partial<Record<CropRatio, CropArea>>;

/**
 * For object-cover layouts, return an `object-position` value centered on
 * the saved crop. Lets a single original adapt to arbitrary card aspects
 * while still respecting the editor's framing choice.
 */
export function cropObjectPosition(
  crops: ImageCrops | null | undefined,
  ratio: CropRatio
): string {
  const area = crops?.[ratio];
  if (!area || area.width <= 0 || area.height <= 0) return "center";
  const cx = area.x + area.width / 2;
  const cy = area.y + area.height / 2;
  return `${cx.toFixed(2)}% ${cy.toFixed(2)}%`;
}

/** Best-fit ratio for a container aspect (width / height). */
export function bestRatioForAspect(aspect: number): CropRatio {
  // Closest of our 4 ratios
  let best: CropRatio = "card";
  let bestDelta = Infinity;
  for (const r of CROP_RATIOS) {
    const d = Math.abs(Math.log(aspect) - Math.log(r.aspect));
    if (d < bestDelta) {
      bestDelta = d;
      best = r.key;
    }
  }
  return best;
}

