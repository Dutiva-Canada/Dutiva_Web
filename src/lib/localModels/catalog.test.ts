import { describe, expect, it } from 'vitest'
import { LOCAL_MODEL_CATALOG, localModelById } from './catalog'

/**
 * The installable-model catalogue is the Settings surface's source of truth.
 * These tests pin catalogue integrity — every entry must be installable
 * (a transformers.js task + a real-shaped HF repo id) and honestly labelled
 * (a size the user can plan around, bilingual copy).
 */

describe('LOCAL_MODEL_CATALOG', () => {
  it('has unique ids and repo ids', () => {
    const ids = LOCAL_MODEL_CATALOG.map((m) => m.id)
    const repos = LOCAL_MODEL_CATALOG.map((m) => m.repoId)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(repos).size).toBe(repos.length)
  })

  it('every entry is installable: org/repo id, a known task, honest size', () => {
    const tasks = new Set([
      'text2text-generation',
      'text-generation',
      'image-to-text',
      'automatic-speech-recognition',
      'feature-extraction',
    ])
    for (const m of LOCAL_MODEL_CATALOG) {
      expect(m.repoId).toMatch(/^[\w.-]+\/[\w.-]+$/)
      expect(tasks.has(m.task)).toBe(true)
      expect(m.approxSizeMb).toBeGreaterThan(0)
      expect(m.modalities.length).toBeGreaterThan(0)
      expect(m.description.en.length).toBeGreaterThan(0)
      expect(m.description.fr.length).toBeGreaterThan(0)
    }
  })

  it('covers multimodal input — at least one image and one audio model', () => {
    expect(LOCAL_MODEL_CATALOG.some((m) => m.modalities.includes('image'))).toBe(true)
    expect(LOCAL_MODEL_CATALOG.some((m) => m.modalities.includes('audio'))).toBe(true)
  })

  it('localModelById resolves catalogue entries only', () => {
    expect(localModelById(LOCAL_MODEL_CATALOG[0]!.id)?.repoId).toBe(LOCAL_MODEL_CATALOG[0]!.repoId)
    expect(localModelById('nope')).toBeUndefined()
  })
})
