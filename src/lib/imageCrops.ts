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
 * Convert a stored CropArea (percent of original image) into CSS
 * { objectPosition, transform } that frames the original image inside a
 * fixed-aspect container. The container should already have the target ratio.
 *
 * Strategy: the visible window inside the original is (width%, height%) at
 * (x%, y%). Render the original at scale = 100/visibleW (so the cropped window
 * fills the container width), and translate so the crop's top-left aligns
 * with the container's top-left.
 */
export function cropToBackground(area: CropArea | undefined): React.CSSProperties {
  if (!area || area.width <= 0 || area.height <= 0) {
    return { objectFit: "cover", objectPosition: "center" };
  }
  // Use background-image style positioning instead — applied on a wrapper div.
  // (We use the <img> + transform approach in CroppedImage.)
  return {};
}
