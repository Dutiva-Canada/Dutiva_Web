/**
 * Context-aware rule-based resume parser.
 *
 * This is a cost-free alternative to a server-side GenAI model. It recognizes
 * common resume sections and patterns to pre-fill the candidate profile. It is
 * intentionally conservative: it only sets a field when the evidence is strong,
 * and the candidate can edit everything afterwards.
 */

import type { CandidateProfileFormValues } from './CandidateProfileForm'

type ExtractedFields = Partial<CandidateProfileFormValues>

function normalizeWhitespace(text: string): string {
  return text.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').trim()
}

function getLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function findByRegex(text: string, regex: RegExp): string | undefined {
  const match = text.match(regex)
  return match?.[0]
}

function extractEmail(text: string): string | undefined {
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  return findByRegex(text, regex)
}

function extractPhone(text: string): string | undefined {
  // Canadian/US friendly formats, avoids matching years of experience
  const regex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
  return findByRegex(text, regex)
}

function extractLinkedIn(text: string): string | undefined {
  const regex = /https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s<>"']+/i
  return findByRegex(text, regex)
}

function extractWebsite(text: string): string | undefined {
  const regex = /https?:\/\/[^\s<>"']+/gi
  const matches = text.match(regex)
  if (!matches) return undefined
  const nonLinkedIn = matches.find((url) => !url.toLowerCase().includes('linkedin.com'))
  return nonLinkedIn ?? matches[0]
}

function extractYearsExperience(text: string): string | undefined {
  const regex = /(\d{1,2})(?:\+)?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i
  const match = text.match(regex)
  return match?.[1]
}

const LOCATION_INDICATORS = [
  /(?:^|\s)([A-Z][a-zA-Z\s]+(?:,\s*[A-Z]{2}))(?:\s|$)/,
  /(?:^|\s)([A-Z][a-zA-Z\s]+(?:,\s*Canada))(?:\s|$)/i,
]

function extractLocation(lines: string[]): string | undefined {
  for (const line of lines.slice(0, 12)) {
    for (const regex of LOCATION_INDICATORS) {
      const match = line.match(regex)
      if (match) return match[1]?.trim()
    }
  }
  return undefined
}

function extractName(lines: string[]): string | undefined {
  // Name is usually the very first line, or the first line that looks like
  // two to four capitalized words and is not a known section header.
  const sectionHeaders = new Set([
    'summary',
    'profile',
    'objective',
    'experience',
    'work experience',
    'education',
    'skills',
    'contact',
    'references',
    'projects',
    'certifications',
    'languages',
  ])

  const nameRegex = /^[A-Z][a-zA-Z]+(?:[-'][A-Za-z]+)?(?:\s+[A-Z][a-zA-Z]+(?:[-'][A-Za-z]+)?){1,2}$/

  for (const line of lines.slice(0, 8)) {
    if (line.length > 40) continue
    if (sectionHeaders.has(line.toLowerCase())) continue
    if (line.includes('@') || line.includes('http') || /\d{4}/.test(line)) continue
    if (nameRegex.test(line)) return line.trim()
  }

  return undefined
}

function extractHeadline(lines: string[], name: string | undefined): string | undefined {
  const nextLine = lines.find((line) => line !== name && line.length > 3 && line.length < 80)
  if (nextLine && !/^(?:summary|profile|experience|education|skills|contact|objective)\b/i.test(nextLine)) {
    return nextLine.replace(/[:-]+$/, '').trim()
  }
  return undefined
}

const SUMMARY_HEADERS = ['summary', 'professional summary', 'profile', 'about me', 'objective', 'career objective']

function extractSummary(text: string): string | undefined {
  const lines = getLines(text)
  let start = -1

  for (let i = 0; i < lines.length; i++) {
    const normalized = lines[i]!.toLowerCase().replace(/[:-]+$/, '').trim()
    if (SUMMARY_HEADERS.includes(normalized)) {
      start = i + 1
      break
    }
  }

  if (start === -1 || start >= lines.length) return undefined

  let end = lines.length
  const sectionBreakers = new Set([
    'experience',
    'work experience',
    'employment',
    'education',
    'skills',
    'technical skills',
    'certifications',
    'projects',
    'references',
    'awards',
    'languages',
    'contact',
  ])

  for (let i = start; i < lines.length; i++) {
    const line = lines[i]!.toLowerCase().replace(/[:-]+$/, '').trim()
    if (sectionBreakers.has(line)) {
      end = i
      break
    }
  }

  const summary = lines
    .slice(start, end)
    .filter((line) => {
      // Drop contact-only lines
      if (line.includes('@') && !line.includes(' ')) return false
      if (/^\+?\d[\d\-()\s]+$/.test(line)) return false
      return true
    })
    .join(' ')
    .trim()

  return summary.length > 30 ? summary : undefined
}

const ROLE_KEYWORDS = [
  'engineer',
  'manager',
  'director',
  'developer',
  'designer',
  'analyst',
  'consultant',
  'specialist',
  'coordinator',
  'administrator',
  'lead',
  'head',
  'vp',
  'president',
  'ceo',
  'cto',
  'cfo',
  'product manager',
  'project manager',
  'operations manager',
  'hr manager',
  'recruiter',
  'sales',
  'marketing',
  'accountant',
  'lawyer',
  'nurse',
  'teacher',
  'supervisor',
  'assistant',
  'intern',
]

function extractCurrentRole(text: string): string | undefined {
  const lines = getLines(text)

  // Look for explicit current role labels
  const explicit = /(?:current role|current position|title|role)\s*[:-]\s*([^\n]+)/i.exec(text)
  if (explicit?.[1]) return explicit[1].trim()

  // The first line under an Experience section that contains a role keyword
  // and reasonable length is usually the current role.
  let experienceStart = -1
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i]!.toLowerCase()
    if (lower === 'experience' || lower === 'work experience' || lower === 'professional experience') {
      experienceStart = i + 1
      break
    }
  }

  if (experienceStart > 0) {
    for (let i = experienceStart; i < Math.min(experienceStart + 6, lines.length); i++) {
      const line = lines[i]!
      const lower = line.toLowerCase()
      if (ROLE_KEYWORDS.some((k) => lower.includes(k)) && line.length > 3 && line.length < 70) {
        return line.replace(/[:-]+$/, '').trim()
      }
    }
  }

  return undefined
}

export function parseResumeText(rawText: string): ExtractedFields {
  const text = normalizeWhitespace(rawText)
  const lines = getLines(text)
  const extracted: ExtractedFields = {}

  const email = extractEmail(text)
  if (email) extracted.email = email

  const phone = extractPhone(text)
  if (phone) extracted.phone = phone

  const linkedin = extractLinkedIn(text)
  if (linkedin) extracted.linkedin = linkedin

  const website = extractWebsite(text)
  if (website && website !== linkedin) extracted.website = website

  const years = extractYearsExperience(text)
  if (years != null) extracted.yearsExperience = years

  const location = extractLocation(lines)
  if (location) extracted.location = location

  const name = extractName(lines)
  if (name) extracted.name = name

  const headline = extractHeadline(lines, name)
  if (headline) extracted.headline = headline

  const currentRole = extractCurrentRole(text)
  if (currentRole) extracted.currentRole = currentRole

  const summary = extractSummary(text)
  if (summary) extracted.summary = summary

  extracted.resumeText = text
  return extracted
}
