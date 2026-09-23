import { settingsMessages as M } from '@/i18n/messages/settings'

/**
 * Shared jurisdiction vocabulary for the workspace profile/org boundary.
 *
 * `profiles.province` stores a human-readable province name ("Ontario");
 * `organizations.jurisdictions` stores codes ("CA-ON") that scope monitoring
 * and templates. The mini-setup on Home writes both from one picker, so the
 * option list and the name→code map live together here.
 */

/** Stored `profiles.province` values — Federal means Canada Labour Code. */
export const JURISDICTION_OPTIONS = [
  { value: 'Federal', label: M.settings_prov_federal },
  { value: 'Alberta', label: null },
  { value: 'British Columbia', label: null },
  { value: 'Manitoba', label: null },
  { value: 'New Brunswick', label: null },
  { value: 'Newfoundland and Labrador', label: null },
  { value: 'Nova Scotia', label: null },
  { value: 'Ontario', label: null },
  { value: 'Prince Edward Island', label: null },
  { value: 'Quebec', label: null },
  { value: 'Saskatchewan', label: null },
  { value: 'Northwest Territories', label: null },
  { value: 'Nunavut', label: null },
  { value: 'Yukon', label: null },
] as const

/** Province display name (profiles.province) → organizations.jurisdictions code. */
export const PROVINCE_TO_JURISDICTION: Record<string, string> = {
  Federal: 'CA-Federal',
  Alberta: 'CA-AB',
  'British Columbia': 'CA-BC',
  Manitoba: 'CA-MB',
  'New Brunswick': 'CA-NB',
  'Newfoundland and Labrador': 'CA-NL',
  'Nova Scotia': 'CA-NS',
  'Northwest Territories': 'CA-NT',
  Nunavut: 'CA-NU',
  Ontario: 'CA-ON',
  'Prince Edward Island': 'CA-PE',
  Quebec: 'CA-QC',
  Saskatchewan: 'CA-SK',
  Yukon: 'CA-YT',
}
