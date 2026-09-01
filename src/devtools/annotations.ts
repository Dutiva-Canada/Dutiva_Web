/**
 * Data model + persistence + AI-brief formatting for the Dev Annotations
 * overlay. The `buildBrief` output is the whole point: a clean, file-anchored
 * summary you paste into an AI chat so it knows exactly what to change and
 * where.
 */

export interface Annotation {
  id: string
  /** Route the note was taken on (window.location.pathname). */
  route: string
  /** Repo-relative source path, when available (dev/preview stamping). */
  file: string | null
  line: number | null
  /** Component name derived from the file, when available. */
  component: string | null
  /** Human-readable element description (tag / testid / label). */
  element: string
  /** Best-effort selector for the "Locate" action. */
  selector: string
  /** The developer's note. */
  note: string
  createdAt: number
}

export const NOTES_KEY = 'dutiva-dev-annotations'
export const ENABLED_KEY = 'dutiva-dev-enabled'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Drop corrupt entries; coerce optional fields so brief formatting never throws. */
function sanitizeNote(raw: unknown): Annotation | null {
  if (!isRecord(raw)) return null
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null
  if (typeof raw.route !== 'string') return null
  if (typeof raw.element !== 'string') return null
  if (typeof raw.selector !== 'string') return null

  return {
    id: raw.id,
    route: raw.route,
    file: typeof raw.file === 'string' ? raw.file : null,
    line:
      typeof raw.line === 'number' && Number.isInteger(raw.line) && raw.line > 0
        ? raw.line
        : null,
    component: typeof raw.component === 'string' ? raw.component : null,
    element: raw.element,
    selector: raw.selector,
    note: typeof raw.note === 'string' ? raw.note : '',
    createdAt:
      typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : 0,
  }
}

/** localStorage read that never throws (private mode, quota, SSR). */
export function loadNotes(): Annotation[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(sanitizeNote).filter((note): note is Annotation => note !== null)
  } catch {
    return []
  }
}

export function saveNotes(notes: Annotation[]): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
  } catch {
    /* Best-effort — persistence is a convenience, not a requirement. */
  }
}

export function loadEnabled(fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(ENABLED_KEY)
    return raw === null ? fallback : raw === '1'
  } catch {
    return fallback
  }
}

export function saveEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0')
  } catch {
    /* Ignore — see saveNotes. */
  }
}

/** One line per note: `File.tsx:line` · `element` — note. */
function formatNote(note: Annotation): string {
  const where = note.file
    ? `\`${note.file}${note.line ? `:${note.line}` : ''}\``
    : note.component
      ? `\`${note.component}\``
      : '`(unknown source)`'
  const text = note.note.trim() || '(no note)'
  return `- ${where} · \`${note.element}\` — ${text}`
}

/**
 * Render all notes as a Markdown brief grouped by route, ready to paste into
 * an AI conversation. Returns a friendly placeholder when there are none.
 */
export function buildBrief(notes: Annotation[]): string {
  if (notes.length === 0) return 'No annotations yet.'

  const byRoute = new Map<string, Annotation[]>()
  for (const note of notes) {
    const list = byRoute.get(note.route)
    if (list) list.push(note)
    else byRoute.set(note.route, [note])
  }

  const sections: string[] = []
  for (const route of [...byRoute.keys()].sort()) {
    const lines = byRoute
      .get(route)!
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(formatNote)
    sections.push(`## ${route}\n${lines.join('\n')}`)
  }

  const count = notes.length
  const header = `# Requested changes (${count} annotation${count === 1 ? '' : 's'})`
  return `${header}\n\n${sections.join('\n\n')}\n`
}
