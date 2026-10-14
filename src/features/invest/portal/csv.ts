/**
 * CSV export for the invest portal — positions, orders, the cash ledger.
 * One helper, called from the section that owns the data: the file a
 * user downloads is exactly what the section shows, formatted cells and
 * all — no surprise column set that disagrees with the screen.
 */

/** RFC-4180 cell: quote when the value could swallow a comma/newline. */
function cell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
): void {
  const body = [headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
  /* BOM — Excel opens UTF-8 as mojibake without it, and the data carries
     accented names. */
  const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
