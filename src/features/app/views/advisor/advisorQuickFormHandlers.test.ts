/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { describe, expect, it, vi } from 'vitest'
import { freshQuickForm } from './advisorFlows'
import { createAdvisorQuickFormHandlers } from './advisorQuickFormHandlers'

describe('createAdvisorQuickFormHandlers', () => {
  it('updates a quick-form field value', () => {
    let extras: Record<string, import('./advisorFlows').MessageExtras> = {
      'msg-1': { quickForm: freshQuickForm() },
    }
    const updateExtras = vi.fn((updater: (prev: typeof extras) => typeof extras) => {
      extras = updater(extras)
    })

    const { changeQuickField } = createAdvisorQuickFormHandlers({
      extras,
      updateExtras,
      pushUser: vi.fn(),
      pushAdvisor: vi.fn(),
      toToneCard: vi.fn(),
    })

    changeQuickField('msg-1', 0, 'Ontario')
    expect(extras['msg-1']?.quickForm?.fields[0]?.value).toBe('Ontario')
  })

  it('ignores submit when the form is already submitted', () => {
    const form = freshQuickForm()
    form.submitted = true
    const pushAdvisor = vi.fn()

    const { submitQuickForm } = createAdvisorQuickFormHandlers({
      extras: { 'msg-1': { quickForm: form } },
      updateExtras: vi.fn(),
      pushUser: vi.fn(),
      pushAdvisor,
      toToneCard: vi.fn(),
    })

    submitQuickForm('msg-1')
    expect(pushAdvisor).not.toHaveBeenCalled()
  })
})
