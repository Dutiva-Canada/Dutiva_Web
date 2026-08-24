/**
 * Preset Tailwind height classes for chart plot wrappers — literals only so
 * Tailwind extracts them and CSP stays free of inline height styles.
 */

const JBARS_BY_ROWS: Record<number, string> = {}
for (let rows = 1; rows <= 24; rows += 1) {
  const px = rows * 38 + 12
  JBARS_BY_ROWS[rows] = `h-[${px}px]`
}

const HBAR_BY_ROWS: Record<number, string> = {}
for (let rows = 1; rows <= 24; rows += 1) {
  const px = Math.max(160, rows * 44 + 48)
  HBAR_BY_ROWS[rows] = `h-[${px}px]`
}

const PLOT_HEIGHT: Record<number, string> = {}
for (let px = 120; px <= 400; px += 4) {
  PLOT_HEIGHT[px] = `h-[${px}px]`
}

export function jurisdictionBarsHeightClass(rowCount: number): string {
  const rows = Math.max(1, Math.min(24, rowCount))
  return JBARS_BY_ROWS[rows] ?? 'h-[200px]'
}

export function hbarPlotHeightClass(rowCount: number): string {
  const rows = Math.max(1, Math.min(24, rowCount))
  return HBAR_BY_ROWS[rows] ?? 'h-[260px]'
}

export function chartPlotHeightClass(px: number): string {
  const rounded = Math.max(120, Math.min(400, Math.round(px / 4) * 4))
  return PLOT_HEIGHT[rounded] ?? 'h-[260px]'
}
