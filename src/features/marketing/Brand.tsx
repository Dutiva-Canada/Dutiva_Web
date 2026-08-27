/**
 * Brand lockup pieces shared by the landing header, mobile drawer and footer.
 * The leaf mark always sits on a white gradient tile (per prototype) so it
 * reads identically in both themes; the wordmark is text — never redrawn.
 */

import { MarketingRaster } from './MarketingRaster'

type LeafTileVariant = 'header' | 'drawer' | 'footer'

const LEAF_TILE_CLASS: Record<LeafTileVariant, string> = {
  header: 'leaf-tile leaf-tile-header',
  drawer: 'leaf-tile leaf-tile-drawer',
  footer: 'leaf-tile leaf-tile-footer',
}

const LEAF_IMG_CLASS: Record<LeafTileVariant, string> = {
  header: 'leaf-img-header',
  drawer: 'leaf-img-drawer',
  footer: 'leaf-img-footer',
}

interface LeafTileProps {
  readonly variant: LeafTileVariant
}

export function LeafTile({ variant }: LeafTileProps) {
  return (
    <span className={LEAF_TILE_CLASS[variant]}>
      <MarketingRaster
        src="/brand/dutiva-leaf.png"
        alt="Dutiva"
        className={LEAF_IMG_CLASS[variant]}
        loading={variant === 'header' ? 'eager' : 'lazy'}
        fetchPriority={variant === 'header' ? 'high' : undefined}
      />
    </span>
  )
}

export function Wordmark({ size = 'lg' }: { readonly size?: 'lg' | 'drawer' }) {
  return (
    <span className={`font-display font-bold text-text ${size === 'drawer' ? 'wordmark-drawer' : 'wordmark-lg'}`}>
      Duti<span className="text-gold-strong">va</span>
    </span>
  )
}
