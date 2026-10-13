import { describe, expect, it } from 'vitest'
import {
  ADVISOR_FALLBACK_EN,
  ADVISOR_FALLBACK_FR,
  advisorFallbackLang,
  detectAdvisorAdviceFlags,
} from './adviceScreen'

/* The external backstop — what an external-tier reply may never contain.
   Both language tables run on every reply: the Advisor is not lang-keyed. */
describe('detectAdvisorAdviceFlags (external-tier backstop)', () => {
  it('flags directed high-risk calls and legal verdicts in English', () => {
    for (const reply of [
      'You should fire her and document everything.',
      'You can terminate the employment now.',
      "I'd recommend firing him this week.",
      "You're within your rights to terminate.",
      'You have grounds to terminate her.',
      'That would be wrongful dismissal.',
      "There's little legal risk in firing her.",
      'My recommendation is to let her go.',
      'That sounds like harassment.',
      'Suspend them until the investigation closes.',
    ]) {
      expect(detectAdvisorAdviceFlags(reply), reply).not.toEqual([])
    }
  })

  it('flags directed calls and verdicts in French', () => {
    for (const reply of [
      'Vous devriez la congédier.',
      'Vous pouvez le licencier.',
      'Vous avez le droit de la suspendre.',
      'Ce serait un congédiement injustifié.',
      'Vous avez des motifs pour congédier.',
      'Vous êtes dans vos droits de refuser.',
      "Je vous recommande de le renvoyer.",
    ]) {
      expect(detectAdvisorAdviceFlags(reply), reply).not.toEqual([])
    }
  })

  it('statutory statements, counsel deflections and risk reads stay clean', () => {
    for (const reply of [
      'Ontario requires notice or pay in lieu of termination.',
      'For terminations, consult qualified legal counsel.',
      'You must provide written notice under the ESA.',
      'The risk here is a wrongful-dismissal claim.',
      'You could face a claim if notice is skipped.',
      'This is generally considered high-risk.',
      'Accommodation is required up to undue hardship.',
      'Terminations are high-risk — talk to qualified legal counsel before you decide.',
    ]) {
      expect(detectAdvisorAdviceFlags(reply), reply).toEqual([])
    }
    for (const reply of [
      'La LNT exige un préavis ou une indemnité.',
      'Pour un congédiement, consultez un avocat.',
      'Vous devez fournir un préavis écrit.',
      'Le risque ici est une poursuite pour congédiement injustifié.',
    ]) {
      expect(detectAdvisorAdviceFlags(reply), reply).toEqual([])
    }
  })

  it('fallbacks pass their own screen and pick the right language', () => {
    expect(detectAdvisorAdviceFlags(ADVISOR_FALLBACK_EN)).toEqual([])
    expect(detectAdvisorAdviceFlags(ADVISOR_FALLBACK_FR)).toEqual([])
    expect(advisorFallbackLang('Cette décision vous appartient.')).toBe('fr')
    expect(advisorFallbackLang('That call belongs to counsel.')).toBe('en')
    expect(advisorFallbackLang(ADVISOR_FALLBACK_EN)).toBe('en')
    expect(advisorFallbackLang(ADVISOR_FALLBACK_FR)).toBe('fr')
  })
})
