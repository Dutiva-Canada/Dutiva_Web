import { z } from 'zod'
import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { supabase } from '@/lib/supabaseClient'
import type { Json } from '@/lib/supabase/types'

/**
 * Case Memory narratives + timeline (migration 0087). Complements
 * hr_advisor_memory_facts — summary/resume/next-steps live here; facts stay
 * one-row-one-fact.
 */

export type TimelineSource = 'manual' | 'note' | 'system' | 'chat' | 'status' | 'memory'

export interface BiLine {
  en: string
  fr: string
}

export interface CaseNarrative {
  id: string
  caseId: string
  summary: Bi
  resumeSince: Bi
  changed: BiLine[]
  nextSteps: BiLine[]
  lastActivityAt: string
}

export interface CaseTimelineEvent {
  id: string
  caseId: string
  occurredAt: string
  sessionLabel: Bi
  body: Bi
  source: TimelineSource
}

export interface UpsertCaseNarrative {
  summaryEn: string
  summaryFr: string
  resumeSinceEn: string
  resumeSinceFr: string
  changed: BiLine[]
  nextSteps: BiLine[]
}

const biLineSchema = z.object({ en: z.string(), fr: z.string() })

const narrativeRowSchema = z.object({
  id: z.string(),
  case_id: z.string(),
  summary_en: z.string(),
  summary_fr: z.string(),
  resume_since_en: z.string(),
  resume_since_fr: z.string(),
  changed: z.array(biLineSchema).nullable(),
  next_steps: z.array(biLineSchema).nullable(),
  last_activity_at: z.string(),
})

const timelineRowSchema = z.object({
  id: z.string(),
  case_id: z.string(),
  occurred_at: z.string(),
  session_label_en: z.string(),
  session_label_fr: z.string(),
  body_en: z.string(),
  body_fr: z.string(),
  source: z.enum(['manual', 'note', 'system', 'chat', 'status', 'memory']),
})

function toNarrative(row: z.infer<typeof narrativeRowSchema>): CaseNarrative {
  return {
    id: row.id,
    caseId: row.case_id,
    summary: bi(row.summary_en, row.summary_fr),
    resumeSince: bi(row.resume_since_en, row.resume_since_fr),
    changed: row.changed ?? [],
    nextSteps: row.next_steps ?? [],
    lastActivityAt: row.last_activity_at,
  }
}

function toEvent(row: z.infer<typeof timelineRowSchema>): CaseTimelineEvent {
  return {
    id: row.id,
    caseId: row.case_id,
    occurredAt: row.occurred_at,
    sessionLabel: bi(row.session_label_en, row.session_label_fr),
    body: bi(row.body_en, row.body_fr),
    source: row.source,
  }
}

export async function getCaseNarrative(
  organizationId: string,
  caseId: string,
): Promise<CaseNarrative | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_advisor_case_narratives')
    .select(
      'id, case_id, summary_en, summary_fr, resume_since_en, resume_since_fr, changed, next_steps, last_activity_at',
    )
    .eq('organization_id', organizationId)
    .eq('case_id', caseId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toNarrative(narrativeRowSchema.parse(data))
}

export async function upsertCaseNarrative(
  organizationId: string,
  caseId: string,
  fields: UpsertCaseNarrative,
): Promise<CaseNarrative> {
  if (!supabase) throw new Error('Supabase is not configured')
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('hr_advisor_case_narratives')
    .upsert(
      {
        organization_id: organizationId,
        case_id: caseId,
        summary_en: fields.summaryEn.trim(),
        summary_fr: fields.summaryFr.trim() || fields.summaryEn.trim(),
        resume_since_en: fields.resumeSinceEn.trim(),
        resume_since_fr: fields.resumeSinceFr.trim() || fields.resumeSinceEn.trim(),
        changed: fields.changed as unknown as Json,
        next_steps: fields.nextSteps as unknown as Json,
        last_activity_at: now,
        updated_at: now,
      },
      { onConflict: 'organization_id,case_id' },
    )
    .select(
      'id, case_id, summary_en, summary_fr, resume_since_en, resume_since_fr, changed, next_steps, last_activity_at',
    )
    .single()
  if (error) throw error
  return toNarrative(narrativeRowSchema.parse(data))
}

export async function listCaseTimeline(
  organizationId: string,
  caseId: string,
): Promise<CaseTimelineEvent[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_advisor_case_timeline_events')
    .select(
      'id, case_id, occurred_at, session_label_en, session_label_fr, body_en, body_fr, source',
    )
    .eq('organization_id', organizationId)
    .eq('case_id', caseId)
    .order('occurred_at', { ascending: true })
  if (error) throw error
  return z
    .array(timelineRowSchema)
    .parse(data ?? [])
    .map(toEvent)
}

export async function addCaseTimelineEvent(
  organizationId: string,
  caseId: string,
  input: {
    bodyEn: string
    bodyFr?: string
    sessionLabelEn?: string
    sessionLabelFr?: string
    source?: TimelineSource
    occurredAt?: string
  },
): Promise<CaseTimelineEvent> {
  if (!supabase) throw new Error('Supabase is not configured')
  const bodyEn = input.bodyEn.trim()
  if (!bodyEn) throw new Error('Timeline body cannot be empty')
  const { data, error } = await supabase
    .from('hr_advisor_case_timeline_events')
    .insert({
      organization_id: organizationId,
      case_id: caseId,
      body_en: bodyEn,
      body_fr: (input.bodyFr ?? bodyEn).trim(),
      session_label_en: input.sessionLabelEn?.trim() ?? '',
      session_label_fr: input.sessionLabelFr?.trim() ?? input.sessionLabelEn?.trim() ?? '',
      source: input.source ?? 'manual',
      occurred_at: input.occurredAt ?? new Date().toISOString(),
    })
    .select(
      'id, case_id, occurred_at, session_label_en, session_label_fr, body_en, body_fr, source',
    )
    .single()
  if (error) throw error
  /* Touch narrative activity clock when one exists — ignore missing row. */
  await supabase
    .from('hr_advisor_case_narratives')
    .update({ last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('case_id', caseId)
  return toEvent(timelineRowSchema.parse(data))
}

/**
 * Build a synthetic timeline from case notes when no explicit events exist —
 * keeps production Memory useful before anyone authors a narrative.
 */
export function timelineFromNotes(
  caseId: string,
  notes: { id: string; body: string; createdAt: string }[],
  caseCreatedAt: string | null,
): CaseTimelineEvent[] {
  const events: CaseTimelineEvent[] = []
  if (caseCreatedAt) {
    events.push({
      id: `synth-opened-${caseId}`,
      caseId,
      occurredAt: caseCreatedAt,
      sessionLabel: bi('Case opened', 'Dossier ouvert'),
      body: bi('Case opened in the workspace.', 'Dossier ouvert dans l’espace de travail.'),
      source: 'system',
    })
  }
  for (const note of notes) {
    events.push({
      id: `synth-note-${note.id}`,
      caseId,
      occurredAt: note.createdAt,
      sessionLabel: bi('Case note', 'Note de dossier'),
      body: bi(note.body, note.body),
      source: 'note',
    })
  }
  return events
}

export function relativeAgo(iso: string, lang: 'en' | 'fr'): string {
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)))
  if (days === 0) return lang === 'fr' ? 'aujourd’hui' : 'today'
  if (days === 1) return lang === 'fr' ? 'il y a 1 jour' : '1 day ago'
  return lang === 'fr' ? `il y a ${days} jours` : `${days} days ago`
}
