import { detectPatterns } from '../_shared/adviceScreen.ts'

/* ── Output screen — the deterministic backstop behind the prompt ─────────
   The external register answers HR questions with grounded guidance —
   describing what the law requires is the product, so bare statutory
   statements ("the ESA requires notice or pay in lieu") must stay clean.
   What external never gets is the directed call on a high-risk
   employment decision and the legal verdict on their fact pattern —
   the prompt's answer there is "consult qualified legal counsel", and
   this screen is the enforcement for when the model drifts anyway.

   Three pattern classes:
   1. Directed consequential calls — "you should fire her", "terminate
      the employment", "deny the request". Describing the rule is fine;
      making the decision is legal advice.
   2. Legal-standing verdicts — "you're within your rights", "you have
      grounds to terminate", "little legal risk" — conclusions a lawyer
      reaches on a fact pattern.
   3. Legality declarations — "that would be wrongful dismissal",
      "that's discriminatory" — the verdict on their situation.

   Internal @dutiva.ca replies never reach this screen — direct advice,
   including high-risk recommendations, is the internal register's
   stated scope ("advise directly ... a straight answer is the default
   register here"). The Advisor is not lang-keyed — replies mirror the
   user's language — so both tables run on every external reply. */
const DIRECTED_PATTERNS: RegExp[] = [
  /\byou\s+(?:should|must|need\s+to|ought\s+to|can|may|are\s+free\s+to)\s+(?:fire|terminate|dismiss|let\s+go|lay\s+off|discipline|suspend|demote|deny|refuse|reject|withhold|deduct|sue|file\s+a\s+(?:claim|complaint|grievance)|report|challenge|contest|remove|revoke)(?!\w)/i,
  /\b(?:fire|terminate|dismiss|discipline|suspend|demote|deny|refuse|revoke)\s+(?:him|her|them|the\s+employee|this\s+person|that\s+employee)(?!\w)/i,
  /\blet\s+(?:him|her|them)\s+go(?!\w)/i,
  /\bi(?:'d|\s+would)?\s+(?:recommend|suggest|advise|urge|counsel)\s+(?:that\s+you\s+|you\s+)?(?:terminat|fir|dismiss|let\s+(?:him|her|them)\s+go|lay|disciplin|suspend|demot|deny|refus|sue|fil|withhold|revok)/i,
  /\bmy\s+(?:recommendation|advice|verdict|call)\s+(?:is|would\s+be|:)\s*(?:to\s+)?(?:terminat|fir|dismiss|deny|refus|suspend|disciplin|let)/i,
]

const VERDICT_PATTERNS: RegExp[] = [
  /\byou(?:'re|\s+are|\s+would\s+be|\s+will\s+be|\s+won't\s+be|\s+aren't|\s+are\s+not)\s+(?:within\s+your\s+rights|legally\s+(?:allowed|required|obligated|protected|exposed|liable|entitled)|in\s+the\s+clear|liable|exposed|entitled\s+to)(?!\w)/i,
  /\byou\s+(?:have|there\s+are|have\s+established|now\s+have)\s+(?:grounds|just\s+cause|cause|a\s+legal\s+(?:basis|right|obligation)|sufficient\s+grounds)\s+(?:to|for)\s+\w+/i,
  /\b(?:no|little|low|minimal|zero|negligible)\s+(?:legal\s+)?risk\s+in\s+(?:terminating|firing|dismissing|denying|refusing|letting|suspending|withholding)/i,
  /\b(?:that|this|it|the\s+(?:dismissal|termination|decision|refusal|policy|demotion|suspension|action|move))\s+(?:would|will|could|should|is|was|looks?|seems?|sounds?)\s+(?:be\s+|amount\s+to\s+|constitute\s+|like\s+)?(?:legal|illegal|unlawful|lawful|wrongful\s+dismissal|constructive\s+dismissal|discriminatory|discrimination|a\s+(?:human\s+rights|code|charter)\s+violation|harassment|retaliation|unfair\s+dismissal|just\s+cause)(?!\w)/i,
]

const DIRECTED_PATTERNS_FR: RegExp[] = [
  /\bvous\s+(?:devriez|pouvez|avez\s+le\s+droit\s+de|êtes\s+en\s+droit\s+de|auriez\s+intérêt\s+à|devez|êtes\s+libre\s+de|pourriez)\s+(?:le|la|les|l'|en|y|leur)?\s*(?:congédier|licencier|mettre\s+à\s+pied|suspendre|rétrograder|discipliner|refuser|nier|retenir|déduire|poursuivre|déposer|contester|renvoyer|révoquer)(?!\w)/i,
  /\b(?:congédiez|licenciez|suspendez|rétrogradez|refusez|niez|poursuivez|renvoyez|révoquez|disciplinez)\s+(?:le|la|les|l'|cet|ce|cette|l'employé)(?!\w)/i,
  /\bje\s+(?:vous\s+)?(?:recommande|conseille|suggère|préconise)\s+(?:de\s+|d')?(?:le|la|les|l'|en|y|leur)?\s*(?:congédier|licencier|suspendre|discipliner|refuser|nier|poursuivre|renvoyer|révoquer)/i,
]

const VERDICT_PATTERNS_FR: RegExp[] = [
  /\bvous\s+(?:êtes|seriez|serez|ne\s+serez\s+pas|n'êtes\s+pas)\s+(?:dans\s+vos\s+droits|en\s+droit\s+de|légalement\s+(?:autorisé|tenu|protégé|exposé|responsable)|responsable|à\s+l'abri|justifié)(?!\w)/i,
  /\bvous\s+avez\s+(?:des\s+motifs|juste\s+cause|un\s+motif|le\s+droit|des\s+raisons)\s+(?:pour|de)\s+(?:congédier|licencier|renvoyer|refuser|suspendre)/i,
  /\b(?:peu|pas|faible|aucun|minime)\s+(?:de\s+)?risque\s+(?:légal\s+)?(?:à|de|dans)\s+(?:congédier|licencier|refuser|suspendre|renvoyer)/i,
  /(?:ce|cette|c'|ça|cela|le\s+congédiement|la\s+décision)\s+(?:serait|est|sera|pourrait\s+être|semble|paraît|constitue|constituerait)\s+(?:un\s+)?(?:légal|illégal|licite|illicite|congédiement\s+(?:injustifié|déguisé|sans\s+juste\s+cause)|discriminatoire|discrimination|harcèlement|une\s+violation|juste\s+cause|représailles)(?!\w)/i,
]

/** Fragments crossing the external boundary — Advisor replies can be in
    either language, so both tables run every time. Empty = clean. */
export function detectAdvisorAdviceFlags(reply: string): string[] {
  return detectPatterns(reply, [
    ...DIRECTED_PATTERNS,
    ...VERDICT_PATTERNS,
    ...DIRECTED_PATTERNS_FR,
    ...VERDICT_PATTERNS_FR,
  ])
}

/** The repair note behind a flagged reply — names what crossed so the
    rewrite fixes the boundary instead of hedging. */
export function buildAdvisorRepairNote(flags: string[]): string {
  return (
    'Your draft to this EXTERNAL user crossed the legal-advice boundary — flagged:\n' +
    flags.map((f) => `- "${f}"`).join('\n') +
    '\nRewrite it describing what the law requires and the considerations plainly, with no directed call on a termination/discipline/accommodation decision, no verdict on the legality of their situation, and no assurance about their legal standing — for the high-risk call, point to qualified legal counsel. Keep the same language and formatting.'
  )
}

/** The fixed text that replaces a flagged reply the repair pass could not
    clean — the boundary the product promised, stated plainly. */
export const ADVISOR_FALLBACK_EN =
  'That call belongs to qualified legal counsel — I can’t direct a decision like that. What I can do is lay out the rule plainly: what the law requires, what the deadlines look like, and the questions to bring to counsel. Tell me which piece to start with.'
export const ADVISOR_FALLBACK_FR =
  'Cette décision revient à un conseiller juridique qualifié — je ne peux pas la trancher à votre place. Ce que je peux faire : exposer la règle clairement — ce que la loi exige, les délais, et les questions à apporter au conseiller. Dites-moi par quel morceau commencer.'

/** The Advisor isn't lang-keyed — pick the fallback language off the
    reply itself. Function-word counts beat charset sniffing for short
    French text. */
export function advisorFallbackLang(text: string): 'en' | 'fr' {
  const fr = (text.match(/\b(?:vous|votre|les|des|une|est|pour|avec|dans|que|qui|sur|être|avez|nous|par|pas|une|au|aux|ce|cette|de|du|la|le|en|et|ou|si|son|sa|ses)\b/gi) ?? []).length
  const en = (text.match(/\b(?:the|you|your|and|for|with|that|this|have|has|are|not|can|will|from|they|their|what|when|how)\b/gi) ?? []).length
  return fr > en ? 'fr' : 'en'
}
