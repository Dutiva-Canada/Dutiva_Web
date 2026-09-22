/**
 * Meta description for a job posting: whitespace normalized, truncated at a
 * word boundary inside the 155-char SERP window instead of mid-word with
 * raw newlines.
 */
export function seoDescription(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= 155) return clean
  const cut = clean.slice(0, 155)
  const lastSpace = cut.lastIndexOf(' ')
  const bounded = lastSpace > 80 ? cut.slice(0, lastSpace) : cut
  return `${bounded.replace(/[\s.,;:!?—–-]+$/, '')}…`
}
