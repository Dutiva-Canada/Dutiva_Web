const PIPE_ROW = /^\s*\|.*$/
const SEPARATOR_ROW = /^[\s|:-]+$/

/**
 * While a reply streams in, a half-arrived table has no separator row yet, so
 * Markdown renders it as a paragraph of pipes — which then snaps into a table.
 * Hiding that trailing fragment until the separator lands removes the flicker.
 */
export function hideIncompleteTable(markdown: string): string {
  const lines = markdown.split('\n')

  let end = lines.length
  while (end > 0 && (lines[end - 1] ?? '').trim() === '') end -= 1

  let start = end
  while (start > 0 && PIPE_ROW.test(lines[start - 1] ?? '')) start -= 1

  if (start >= end) return markdown

  const tail = lines.slice(start, end)
  const settled = tail.some(
    (line) => SEPARATOR_ROW.test(line) && line.includes('-') && line.includes('|'),
  )

  return settled ? markdown : lines.slice(0, start).join('\n')
}
