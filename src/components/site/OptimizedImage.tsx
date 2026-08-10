import { useState, useEffect } from "react";
import type { ImgHTMLAttributes } from "react";

const OPTIMIZED_IMAGES: Record<string, string> = {
  "/images/Gemini_Generated_Image_f81x9ef81x9ef81x.png": "hero-main",
  "/images/Gemini_Generated_Image_v6somfv6somfv6so.png": "cta-retreat",
  "/images/DSC05333.JPG.jpeg": "mysore-hero",
  "/images/DSC05314.JPG.jpeg": "founder-retreat",
  "/images/DSC_1263.jpg": "experiences-hero",
  "/images/DSC_1319 (1).jpg": "rooms-gallery-hero",
  "/images/ROO_4542.JPG": "roof",
  "/images/DSC_1166 - Copy.jpg": "garden-portrait",
  "/images/DSC_1188.jpg": "room-portrait",
};

const WIDTHS = [640, 960, 1440, 1920];

type OptimizedImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
};

export function getOptimizedImageUrl(src: string, width = 1920) {
  const slug = OPTIMIZED_IMAGES[src];
  return slug ? `/images/optimized/${slug}-${width}.jpg` : src;
}

export function OptimizedImage({
  src,
  sizes = "100vw",
  loading = "lazy",
  decoding = "async",
  onError,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src || "/images/DSC05333.JPG.jpeg");

  useEffect(() => {
    setImgSrc(src || "/images/DSC05333.JPG.jpeg");
  }, [src]);

  const slug = OPTIMIZED_IMAGES[imgSrc];

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (imgSrc !== "/images/DSC05333.JPG.jpeg") {
      setImgSrc("/images/DSC05333.JPG.jpeg");
    }
    if (onError) onError(e);
  };

  if (!slug) {
    return (
      <img
        src={imgSrc || "/images/DSC05333.JPG.jpeg"}
        sizes={sizes}
        loading={loading}
        decoding={decoding}
        onError={handleError}
        {...props}
      />
    );
  }

  return (
    <img
      src={`/images/optimized/${slug}-1440.jpg`}
      srcSet={WIDTHS.map((width) => `/images/optimized/${slug}-${width}.jpg ${width}w`).join(", ")}
      sizes={sizes}
      loading={loading}
      decoding={decoding}
      onError={handleError}
      {...props}
    />
  );
}
