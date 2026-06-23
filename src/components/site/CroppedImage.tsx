import type { CSSProperties } from "react";
import { CROP_RATIOS, type CropRatio, type ImageCrops } from "@/lib/imageCrops";

type Props = {
  src: string;
  alt: string;
  /** Stored crop metadata for this image. */
  crops?: ImageCrops | null;
  /** Which ratio to render. */
  ratio: CropRatio;
  className?: string;
  imgClassName?: string;
  loading?: "lazy" | "eager";
  /** If true and no crop metadata for this ratio exists, fall back to object-cover centered. */
  fallbackCenter?: boolean;
};

/**
 * Renders the source image inside a fixed-aspect container, framed according
 * to stored crop metadata. The original file is never modified.
 *
 * Implementation: we render the original <img> absolutely positioned and
 * scale/translate it so the saved crop window fills the container.
 */
export function CroppedImage({
  src,
  alt,
  crops,
  ratio,
  className = "",
  imgClassName = "",
  loading = "lazy",
  fallbackCenter = true,
}: Props) {
  const meta = CROP_RATIOS.find((r) => r.key === ratio)!;
  const area = crops?.[ratio];

  const wrapperStyle: CSSProperties = {
    aspectRatio: `${meta.aspect}`,
  };

  if (!area || area.width <= 0 || area.height <= 0) {
    return (
      <div
        className={`relative w-full overflow-hidden ${className}`}
        style={wrapperStyle}
      >
        <img
          src={src}
          alt={alt}
          loading={loading}
          className={`absolute inset-0 h-full w-full ${
            fallbackCenter ? "object-cover" : "object-contain"
          } ${imgClassName}`}
        />
      </div>
    );
  }

  // The crop window is `area` (percent of original image).
  // Render the image at scale = 100 / area.width on width axis so the crop
  // window fills the container width. Same for height — both should be
  // consistent because the crop already matches the container aspect.
  const scaleX = 100 / area.width;
  const scaleY = 100 / area.height;

  // Compose width/height as percentages of the container.
  // We size the <img> to (scale * 100)% and translate it so the crop origin
  // aligns with the container's (0,0).
  const imgStyle: CSSProperties = {
    position: "absolute",
    width: `${scaleX * 100}%`,
    height: `${scaleY * 100}%`,
    left: `${-area.x * scaleX}%`,
    top: `${-area.y * scaleY}%`,
    maxWidth: "none",
    objectFit: "cover",
  };

  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={wrapperStyle}>
      <img src={src} alt={alt} loading={loading} style={imgStyle} className={imgClassName} />
    </div>
  );
}
