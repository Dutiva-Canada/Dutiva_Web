/**
 * Builds the structured `AdvisorResponse` the Compliance Workspace renders
 * (src/features/app/advisor/contract.ts — Engineering Roadmap P0).
 *
 * Everything here is DETERMINISTIC: routing, gates, risk, jurisdiction,
 * legal basis and confidence are computed from the user's message, the
 * retrieved corpus chunks, and the reply prose — never asked of the model.
 * That is docs/AI_USAGE_STRATEGY.md §4/§6 applied: the model writes prose,
 * rules decide consequences, and no statutory claim originates in the model.
 *
 * Two honesty rules worth keeping:
 * - a legal-basis item is `valid` only when its chunk has been human-reviewed
 *   (`review_status = 'reviewed'`); machine-curated rows surface as
 *   "needs review" rather than claiming vetted authority;
 * - jurisdiction defaults to `unknown` and is never assumed to be Ontario,
 *   which closes the legal-basis gate until the user says where they are.
 *
 * Pure and dependency-free so it runs in Deno (the edge function) and under
 * vitest (responsePayload.test.ts, which validates output against the real
 * client zod contract).
 */

export interface Bi {
  en: string
  fr: string
}

export interface GuidanceChunk {
  title: string
  content: string
  source_url: string
  source_name: string
  jurisdiction: string
  effective_note: string | null
  review_status?: string
  topic?: string
  /** Set when the law monitor saw this chunk's jurisdiction change after
   *  curation (0071) — vetted status does not survive a source change. */
  source_changed_at?: string | null
}

export interface AdvisorResponsePayload {
  route: {
    responseMode: 'hr' | 'escalation' | 'supportive'
    workspaceAllowed: boolean
    retrievalAllowed: boolean
    legalBasisAllowed: boolean
    documentsAllowed: boolean
    webSearchAllowed: boolean
  }
  jurisdiction: { status: string; value: Bi; note?: Bi }
  risk: { compliance: string; safety: string }
  professionalReview: { type: string; label: Bi; reason: Bi } | null
  supportNotice: boolean
  legalBasis: { items: { label: Bi; valid: boolean }[]; withheldReason?: Bi }
  retrieval: { items: Bi[]; note?: Bi; withheldReason?: Bi }
  /** Org memory facts injected this turn (null/omit when none). */
  memory?: {
    items: {
      label: Bi
      factId?: string
      scope?: 'person' | 'case' | 'thread'
      entityId?: string
    }[]
    note?: Bi
  } | null
  webSearch: null
  confidence: { label: Bi; pct: number; note?: Bi } | null
  warnings: Bi[]
  isCrisis: boolean
}

/* ------------------------------------------------------------- detection */

/**
 * Byte-for-byte the client's `safety/text.ts#normalizeText` — the crisis
 * phrase set below is stored pre-normalized against it, so the two must
 * normalize identically or the mirrored phrases stop matching.
 */
export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics
    .replace(/[\u2018\u2019'`]/g, '') // drop apostrophes/backticks
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * First-person crisis phrases — the server-side mirror of the client's
 * maintained set (src/features/app/advisor/safety/crisisSignals.ts). Both
 * run; the union wins (§5.1 fail-safe-on). Keep the two lists in sync —
 * enforced by the drift test in this file's `.test.ts`. Exported (only) for
 * that test; nothing else should import the raw list, use `detectsCrisis`.
 */
export const CRISIS_PHRASES: readonly string[] = [
  'kill myself',
  'killing myself',
  'end my life',
  'ending my life',
  'take my own life',
  'want to die',
  'wish i was dead',
  'wish i were dead',
  'better off dead',
  'suicidal',
  'thinking about suicide',
  'thoughts of suicide',
  'commit suicide',
  'harm myself',
  'hurt myself',
  'self harm',
  'cant go on',
  'cant do this anymore',
  'dont want to live',
  'dont want to be here anymore',
  'no reason to live',
  'no point in living',
  'want to end it all',
  'me suicider',
  'me tuer',
  'suicidaire',
  'envie de mourir',
  'je veux mourir',
  'veux mourir',
  'mettre fin a mes jours',
  'mettre fin a ma vie',
  'en finir avec la vie',
  'plus envie de vivre',
  'plus de raison de vivre',
  'me faire du mal',
  'mieux mort',
  'mieux morte',
]

export function detectsCrisis(message: string): boolean {
  const n = normalize(message)
  return n.length > 0 && CRISIS_PHRASES.some((p) => n.includes(p))
}

/** Third-party safety / rights matters — escalation, never supportive mode. */
const ESCALATION_TERMS: readonly string[] = [
  'harassment',
  'harcelement',
  'violence',
  'assault',
  'agression',
  'threat',
  'menace',
  'weapon',
  'arme',
  'human rights complaint',
  'plainte aux droits de la personne',
  'discrimination',
  'retaliation',
  'represailles',
  'whistleblow',
  'unsafe',
  'dangereux',
]

/** Topics whose mishandling carries the highest compliance exposure. */
const HIGH_RISK_TERMS: readonly string[] = [
  'terminat',
  'dismiss',
  'fired',
  'firing',
  'let go',
  'layoff',
  'lay off',
  'congedi',
  'licenci',
  'cessation',
  'severance',
  'indemnite de depart',
  'discipline',
  'accommodat',
  'accommodement',
  'constructive dismissal',
  'congediement deguise',
  ...ESCALATION_TERMS,
]

/** Everyday entitlement questions — real compliance weight, lower exposure. */
const MEDIUM_RISK_TERMS: readonly string[] = [
  'overtime',
  'heures supplementaires',
  'vacation',
  'vacances',
  'minimum wage',
  'salaire minimum',
  'holiday',
  'ferie',
  'leave',
  'conge',
  'sick',
  'maladie',
  'hours of work',
  'duree du travail',
  'break',
  'pause',
  'pay',
  'paie',
  'wage',
  'salaire',
]

function includesAny(normalized: string, terms: readonly string[]): boolean {
  return terms.some((t) => normalized.includes(t))
}

type JurisdictionCode = 'ON' | 'QC' | 'FED'

/* Bare two-letter codes are deliberately excluded — "on" is a common word,
   and a false jurisdiction read is worse than an unknown one. */
const JURISDICTION_PATTERNS: { code: JurisdictionCode; terms: readonly string[] }[] = [
  { code: 'ON', terms: ['ontario', 'employment standards act', ' esa', 'esa ', 'ohsa'] },
  {
    code: 'QC',
    terms: ['quebec', 'cnesst', 'normes du travail', 'lnt', 'charte des droits'],
  },
  {
    code: 'FED',
    terms: [
      'federally regulated',
      'federal jurisdiction',
      'canada labour code',
      'code canadien du travail',
      'interprovincial',
      'reglementation federale',
    ],
  },
]

export function detectJurisdictions(message: string): JurisdictionCode[] {
  const n = ` ${normalize(message)} `
  return JURISDICTION_PATTERNS.filter((j) => includesAny(n, j.terms)).map((j) => j.code)
}

/* ---------------------------------------------------------------- labels */

/** Exported (only) for the client backstop's label-drift test — its
 *  scheduleJurisdiction() maps these display strings back to codes. */
export const JURISDICTION_VALUE: Record<JurisdictionCode, Bi> = {
  ON: { en: 'Ontario · Provincially regulated', fr: 'Ontario · Réglementation provinciale' },
  QC: { en: 'Quebec · Provincially regulated', fr: 'Québec · Réglementation provinciale' },
  FED: { en: 'Federally regulated', fr: 'Sous réglementation fédérale' },
}

const JURISDICTION_TAG: Record<string, Bi> = {
  ON: { en: 'ON', fr: 'ON' },
  QC: { en: 'QC', fr: 'QC' },
  FED: { en: 'Federal', fr: 'Fédéral' },
}

const TOPIC_LABEL: Record<string, Bi> = {
  termination_notice: { en: 'Termination notice', fr: 'Préavis de cessation' },
  severance: { en: 'Severance', fr: 'Indemnité de départ' },
  vacation: { en: 'Vacation', fr: 'Vacances' },
  overtime: { en: 'Overtime', fr: 'Heures supplémentaires' },
  minimum_wage: { en: 'Minimum wage', fr: 'Salaire minimum' },
  leaves: { en: 'Leaves', fr: 'Congés' },
  public_holidays: { en: 'Public holidays', fr: 'Jours fériés' },
  hours_of_work: { en: 'Hours of work', fr: 'Durée du travail' },
  accommodation_basics: { en: 'Accommodation', fr: 'Accommodement' },
}

function bi(en: string, fr: string): Bi {
  return { en, fr }
}

/* --------------------------------------------------------------- builder */

export interface BuildInput {
  /** The user's message this turn. */
  message: string
  /** The model's conversational reply (inspected, never trusted for facts). */
  reply: string
  /** Chunks that grounded this turn, in rank order. */
  chunks: GuidanceChunk[]
  /** True when retrieval errored (vs a genuine zero-hit) — the user is told
   *  "retrieval was unavailable", never "nothing matched". */
  retrievalFailed?: boolean
  /** Confirmed org memory facts injected into the system prompt this turn. */
  memoryFacts?: readonly {
    id: string
    statementEn: string
    statementFr: string
    scope?: 'person' | 'case' | 'thread'
    entityId?: string
  }[]
}

export function buildAdvisorResponse(input: BuildInput): AdvisorResponsePayload {
  const { message, chunks } = input
  const retrievalFailed = input.retrievalFailed === true
  const normalized = normalize(message)
  const isCrisis = detectsCrisis(message)

  /* Crisis intercepts everything: maintained resources only, every gate off,
     and it cannot be overridden by mode (contract `allowedSurfaces`). */
  if (isCrisis) {
    return {
      route: {
        responseMode: 'supportive',
        workspaceAllowed: false,
        retrievalAllowed: false,
        legalBasisAllowed: false,
        documentsAllowed: false,
        webSearchAllowed: false,
      },
      jurisdiction: {
        status: 'not_applicable',
        value: bi('Not applicable', 'Sans objet'),
        note: bi(
          'Personal wellbeing — no workplace or company context is assumed.',
          'Bien-être personnel — aucun contexte d’entreprise ou de milieu de travail n’est présumé.',
        ),
      },
      risk: { compliance: 'low', safety: 'critical' },
      professionalReview: {
        type: 'medical',
        label: bi(
          'Consider: employee assistance (EAP)',
          'À considérer : programme d’aide aux employés (PAE)',
        ),
        reason: bi(
          'Personal-crisis signal — supportive response, not HR action.',
          'Signal de crise personnelle — réponse de soutien, pas une mesure RH.',
        ),
      },
      supportNotice: true,
      legalBasis: {
        items: [],
        withheldReason: bi(
          'No legal basis in support mode.',
          'Aucun fondement juridique en mode soutien.',
        ),
      },
      retrieval: {
        items: [],
        withheldReason: bi(
          'Retrieval is off in support mode.',
          'La recherche documentaire est désactivée en mode soutien.',
        ),
      },
      memory: null,
      webSearch: null,
      confidence: null,
      warnings: [],
      isCrisis: true,
    }
  }

  const escalation = includesAny(normalized, ESCALATION_TERMS)
  const responseMode: 'hr' | 'escalation' = escalation ? 'escalation' : 'hr'

  const jurisdictions = detectJurisdictions(message)
  const jurisdictionStatus =
    jurisdictions.length === 1 ? 'known' : jurisdictions.length > 1 ? 'conflict' : 'unknown'
  const jurisdictionConfirmed = jurisdictionStatus === 'known'

  const complianceRisk = includesAny(normalized, HIGH_RISK_TERMS)
    ? 'high'
    : includesAny(normalized, MEDIUM_RISK_TERMS)
      ? 'medium'
      : 'low'
  const safetyRisk = escalation ? 'watch' : 'none'

  /* Gates. Legal basis stays shut until jurisdiction is confirmed AND the
     corpus actually grounded the turn — the fail-safe-closed rule (§5.2). */
  const hasChunks = chunks.length > 0
  const legalBasisAllowed = jurisdictionConfirmed && hasChunks

  const warnings: Bi[] = []

  const retrievalItems: Bi[] = chunks.map((c) => {
    const topic = c.topic ? TOPIC_LABEL[c.topic] : undefined
    const tag = JURISDICTION_TAG[c.jurisdiction] ?? bi(c.jurisdiction, c.jurisdiction)
    const label = topic ?? bi(c.title, c.title)
    return bi(`${label.en} · ${tag.en}`, `${label.fr} · ${tag.fr}`)
  })

  /* A citation is "valid" only once a human has reviewed the chunk AND its
     source has not changed since (0071: the law monitor stamps
     source_changed_at when it sees the jurisdiction's law change — vetted
     status does not survive a source change). The seed corpus is
     machine-curated, so it honestly reads as needs-review until
     `review_status` flips. */
  const legalBasisItems = chunks.map((c) => ({
    label: bi(`${c.title} — ${c.source_name}`, `${c.title} — ${c.source_name}`),
    valid: c.review_status === 'reviewed' && !c.source_changed_at,
  }))
  /* Distinct facts, distinct warnings: "never human-reviewed" and "reviewed
     but the law changed since" must not conflate — a reviewed-but-flagged
     chunk is NOT "pending human review" (2026-08-08 follow-up review). */
  const anyUnreviewed = chunks.some((c) => c.review_status !== 'reviewed')
  const anySourceChanged = chunks.some((c) => !!c.source_changed_at)

  /* Accurate about what actually happens: the citation surface is withheld;
     the reply's prose may still carry a figure, and the reader should verify
     it. (The previous "figures are withheld" wording misdescribed a figure
     sitting visible in the chat bubble — 2026-08-08 review.) */
  if (!jurisdictionConfirmed) {
    warnings.push(
      jurisdictionStatus === 'conflict'
        ? bi(
            'More than one jurisdiction was mentioned — statutory citations are withheld until one is confirmed, and any figure in the reply should be verified against the official source.',
            'Plus d’une compétence a été mentionnée — les citations légales sont retenues jusqu’à confirmation, et tout chiffre dans la réponse doit être vérifié auprès de la source officielle.',
          )
        : bi(
            'Jurisdiction is not confirmed — statutory citations are withheld until it is, and any figure in the reply should be verified against the official source.',
            'La compétence n’est pas confirmée — les citations légales sont retenues jusqu’à confirmation, et tout chiffre dans la réponse doit être vérifié auprès de la source officielle.',
          ),
    )
  }
  if (retrievalFailed) {
    warnings.push(
      bi(
        'Corpus retrieval was unavailable this turn — the reply is not grounded in the curated corpus.',
        'La recherche dans le corpus était indisponible pour ce tour — la réponse n’est pas fondée sur le corpus répertorié.',
      ),
    )
  } else if (!hasChunks) {
    warnings.push(
      bi(
        'No curated guidance matched this question — the reply is not grounded in the corpus.',
        'Aucune guidance répertoriée ne correspond à cette question — la réponse n’est pas fondée sur le corpus.',
      ),
    )
  }
  /* NOT gated on legalBasisAllowed: a flagged chunk still grounds the
     prompt on a jurisdiction-unconfirmed turn, and the law-changed signal
     must reach the reader either way (2026-08-08 follow-up review). */
  if (anySourceChanged) {
    warnings.push(
      bi(
        'A law behind a source that grounded this reply changed after it was curated — verify against the primary source before relying on it.',
        'Une loi derrière une source ayant fondé cette réponse a changé après sa préparation — vérifiez la source primaire avant de vous y fier.',
      ),
    )
  }
  if (legalBasisAllowed && anyUnreviewed) {
    warnings.push(
      bi(
        'Cited sources are machine-curated and pending human review.',
        'Les sources citées sont préparées automatiquement et en attente de révision humaine.',
      ),
    )
  }

  /* Confidence tracks what actually grounded the answer: jurisdiction
     certainty and corpus coverage. It never reports the model's own feeling. */
  const confidencePct = Math.min(
    88,
    20 + (jurisdictionConfirmed ? 30 : 0) + Math.min(chunks.length, 4) * 10,
  )
  const confidenceLabel =
    confidencePct >= 70
      ? bi('High', 'Élevée')
      : confidencePct >= 45
        ? bi('Moderate', 'Modérée')
        : bi('Low', 'Faible')

  const professionalReview =
    escalation || complianceRisk === 'high'
      ? {
          type: 'legal',
          label: bi(
            'Recommended: employment counsel',
            'Recommandé : conseiller juridique en droit du travail',
          ),
          reason: escalation
            ? bi(
                'Safety or rights matter — handle through a documented, counsel-guided process.',
                'Question de sécurité ou de droits — traiter par un processus documenté et guidé par un conseiller juridique.',
              )
            : bi(
                'High-exposure employment decision — statutory minimums are a floor, not the whole obligation.',
                'Décision d’emploi à forte exposition — les minimums légaux sont un plancher, pas l’obligation entière.',
              ),
        }
      : null

  return {
    route: {
      responseMode,
      workspaceAllowed: true,
      retrievalAllowed: hasChunks,
      legalBasisAllowed,
      documentsAllowed: responseMode === 'hr',
      webSearchAllowed: false,
    },
    jurisdiction: {
      status: jurisdictionStatus,
      value: jurisdictionConfirmed
        ? JURISDICTION_VALUE[jurisdictions[0] as JurisdictionCode]
        : jurisdictionStatus === 'conflict'
          ? bi('Multiple jurisdictions mentioned', 'Plusieurs compétences mentionnées')
          : bi('Not confirmed', 'Non confirmée'),
      note: jurisdictionConfirmed
        ? undefined
        : bi(
            'Ask which province or federal jurisdiction applies before relying on figures.',
            'Demandez quelle province ou compétence fédérale s’applique avant de vous fier aux chiffres.',
          ),
    },
    risk: { compliance: complianceRisk, safety: safetyRisk },
    professionalReview,
    supportNotice: false,
    legalBasis: legalBasisAllowed
      ? { items: legalBasisItems }
      : {
          items: [],
          withheldReason: hasChunks
            ? bi(
                'Legal basis withheld — jurisdiction is not confirmed.',
                'Fondement juridique retenu — la compétence n’est pas confirmée.',
              )
            : retrievalFailed
              ? bi(
                  'Corpus retrieval was unavailable this turn.',
                  'La recherche dans le corpus était indisponible pour ce tour.',
                )
              : bi(
                  'No curated source matched this question.',
                  'Aucune source répertoriée ne correspond à cette question.',
                ),
        },
    retrieval: hasChunks
      ? { items: retrievalItems }
      : {
          items: [],
          /* An infrastructure failure must never read as "no match" — that
             conflation hid the 0058 tsquery bug for ten days. */
          withheldReason: retrievalFailed
            ? bi(
                'Corpus retrieval was unavailable this turn — try again shortly.',
                'La recherche dans le corpus était indisponible pour ce tour — réessayez sous peu.',
              )
            : bi(
                'Nothing in the curated corpus matched this question.',
                'Rien dans le corpus répertorié ne correspond à cette question.',
              ),
        },
    memory:
      (input.memoryFacts?.length ?? 0) > 0
        ? {
            items: (input.memoryFacts ?? []).slice(0, 8).map((f) => ({
              label: bi(f.statementEn, f.statementFr || f.statementEn),
              factId: f.id,
              ...(f.scope != null && f.entityId != null
                ? { scope: f.scope, entityId: f.entityId }
                : {}),
            })),
            note: bi(
              'Organization memory (confirmed facts) — not a statutory source. Review or correct in Advisor memory.',
              'Mémoire de l’organisation (faits confirmés) — pas une source législative. Réviser ou corriger dans Mémoire du Conseiller.',
            ),
          }
        : null,
    webSearch: null,
    confidence: { label: confidenceLabel, pct: confidencePct },
    warnings,
    isCrisis: false,
  }
}
