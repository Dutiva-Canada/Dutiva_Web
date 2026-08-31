import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerServiceWorker, reloadOnWorkerTakeover } from './registerServiceWorker'

/** A stand-in for navigator.serviceWorker that captures the controllerchange
    handler so a test can fire it, and reports a given initial controller. */
function fakeContainer(controller: object | null) {
  let handler: (() => void) | null = null
  return {
    controller,
    addEventListener: (type: string, cb: () => void) => {
      if (type === 'controllerchange') handler = cb
    },
    /** Simulate the browser handing control to a new worker. */
    fire: () => handler?.(),
  }
}

function asContainer(c: ReturnType<typeof fakeContainer>): ServiceWorkerContainer {
  return c as unknown as ServiceWorkerContainer
}

describe('registerServiceWorker', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('is a no-op outside a production build (dev server / tests)', () => {
    const register = vi.fn().mockResolvedValue(undefined)
    const swAddEventListener = vi.fn()
    /* Present a service-worker-capable navigator so the production guard is
       the only thing that can stop registration. */
    vi.stubGlobal('navigator', {
      serviceWorker: { register, addEventListener: swAddEventListener, controller: null },
    })
    const addEventListener = vi.spyOn(window, 'addEventListener')

    registerServiceWorker()

    expect(import.meta.env.PROD).toBe(false)
    expect(addEventListener).not.toHaveBeenCalledWith('load', expect.any(Function))
    expect(register).not.toHaveBeenCalled()
    /* The auto-recovery controllerchange listener is gated by the same guard,
       so it must not be wired up in dev / tests either. */
    expect(swAddEventListener).not.toHaveBeenCalled()
  })
})

describe('reloadOnWorkerTakeover', () => {
  it('reloads once when a replacement worker takes control of a marketing tab', () => {
    const container = fakeContainer({/* a worker already controlled this load */})
    const reload = vi.fn()

    reloadOnWorkerTakeover(asContainer(container), { pathname: '/', reload })
    container.fire()

    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('does not reload on the first control hand-off (no prior controller)', () => {
    const container = fakeContainer(null) // first visit — nothing was controlling
    const reload = vi.fn()

    reloadOnWorkerTakeover(asContainer(container), { pathname: '/', reload })
    container.fire()

    expect(reload).not.toHaveBeenCalled()
  })

  it('does not reload inside the /app workspace, to preserve unsaved drafts', () => {
    const container = fakeContainer({})
    const reload = vi.fn()

    reloadOnWorkerTakeover(asContainer(container), { pathname: '/app/cases', reload })
    container.fire()

    expect(reload).not.toHaveBeenCalled()
  })

  it('reloads at most once across repeated controllerchange events', () => {
    const container = fakeContainer({})
    const reload = vi.fn()

    reloadOnWorkerTakeover(asContainer(container), { pathname: '/', reload })
    container.fire()
    container.fire()
    container.fire()

    expect(reload).toHaveBeenCalledTimes(1)
  })
})
