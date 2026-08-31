/**
 * Dutiva sample-data fixtures — typed transcription of the design-handoff
 * prototype's seed builders. Views import from here (never inline entity
 * data) so a future Supabase provider can replace this module wholesale.
 */

export * from './types'
export * from './analytics'
export * from './workforce'
export * from './employees'
export * from './cases'
export * from './tasks'
export * from './policies'
export * from './compliance'
export * from './communications'
export * from './chats'
export * from './notifications'
export * from './documents'
export * from './knowledge'
export * from './calendar'
export * from './memories'
export { isCanonicalMemoryDate } from './memoryDates'
