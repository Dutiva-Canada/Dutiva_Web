/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { describe, expect, it, vi } from 'vitest'
import { createAdvisorComposerHandlers } from './advisorComposerHandlers'

describe('createAdvisorComposerHandlers', () => {
  it('routes signed-out idle send to demo scenarios', () => {
    const startScenario = vi.fn()
    const startFlow = vi.fn()
    const startCrisisThread = vi.fn(() => false)

    const { idleSend } = createAdvisorComposerHandlers({
      authStatus: 'signed-out',
      startCrisisThread,
      startFlow,
      startScenario,
    })

    idleSend('How much notice for termination?')
    expect(startScenario).toHaveBeenCalled()
    expect(startFlow).not.toHaveBeenCalled()
  })

  it('routes signed-in home send to the real backend flow', () => {
    const startScenario = vi.fn()
    const startFlow = vi.fn()
    const startCrisisThread = vi.fn(() => false)

    const { homeSend } = createAdvisorComposerHandlers({
      authStatus: 'signed-in',
      startCrisisThread,
      startFlow,
      startScenario,
    })

    homeSend('Draft a warning letter')
    expect(startFlow).toHaveBeenCalledWith('fallback', 'Draft a warning letter')
    expect(startScenario).not.toHaveBeenCalled()
  })

  it('short-circuits on crisis intercept', () => {
    const startScenario = vi.fn()
    const startFlow = vi.fn()
    const startCrisisThread = vi.fn(() => true)

    const { idleSend } = createAdvisorComposerHandlers({
      authStatus: 'signed-out',
      startCrisisThread,
      startFlow,
      startScenario,
    })

    idleSend('I want to hurt myself')
    expect(startCrisisThread).toHaveBeenCalled()
    expect(startScenario).not.toHaveBeenCalled()
    expect(startFlow).not.toHaveBeenCalled()
  })
})
