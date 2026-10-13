/** Shared matcher for the per-portal directed-advice screens. Each assistant
    declares its own ADVICE_PATTERNS (the register boundary differs by
    domain — securities direction, legal calls, verdicts on materials,
    coverage predictions, medical directives); the matcher just returns the
    flagged fragments so the caller can repair or suppress. */
export function detectPatterns(text: string, patterns: RegExp[]): string[] {
  const hits: string[] = []
  for (const re of patterns) {
    const m = re.exec(text)
    if (m) hits.push(m[0].trim().slice(0, 80))
  }
  return hits
}

/* Negation words that turn a promise-shape into the honest register —
   "can't promise you coverage" is the deflection, not a violation. Up
   to two words of slack covers "not a sure thing" without letting a
   distant "not" wash a real promise. */
const NEGATED_INTRO =
  /(?:can'?t|cannot|can\s+not|won'?t|wouldn'?t|don'?t|do\s+not|never|not|no|hardly|scarcely|impossible|pas|jamais|ne|non)\s*(?:[\w'’-]+\s+){0,2}$/i

/** detectPatterns minus hits that sit right behind a negation. Only
    promise/guarantee/prediction tables should use it — direction
    patterns flag negated text on purpose ("don't apply" IS the
    discouragement the screen exists to catch). */
export function detectHonestClaims(text: string, patterns: RegExp[]): string[] {
  const hits: string[] = []
  for (const re of patterns) {
    const m = re.exec(text)
    if (!m) continue
    const before = text.slice(Math.max(0, m.index - 40), m.index)
    if (!NEGATED_INTRO.test(before)) hits.push(m[0].trim().slice(0, 80))
  }
  return hits
}
