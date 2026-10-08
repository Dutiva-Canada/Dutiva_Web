/**
 * Model-assisted recovery for monitor-law-changes — when a page stays broken,
 * the model suggests a replacement URL; the host allowlist is the SSRF guard
 * that keeps a suggestion from pointing the fetch anywhere else.
 */
import type { PageConfig } from './pages.ts'

/** Ask the model to suggest a likely current URL for a legislation page that moved. */
export async function findNewUrl(
  page: PageConfig,
  statusCode: number,
  hfToken: string,
): Promise<string | null> {
  if (!hfToken) return null
  try {
    const res = await fetch('https://api-inference.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistralai/Mistral-7B-Instruct-v0.3',
        messages: [
          {
            role: 'system',
            content:
              'You are a Canadian legal research assistant. When given a broken or moved ' +
              'government legislation URL, output ONLY the most likely current URL for that ' +
              'specific law — no explanation, no markdown, just the raw URL. ' +
              'Use official government domains: ontario.ca/laws, laws-lois.justice.gc.ca, ' +
              'bclaws.gov.bc.ca, qp.alberta.ca, legisquebec.gouv.qc.ca, laws.gnb.ca, ' +
              'nslegislature.ca, assembly.nl.ca, princeedwardisland.ca, web2.gov.mb.ca, ' +
              'qp.gov.sk.ca, justice.gov.nt.ca, nunavutlegislation.ca, legislation.yukon.ca.',
          },
          {
            role: 'user',
            content:
              `The following URL for "${page.law_name}" (${page.jurisdiction}) returned HTTP ${statusCode}:\n` +
              `${page.url}\n\n` +
              'What is the most likely current official URL for this legislation?',
          },
        ],
        max_tokens: 80,
        temperature: 0.1,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const suggested = data.choices?.[0]?.message?.content?.trim()
    if (suggested && /^https?:\/\/.+\..+/.test(suggested)) return suggested
    return null
  } catch {
    return null
  }
}

/** Plain-English summary of a detected change, for an HR audience. */
export async function summarizeChange(
  lawName: string,
  jurisdiction: string,
  snippet: string,
  hfToken: string,
): Promise<string> {
  if (!hfToken) return `Change detected on ${lawName}. Review the legislation page directly.`
  try {
    const res = await fetch('https://api-inference.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistralai/Mistral-7B-Instruct-v0.3',
        messages: [
          {
            role: 'system',
            content:
              'You are a Canadian employment law specialist. Summarize detected changes ' +
              'to employment legislation in 2-3 plain-English sentences. Focus on employer ' +
              'and HR obligations: what must employers do differently, and by when.',
          },
          {
            role: 'user',
            content:
              `A change was detected on the ${jurisdiction} "${lawName}" legislation page. ` +
              `Excerpt:\n\n${snippet.slice(0, 1800)}\n\n` +
              'What changed and what does it mean for employers?',
          },
        ],
        max_tokens: 220,
        temperature: 0.2,
      }),
    })
    if (!res.ok) return `Change detected on ${lawName}. Review the legislation page.`
    const data = await res.json()
    return (
      data.choices?.[0]?.message?.content?.trim() ??
      `Change detected on ${lawName}. Review the legislation page.`
    )
  } catch {
    return `Change detected on ${lawName}. Review the legislation page.`
  }
}

/**
 * SSRF guard: a model-suggested replacement URL must be HTTPS on a known
 * government/legislation host before we fetch it server-side or store it as the
 * new monitoring target.
 */
export const ALLOWED_LAW_HOST_SUFFIXES = [
  'justice.gc.ca',
  'canlii.org',
  'canada.ca',
  /* The federal consolidated XML is republished to GitHub by Justice Canada —
     the registry's primary URL for the two federal Acts. */
  'raw.githubusercontent.com',
  'ontario.ca',
  'donneesquebec.ca',
  'bclaws.gov.bc.ca',
  'bclaws.ca',
  'qp.alberta.ca',
  'kings-printer.alberta.ca',
  'legisquebec.gouv.qc.ca',
  'gov.mb.ca',
  'manitoba.ca',
  'qp.gov.sk.ca',
  'publications.saskatchewan.ca',
  'nslegislature.ca',
  'novascotia.ca',
  'laws.gnb.ca',
  'gnb.ca',
  'princeedwardisland.ca',
  'assembly.nl.ca',
  'justice.gov.nt.ca',
  'ntassembly.ca',
  'gov.nu.ca',
  'nunavutlegislation.ca',
  'gov.yk.ca',
  'yukon.ca',
]

export function isAllowedLawHost(candidate: string): boolean {
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    return ALLOWED_LAW_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`))
  } catch {
    return false
  }
}
