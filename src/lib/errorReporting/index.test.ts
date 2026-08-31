import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  __resetErrorReportingForTest,
  installErrorReporting,
  makeGlobalErrorHandlers,
  reportRecoverableError,
  reportRouteError,
  reportingEndpoint,
} from './index'
import type { Reporter } from './reporter'

afterEach(() => {
  __resetErrorReportingForTest()
  vi.restoreAllMocks()
})

describe('reporting gate', () => {
  it('is inert in the test environment (VERCEL_ENV and VITE_SUPABASE_URL empty)', () => {
    // vite.config forces both empty for the whole suite, so reporting is off.
    expect(reportingEndpoint()).toBeNull()
  })

  it('installErrorReporting adds no listeners when inert', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    installErrorReporting()
    expect(addSpy).not.toHaveBeenCalledWith('error', expect.anything())
    expect(addSpy).not.toHaveBeenCalledWith('unhandledrejection', expect.anything())
  })

  it('reportRouteError is a no-op when reporting was never installed', () => {
    expect(() => reportRouteError(new Error('x'))).not.toThrow()
  })

  it('reportRecoverableError is a no-op when reporting was never installed', () => {
    expect(() => reportRecoverableError(new Error('x'), { componentStack: 'x' })).not.toThrow()
  })
})

describe('makeGlobalErrorHandlers', () => {
  function stubReporter(): Reporter & { calls: unknown[] } {
    const calls: unknown[] = []
    return { calls, report: (input) => calls.push(input) }
  }

  it('routes window error events with the thrown Error', () => {
    const reporter = stubReporter()
    const { onError } = makeGlobalErrorHandlers(reporter)
    const err = new Error('global boom')
    onError({ error: err, message: 'global boom' })
    expect(reporter.calls).toEqual([expect.objectContaining({ error: err, kind: 'window-error' })])
  })

  it('falls back to the message when no Error object is present', () => {
    const reporter = stubReporter()
    const { onError } = makeGlobalErrorHandlers(reporter)
    onError({ message: 'script error' })
    expect(reporter.calls).toEqual([
      expect.objectContaining({ error: 'script error', kind: 'window-error' }),
    ])
  })

  it('routes unhandled rejections with the reason', () => {
    const reporter = stubReporter()
    const { onRejection } = makeGlobalErrorHandlers(reporter)
    onRejection({ reason: 'rejected value' })
    expect(reporter.calls).toEqual([
      expect.objectContaining({ error: 'rejected value', kind: 'unhandled-rejection' }),
    ])
  })
})
