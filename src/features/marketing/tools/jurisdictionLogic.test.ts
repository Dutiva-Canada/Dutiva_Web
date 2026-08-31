import { describe, it, expect } from 'vitest'
import {
  QUESTIONS,
  visibleQuestions,
  isComplete,
  determineJurisdiction,
  isSupported,
  getResult,
  getQuestion,
  getOptionLabel,
} from './jurisdictionLogic'
import type { Answers } from './jurisdictionLogic'

describe('jurisdictionLogic', () => {
  describe('visibleQuestions', () => {
    it('shows the first two questions when no answers are given', () => {
      const visible = visibleQuestions({})
      expect(visible).toHaveLength(2)
      expect(visible[0]?.id).toBe('employerType')
      expect(visible[1]?.id).toBe('workProvince')
    })

    it('shows the QC language question only when workProvince is QC', () => {
      const visible = visibleQuestions({ workProvince: 'QC' })
      expect(visible.find((q) => q.id === 'qcLanguage')).toBeDefined()
    })

    it('does not show the QC language question when workProvince is ON', () => {
      const visible = visibleQuestions({ workProvince: 'ON' })
      expect(visible.find((q) => q.id === 'qcLanguage')).toBeUndefined()
    })

    it('does not show the QC language question when workProvince is other', () => {
      const visible = visibleQuestions({ workProvince: 'other' })
      expect(visible.find((q) => q.id === 'qcLanguage')).toBeUndefined()
    })
  })

  describe('isComplete', () => {
    it('returns false when no answers are given', () => {
      expect(isComplete({})).toBe(false)
    })

    it('returns true for a federal employer (only two questions needed)', () => {
      const answers: Answers = { employerType: 'federal', workProvince: 'ON' }
      expect(isComplete(answers)).toBe(true)
    })

    it('returns true for an ON employer with both questions answered', () => {
      const answers: Answers = { employerType: 'provincial', workProvince: 'ON' }
      expect(isComplete(answers)).toBe(true)
    })

    it('returns false for a QC employer without the language question answered', () => {
      const answers: Answers = { employerType: 'provincial', workProvince: 'QC' }
      expect(isComplete(answers)).toBe(false)
    })

    it('returns true for a QC employer with the language question answered', () => {
      const answers: Answers = { employerType: 'provincial', workProvince: 'QC', qcLanguage: 'yes' }
      expect(isComplete(answers)).toBe(true)
    })
  })

  describe('determineJurisdiction', () => {
    it('returns FED for a federally regulated employer regardless of province', () => {
      expect(
        determineJurisdiction({ employerType: 'federal', workProvince: 'ON' })?.jurisdiction,
      ).toBe('FED')
      expect(
        determineJurisdiction({ employerType: 'federal', workProvince: 'QC' })?.jurisdiction,
      ).toBe('FED')
      expect(
        determineJurisdiction({ employerType: 'federal', workProvince: 'other' })?.jurisdiction,
      ).toBe('FED')
    })

    it('returns ON for a provincial employer in Ontario', () => {
      expect(
        determineJurisdiction({ employerType: 'provincial', workProvince: 'ON' })?.jurisdiction,
      ).toBe('ON')
    })

    it('returns QC for a provincial employer in Quebec', () => {
      expect(
        determineJurisdiction({ employerType: 'provincial', workProvince: 'QC', qcLanguage: 'yes' })
          ?.jurisdiction,
      ).toBe('QC')
    })

    it('returns null for a provincial employer in another province', () => {
      expect(
        determineJurisdiction({ employerType: 'provincial', workProvince: 'other' }),
      ).toBeNull()
    })

    it('returns null for incomplete answers', () => {
      expect(determineJurisdiction({})).toBeNull()
      expect(determineJurisdiction({ employerType: 'provincial' })).toBeNull()
    })

    it('returns a result with a statute name and official source URL', () => {
      const result = determineJurisdiction({ employerType: 'provincial', workProvince: 'ON' })
      expect(result).not.toBeNull()
      expect(result?.statute.en).toContain('Employment Standards Act')
      expect(result?.officialSource.url).toMatch(/^https:\/\//)
    })
  })

  describe('isSupported', () => {
    it('returns true for FED, ON, QC', () => {
      expect(isSupported({ employerType: 'federal', workProvince: 'ON' })).toBe(true)
      expect(isSupported({ employerType: 'provincial', workProvince: 'ON' })).toBe(true)
      expect(
        isSupported({ employerType: 'provincial', workProvince: 'QC', qcLanguage: 'yes' }),
      ).toBe(true)
    })

    it('returns false for other provinces', () => {
      expect(isSupported({ employerType: 'provincial', workProvince: 'other' })).toBe(false)
    })
  })

  describe('getResult', () => {
    it('returns the result for each jurisdiction', () => {
      expect(getResult('ON').jurisdiction).toBe('ON')
      expect(getResult('QC').jurisdiction).toBe('QC')
      expect(getResult('FED').jurisdiction).toBe('FED')
    })
  })

  describe('getQuestion / getOptionLabel', () => {
    it('returns a question by id', () => {
      expect(getQuestion('employerType').id).toBe('employerType')
    })

    it('throws for an unknown question id', () => {
      expect(() => getQuestion('nonexistent' as never)).toThrow()
    })

    it('returns an option label in the requested language', () => {
      expect(getOptionLabel('workProvince', 'ON', 'en')).toBe('Ontario')
      expect(getOptionLabel('workProvince', 'ON', 'fr')).toBe('Ontario')
      expect(getOptionLabel('workProvince', 'QC', 'en')).toBe('Quebec')
      expect(getOptionLabel('workProvince', 'QC', 'fr')).toBe('Québec')
    })
  })

  describe('QUESTIONS', () => {
    it('has exactly three questions', () => {
      expect(QUESTIONS).toHaveLength(3)
    })

    it('has no statutory figures in any prompt or option label', () => {
      // The editorial rule: no notice periods, dollar thresholds, or deadline counts.
      // Check that no prompt or option label contains digits that could be a figure.
      for (const q of QUESTIONS) {
        expect(q.prompt.en).not.toMatch(/\d+/)
        expect(q.prompt.fr).not.toMatch(/\d+/)
        for (const opt of q.options) {
          expect(opt.label.en).not.toMatch(/\d+/)
          expect(opt.label.fr).not.toMatch(/\d+/)
        }
      }
    })
  })
})
