/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import type { ImgHTMLAttributes } from 'react'

type MarketingRasterProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  readonly src: string
}

/** Marketing `<picture>` with a WebP sibling under `/brand/` and PNG/JPG fallback. */
export function MarketingRaster({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  ...rest
}: MarketingRasterProps) {
  const webp = src.replace(/\.(png|jpe?g)$/i, '.webp')
  return (
    <picture>
      <source type="image/webp" srcSet={webp} />
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        {...rest}
      />
    </picture>
  )
}
