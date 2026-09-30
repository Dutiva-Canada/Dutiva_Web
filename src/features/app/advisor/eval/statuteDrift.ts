import { STATUTE_REGISTRY } from './statuteRegistry'
import { ADVISOR_CORPUS_SNAPSHOT } from './advisorCorpusSnapshot'

/**
 * § Statute-drift check — periodic re-verification that the sections the
 * registry and corpus cite still exist in the official consolidated texts.
 *
 * The golden eval proves the corpus is internally consistent; it cannot see
 * a statute amendment that lands after a snapshot (a repealed section, a
 * renumbered Part, a changed figure). This check fetches each registry
 * sourceUrl and verifies:
 *
 *   1. every registry `section` still exists as a heading in the live text,
 *   2. figure-bearing rules still carry their figures (STATUTE_MARKERS),
 *   3. every section named in a corpus `effective_note` resolves against the
 *      act the note names.
 *
 * Sources are the same official sites cited in the registry — e-Laws (JSON
 * document API), LégisQuébec, and Justice laws-lois FullText. Run manually
 * via `npm run check:statute-drift`; the Woodpecker `statute-drift.yml`
 * pipeline runs it on cron/manual so drift surfaces between releases, not
 * inside the deterministic gate.
 */

export interface SourceFetch {
  url: string
  status: 'fetched' | 'failed'
  bytes: number
  detail?: string
  /** HTML stripped to plain text, indexed for section lookups. */
  html: string
  text: string
}

export type DriftKind =
  | 'section-missing'
  | 'marker-missing'
  | 'source-unreachable'
  | 'cite-missing'
  | 'cite-unattributed'

export interface DriftFinding {
  kind: DriftKind
  ref?: string
  /** Corpus row identifier for cite findings: `jurisdiction/topic`. */
  row?: string
  detail: string
}

export interface EntryCheck {
  ref: string
  section: string | null
  status: 'ok' | 'drift' | 'unverified'
  detail?: string
}

export interface StatuteDriftReport {
  generatedAt: string
  sources: Omit<SourceFetch, 'html' | 'text'>[]
  entries: EntryCheck[]
  corpusCites: EntryCheck[]
  findings: DriftFinding[]
  summary: { checked: number; ok: number; drift: number; unverified: number }
}

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const FETCH_TIMEOUT_MS = 30_000
const RETRY_DELAY_MS = 2_000

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
}

/* ------------------------------------------------------------------ */
/* Source adapters — one per official-site family.                     */
/* ------------------------------------------------------------------ */

type SourceFamily = 'elaws' | 'legisquebec' | 'laws-lois'

function familyOf(url: string): SourceFamily | null {
  if (/ontario\.ca\/laws\//.test(url)) return 'elaws'
  if (/legisquebec\.gouv\.qc\.ca\//.test(url)) return 'legisquebec'
  if (/laws-lois\.justice\.gc\.ca\//.test(url)) return 'laws-lois'
  return null
}

async function fetchText(url: string): Promise<{ ok: boolean; html: string; bytes: number; detail?: string }> {
  /* e-Laws serves a JS shell on the statute URL; the consolidated document
     lives behind its v2 JSON API: doc-search/{statute|regulation}/{id}. */
  const elaws = url.match(/ontario\.ca\/laws\/(statute|regulation)\/([a-z0-9]+)/i)
  const elawsKind = elaws?.[1]?.toLowerCase()
  const elawsId = elaws?.[2]
  /* laws-lois serves a TOC on the act URL; FullText.html is the whole act. */
  const target =
    elawsKind && elawsId
      ? `https://www.ontario.ca/laws/api/v2/legislation/en/doc-search/${elawsKind}/${elawsId}`
      : /laws-lois\.justice\.gc\.ca\//.test(url)
        ? url.replace(/\/?$/, '/') + 'FullText.html'
        : url
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      let res = await fetch(target, {
        headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html,application/json' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        redirect: 'follow',
      })
      /* e-Laws public ids carry the schedule letter (WSIA is 97w16a =
         "c. 16, Sched. A") but the doc-search API indexes the chapter —
         on a 404 retry once with the trailing letter dropped. */
      if (!res.ok && res.status === 404 && elawsId && /[0-9][a-z]$/i.test(elawsId)) {
        res = await fetch(target.replace(elawsId, elawsId.replace(/[a-z]$/i, '')), {
          headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html,application/json' },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          redirect: 'follow',
        })
      }
      if (!res.ok) return { ok: false, html: '', bytes: 0, detail: `HTTP ${res.status}` }
      const raw = await res.text()
      const html = elaws ? (JSON.parse(raw) as { content?: string }).content ?? '' : raw
      return { ok: true, html, bytes: html.length }
    } catch (e) {
      if (attempt === 1) return { ok: false, html: '', bytes: 0, detail: String(e).slice(0, 160) }
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
    }
  }
  return { ok: false, html: '', bytes: 0 }
}

/* ------------------------------------------------------------------ */
/* Section matchers — how each publisher marks a section heading.       */
/*   e-Laws:       TOC anchors carry  title="Section 61."               */
/*   LégisQuébec:  section ids are    id="se:79_1"  (dot → underscore)  */
/*   laws-lois:    section ids are    id="s-174"                        */
/* ------------------------------------------------------------------ */

function hasSection(doc: SourceFetch, section: string): boolean {
  const family = familyOf(doc.url)
  const n = esc(section)
  if (family === 'elaws')
    /* Statutes carry TOC anchors `title="Section 61."`; regulations
       (e.g. O. Reg. 288/01) have no TOC titles — their headings are
       `<b><a name="BK#"></a>2.</b>` or plain `<b>2.</b>`. */
    return (
      new RegExp(`title="Section ${n}\\.?"`).test(doc.html) ||
      new RegExp(`<b>\\s*(?:<a name="BK[0-9]+"></a>\\s*)?${n}\\.</b>`).test(doc.html)
    )
  if (family === 'legisquebec') return doc.html.includes(`id="se:${section.replace(/\./g, '_')}"`)
  if (family === 'laws-lois') return doc.html.includes(`id="s-${section}"`)
  return false
}

/** Plain-text slice starting at the section heading — where markers live. */
function sectionBody(doc: SourceFetch, section: string): string | null {
  const family = familyOf(doc.url)
  let i = -1
  if (family === 'elaws') {
    /* Body headings are <a name="BK#"></a><b>N </b> — find via the TOC href
       for statutes, or the heading itself for TOC-less regulations. */
    const n = esc(section)
    const anchor = doc.html.match(new RegExp(`href="#(BK[0-9]+)" title="Section ${n}\\.?"`))
    if (anchor) {
      i = doc.html.indexOf(`name="${anchor[1]}"`)
    } else {
      const heading = doc.html.match(new RegExp(`<b>\\s*(?:<a name="BK[0-9]+"></a>\\s*)?${n}\\.</b>`))
      i = heading?.index ?? -1
    }
  } else if (family === 'legisquebec') {
    i = doc.html.indexOf(`id="se:${section.replace(/\./g, '_')}"`)
  } else if (family === 'laws-lois') {
    i = doc.html.indexOf(`id="s-${section}"`)
  }
  return i < 0 ? null : stripHtml(doc.html.slice(i, i + 6_000))
}

/** Expand a registry `section` field: '63-64' → ['63','64'],
   '247.5(1.1)' → ['247.5'], null → []. Subsection parens are dropped —
   the publishers anchor whole sections, not paragraphs. */
export function expandSection(section: string | null): string[] {
  if (!section) return []
  const bare = section.replace(/\(.*\)$/, '')
  const range = bare.match(/^(\d+(?:\.\d+)*)-(\d+(?:\.\d+)*)$/)
  return range && range[1] && range[2] ? [range[1], range[2]] : [bare]
}

/* ------------------------------------------------------------------ */
/* Figure markers — substrings (regex sources) that must still appear   */
/* in the cited section's text. Each was taken from the consolidated    */
/* text itself on 2026-09-30; a miss means the rule moved or changed.   */
/* ------------------------------------------------------------------ */

export const STATUTE_MARKERS: Record<string, readonly string[]> = {
  'ON_ESA:57': ['eight weeks'],
  'ON_ESA:22': ['one and one-half times', '44 hours'],
  'ON_ESA:49.7': ['domestic or sexual violence', '15 weeks'],
  'ON_ESA:50': ['three days'],
  'QC_LNT:82': ['eight weeks'],
  'QC_LNT:52': ['40'],
  'QC_LNT:55': ['50'],
  'QC_LNT:79.1': ['26 weeks'],
  'FED_CLC:169': ['eight hours'],
  'FED_CLC:230': ['two weeks'],
  'FED_CLC:174': ['one and one-half'],
}

/* ------------------------------------------------------------------ */
/* Corpus-cite cross-check — attribute each section cite in an          */
/* effective_note to the most recently named act, then verify it exists. */
/* ------------------------------------------------------------------ */

interface ActPattern {
  act: string
  url: string
  pattern: RegExp
}

/* Order matters — longest/most specific names first so "Canada Labour
   Standards Regulations" isn't claimed by the LNT pattern, and
   "O. Reg. 288/01" isn't swallowed by the ESA abbreviation. */
const ACT_PATTERNS: ActPattern[] = [
  {
    act: 'Canada Labour Standards Regulations',
    url: 'https://laws-lois.justice.gc.ca/eng/regulations/C.R.C.,_c._986/',
    pattern: /Canada Labour Standards Regulations|CLSR(?![a-z])/i,
  },
  { act: 'O. Reg. 288/01', url: 'https://www.ontario.ca/laws/regulation/010288', pattern: /O\.\s*Reg\.?\s*288\/01/i },
  {
    act: 'N-1.1, r. 6',
    url: 'https://www.legisquebec.gouv.qc.ca/en/document/rc/N-1.1,%20r.%206',
    pattern: /N-1\.1,?\s*r\.?\s*6/i,
  },
  {
    act: 'Employment Standards Act',
    url: 'https://www.ontario.ca/laws/statute/00e41',
    pattern: /Employment Standards Act|(?<![A-Za-z])ESA(?![a-z])/i,
  },
  {
    act: 'Ontario Human Rights Code',
    url: 'https://www.ontario.ca/laws/statute/90h19',
    pattern: /Human Rights Code/i,
  },
  {
    act: 'Workplace Safety and Insurance Act',
    url: 'https://www.ontario.ca/laws/statute/97w16a',
    pattern: /Workplace Safety and Insurance|(?<![A-Za-z])WSIA(?![a-z])/i,
  },
  {
    act: 'Act respecting labour standards',
    url: 'https://www.legisquebec.gouv.qc.ca/en/document/cs/N-1.1',
    pattern: /Act respecting labour standards|(?<![A-Za-z])LNT(?![a-z])|normes du travail/i,
  },
  {
    act: 'Charter of human rights and freedoms',
    url: 'https://www.legisquebec.gouv.qc.ca/en/document/cs/C-12',
    pattern: /Charter of human rights/i,
  },
  {
    act: 'LATMP',
    url: 'https://www.legisquebec.gouv.qc.ca/en/document/cs/A-3.001',
    pattern: /(?<![A-Za-z])LATMP(?![a-z])|industrial accidents/i,
  },
  {
    act: 'National Holiday Act',
    url: 'https://www.legisquebec.gouv.qc.ca/en/document/cs/F-1.1',
    pattern: /National Holiday Act|F-1\.1(?![0-9])/i,
  },
  {
    act: 'Canada Labour Code',
    url: 'https://laws-lois.justice.gc.ca/eng/acts/L-2/',
    pattern: /Canada Labour Code|(?<![A-Za-z])CLC(?![a-z])/i,
  },
  {
    act: 'Canadian Human Rights Act',
    url: 'https://laws-lois.justice.gc.ca/eng/acts/H-6/',
    pattern: /Canadian Human Rights Act|(?<![A-Za-z])CHRA(?![a-z])/i,
  },
  {
    act: 'Government Employees Compensation Act',
    url: 'https://laws-lois.justice.gc.ca/eng/acts/G-5/',
    pattern: /Government Employees Compensation|(?<![A-Za-z])GECA(?![a-z])/i,
  },
]

/* A section cite: `s. 57`, `ss. 17–20`, `art. 79.1`, `s.2(1)`. The range
   form captures both endpoints; subsection parens are dropped. The
   lookbehind keeps word-final "s" ("terms 57") from reading as a cite. */
const CITE_RE =
  /(?<![a-zA-Z])(?:ss?\.?|arts?\.?)\s*([0-9]+(?:\.[0-9]+)*)(?:\s*[–-]\s*([0-9]+(?:\.[0-9]+)*))?(?:\([0-9a-z.\s]+\))?/gi

/** Split an effective_note into attributed (act, [sections]) claims. */
export function attributeCites(note: string): { act: string; url: string; sections: string[] }[] {
  interface Hit {
    index: number
    end: number
  }
  const acts: (Hit & ActPattern)[] = []
  for (const ap of ACT_PATTERNS) {
    for (const m of note.matchAll(new RegExp(ap.pattern.source, 'gi')))
      acts.push({ ...ap, index: m.index, end: m.index + m[0].length })
  }
  acts.sort((a, b) => a.index - b.index)
  const out: { act: string; url: string; sections: string[] }[] = []
  for (const m of note.matchAll(CITE_RE)) {
    const owner = acts.filter((a) => a.index < m.index).at(-1)
    const first = m[1]
    if (!first) continue
    const secs = m[2] ? [first, m[2]] : [first]
    if (!owner) {
      out.push({ act: '', url: '', sections: secs })
      continue
    }
    const existing = out.find((o) => o.act === owner.act)
    if (existing) existing.sections.push(...secs)
    else out.push({ act: owner.act, url: owner.url, sections: [...secs] })
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Runner                                                               */
/* ------------------------------------------------------------------ */

export async function runStatuteDriftCheck(): Promise<StatuteDriftReport> {
  const urls = new Set<string>(STATUTE_REGISTRY.map((e) => e.sourceUrl))
  for (const row of ADVISOR_CORPUS_SNAPSHOT) {
    for (const claim of attributeCites(row.effective_note ?? '')) if (claim.url) urls.add(claim.url)
  }

  const docs = new Map<string, SourceFetch>()
  for (const url of urls) {
    const r = await fetchText(url)
    docs.set(url, {
      url,
      status: r.ok ? 'fetched' : 'failed',
      bytes: r.bytes,
      detail: r.detail,
      html: r.html,
      text: stripHtml(r.html),
    })
    await new Promise((res) => setTimeout(res, 300))
  }

  const findings: DriftFinding[] = []
  const entries: EntryCheck[] = []
  const corpusCites: EntryCheck[] = []

  for (const e of STATUTE_REGISTRY) {
    const doc = docs.get(e.sourceUrl)!
    if (doc.status === 'failed') {
      entries.push({ ref: e.ref, section: e.section, status: 'unverified', detail: doc.detail })
      findings.push({ kind: 'source-unreachable', ref: e.ref, detail: `${e.sourceUrl} — ${doc.detail}` })
      continue
    }
    const sections = expandSection(e.section)
    const missing = sections.filter((s) => !hasSection(doc, s))
    if (missing.length > 0) {
      entries.push({ ref: e.ref, section: e.section, status: 'drift', detail: `section(s) ${missing.join(', ')} absent` })
      findings.push({ kind: 'section-missing', ref: e.ref, detail: `${e.statute} s.${missing.join(', s.')} not in consolidated text` })
      continue
    }
    const markers = STATUTE_MARKERS[e.ref] ?? []
    const missed: string[] = []
    for (const s of sections.slice(0, 1)) {
      const body = sectionBody(doc, s)
      for (const marker of markers) {
        if (body && !new RegExp(marker, 'i').test(body)) missed.push(`s.${s}: /${marker}/`)
      }
    }
    if (missed.length > 0) {
      entries.push({ ref: e.ref, section: e.section, status: 'drift', detail: `marker(s) absent — ${missed.join('; ')}` })
      findings.push({ kind: 'marker-missing', ref: e.ref, detail: missed.join('; ') })
      continue
    }
    entries.push({ ref: e.ref, section: e.section, status: 'ok' })
  }

  for (const row of ADVISOR_CORPUS_SNAPSHOT) {
    const rowId = `${row.jurisdiction}/${row.topic}`
    for (const claim of attributeCites(row.effective_note ?? '')) {
      for (const s of claim.sections) {
        if (!claim.url) {
          corpusCites.push({ ref: `${rowId} s.${s}`, section: s, status: 'unverified', detail: 'no act named before the cite' })
          findings.push({ kind: 'cite-unattributed', row: rowId, detail: `s.${s} — cannot attribute to an act` })
          continue
        }
        const doc = docs.get(claim.url)
        if (!doc || doc.status === 'failed') {
          corpusCites.push({ ref: `${rowId} ${claim.act} s.${s}`, section: s, status: 'unverified', detail: 'source not fetched' })
          findings.push({ kind: 'source-unreachable', row: rowId, detail: `${claim.act} — ${doc?.detail ?? 'not fetched'}` })
          continue
        }
        if (!hasSection(doc, s)) {
          corpusCites.push({ ref: `${rowId} ${claim.act} s.${s}`, section: s, status: 'drift', detail: 'cited section absent' })
          findings.push({ kind: 'cite-missing', row: rowId, detail: `${claim.act} s.${s} not in consolidated text` })
          continue
        }
        corpusCites.push({ ref: `${rowId} ${claim.act} s.${s}`, section: s, status: 'ok' })
      }
    }
  }

  const all = [...entries, ...corpusCites]
  return {
    generatedAt: new Date().toISOString(),
    sources: [...docs.values()].map(({ url, status, bytes, detail }) => ({ url, status, bytes, detail })),
    entries,
    corpusCites,
    findings,
    summary: {
      checked: all.length,
      ok: all.filter((e) => e.status === 'ok').length,
      drift: all.filter((e) => e.status === 'drift').length,
      unverified: all.filter((e) => e.status === 'unverified').length,
    },
  }
}
