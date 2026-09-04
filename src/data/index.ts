/**
 * Dutiva sample-data fixtures — typed transcription of the design-handoff
 * prototype's seed builders. Views consume data through this public barrel
 * rather than importing fixture modules directly, preserving a stable
 * boundary for a future Supabase-backed data layer.
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
export { isCanonicalMemoryDate, MEMORY_DATE_YEAR_MAX, MEMORY_DATE_YEAR_MIN } from './memoryDates'
export * from './hiring'
