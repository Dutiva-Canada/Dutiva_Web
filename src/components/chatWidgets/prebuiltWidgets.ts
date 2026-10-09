import type { CalculatorSpec } from './widgetSpec'

/**
 * Prebuilt calculator specs — the two HR examples the widget catalog ships
 * with. They're plain spec objects, so a bot could emit the same JSON in a
 * ```dutiva-widget fence and get the identical widget; keeping them as
 * typed factories also gives tests a canonical spec to pin ESA math to.
 *
 * The `regulated` flag puts the "estimate — verify" line under both — these
 * numbers are ESA minimums, and the statutes move.
 *
 * All FR strings in this file: [FR self-authored] — no approved French
 * source exists for this feature yet.
 */

/**
 * Ontario ESA termination pay estimator.
 *
 * ESA s.57: one week of notice (or pay in lieu) per completed year of
 * service, to a maximum of eight weeks. Weekly pay here is the employee's
 * regular weekly wage — the prebuilt derives it as salary ÷ 52, which is
 * the common simplified conversion; ESA's actual "regular week" definition
 * can differ for irregular hours, which is exactly why the disclaimer shows.
 *
 * 3 years at $60,000 → 3 weeks × $1,153.85 → $3,461.54.
 */
export function ontarioTerminationPaySpec(): CalculatorSpec {
  return {
    type: 'calculator',
    title: {
      en: 'Ontario termination pay — ESA minimum',
      fr: 'Indemnité de licenciement en Ontario — minimum de la LNT',
    },
    data: {
      inputs: [
        {
          key: 'salary',
          label: { en: 'Annual salary', fr: 'Salaire annuel' },
          default: 60000,
          min: 0,
          step: 1000,
          unit: { en: '$ / year', fr: '$ / année' },
        },
        {
          key: 'years',
          label: { en: 'Completed years of service', fr: 'Années de service complétées' },
          default: 3,
          min: 0,
          max: 50,
          step: 0.5,
          unit: { en: 'years', fr: 'ans' },
        },
      ],
      /* pay = (salary / 52) × min(floor(years), 8) */
      formula: {
        op: 'mul',
        args: [
          { op: 'div', args: [{ op: 'ref', key: 'salary' }, { op: 'num', value: 52 }] },
          {
            op: 'min',
            args: [
              { op: 'floor', arg: { op: 'ref', key: 'years' } },
              { op: 'num', value: 8 },
            ],
          },
        ],
      },
      result: {
        label: { en: 'Minimum termination pay', fr: 'Indemnité minimale de licenciement' },
        format: 'currency',
      },
      breakdown: [
        {
          label: { en: 'Weeks of notice (ESA minimum)', fr: 'Semaines de préavis (minimum LNT)' },
          value: {
            op: 'min',
            args: [
              { op: 'floor', arg: { op: 'ref', key: 'years' } },
              { op: 'num', value: 8 },
            ],
          },
        },
        {
          label: { en: 'Regular weekly pay', fr: 'Salaire hebdomadaire régulier' },
          value: { op: 'div', args: [{ op: 'ref', key: 'salary' }, { op: 'num', value: 52 }] },
          format: 'currency',
        },
      ],
      regulated: true,
      note: {
        en: 'ESA s.57 — one week per completed year, eight-week cap. Severance under s.64 is separate.',
        fr: 'Art. 57 de la LNT — une semaine par année complétée, plafond de huit semaines. L’indemnité de cessation (art. 64) est distincte.',
      },
    },
  }
}

/**
 * Ontario overtime pay calculator.
 *
 * ESA s.22(1): hours beyond 44 in a work week pay at least 1.5× the regular
 * rate. Averaging agreements and some roles change the threshold — the
 * disclaimer covers that.
 *
 * $20/h × 50 h → 6 OT hours × $30 → $180 of overtime pay.
 */
export function ontarioOvertimeSpec(): CalculatorSpec {
  return {
    type: 'calculator',
    title: { en: 'Ontario overtime pay — weekly', fr: 'Rémunération des heures supplémentaires en Ontario — hebdomadaire' },
    data: {
      inputs: [
        {
          key: 'rate',
          label: { en: 'Regular hourly rate', fr: 'Taux horaire régulier' },
          default: 20,
          min: 0,
          step: 0.25,
          unit: { en: '$ / hour', fr: '$ / heure' },
        },
        {
          key: 'hours',
          label: { en: 'Hours worked this week', fr: 'Heures travaillées cette semaine' },
          default: 50,
          min: 0,
          max: 168,
          step: 1,
          unit: { en: 'hours', fr: 'heures' },
        },
      ],
      /* pay = max(0, hours − 44) × rate × 1.5 */
      formula: {
        op: 'mul',
        args: [
          {
            op: 'max',
            args: [
              { op: 'num', value: 0 },
              { op: 'sub', args: [{ op: 'ref', key: 'hours' }, { op: 'num', value: 44 }] },
            ],
          },
          { op: 'ref', key: 'rate' },
          { op: 'num', value: 1.5 },
        ],
      },
      result: {
        label: { en: 'Overtime pay for the week', fr: 'Rémunération des heures supplémentaires' },
        format: 'currency',
      },
      breakdown: [
        {
          label: { en: 'Overtime hours (over 44)', fr: 'Heures supplémentaires (au-delà de 44)' },
          value: {
            op: 'max',
            args: [
              { op: 'num', value: 0 },
              { op: 'sub', args: [{ op: 'ref', key: 'hours' }, { op: 'num', value: 44 }] },
            ],
          },
        },
        {
          label: { en: 'Overtime rate (1.5×)', fr: 'Taux majoré (1,5×)' },
          value: { op: 'mul', args: [{ op: 'ref', key: 'rate' }, { op: 'num', value: 1.5 }] },
          format: 'currency',
        },
      ],
      regulated: true,
      note: {
        en: 'ESA s.22 — over 44 hours in a work week, at least 1.5× the regular rate.',
        fr: 'Art. 22 de la LNT — au-delà de 44 heures par semaine de travail, au moins 1,5× le taux régulier.',
      },
    },
  }
}
