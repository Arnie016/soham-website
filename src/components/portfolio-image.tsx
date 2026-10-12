import type { ImgHTMLAttributes } from "react";
export function portfolioResolution(src: string, width = 3840) {
  return src
    .replace("/portfolio/", "/portfolio-hd/")
    .replace(/\.jpg$/, `-${width}.webp`);
}
export function PortfolioImage({
  src,
  alt,
  sizes = "(max-width: 700px) 100vw, 55vw",
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) {
  return (
    <img
      {...props}
      src={portfolioResolution(src, 1600)}
      srcSet={[800, 1600, 3840]
        .map((width) => `${portfolioResolution(src, width)} ${width}w`)
        .join(", ")}
      sizes={sizes}
      alt={alt}
      decoding="async"
    />
  );
}
