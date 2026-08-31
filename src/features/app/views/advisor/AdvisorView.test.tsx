import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { AdvisorView } from './AdvisorView'
import { resetAdvisorSession } from './advisorSession'

describe('AdvisorView', () => {
  /* Conversations persist in the module-level session store — reset per test.
     MatchMedia defaults to "no reduced motion" so the streaming tests below see
     the thinking → streaming → done lifecycle. The signed-in block overrides to
     reduced motion so assertions on long replies don't flake under CPU load. */
  const noReducedMotionMatchMedia = vi.fn((query: string) => ({
    matches: query.includes('min-width:'),
    media: query,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  }))

  beforeEach(() => {
    resetAdvisorSession()
    vi.stubGlobal('matchMedia', noReducedMotionMatchMedia)
  })

  it('renders the advisor home empty state with metrics, brief and priorities', () => {
    renderApp(<AdvisorView />, { route: '/app/advisor' })

    expect(screen.getByText('Good to see you, Riley.')).toBeInTheDocument()
    expect(screen.getByText("Here's what Advisor noticed since yesterday.")).toBeInTheDocument()

    /* Metric tiles (fixture-derived counts). */
    expect(screen.getByText('Compliance score')).toBeInTheDocument()
    expect(screen.getByText('82')).toBeInTheDocument()
    expect(screen.getByText('Active cases')).toBeInTheDocument()
    expect(screen.getByText('5 open tasks')).toBeInTheDocument()

    /* Daily brief + priorities feed. */
    expect(screen.getByText(/2 items need action today, and 6 signals/)).toBeInTheDocument()
    expect(screen.getByText('Priorities today')).toBeInTheDocument()
    expect(screen.getByText('Jordan Mensah — counsel response outstanding')).toBeInTheDocument()

    /* Thread list groups from the chats fixtures (c1 is pinned + today). */
    expect(screen.getByText('Pinned')).toBeInTheDocument()
    expect(screen.getByText('Previous 7 days')).toBeInTheDocument()
    expect(screen.getAllByText('Terminating Jordan Mensah — Ontario')).toHaveLength(2)
  })

  it('toggles a priority "Why" expander', () => {
    renderApp(<AdvisorView />, { route: '/app/advisor' })

    const whyButtons = screen.getAllByRole('button', { name: 'Why' })
    expect(whyButtons.length).toBeGreaterThan(0)
    fireEvent.click(whyButtons[0]!)
    expect(screen.getByText(/A legal-review request has been open since Jul 5/)).toBeInTheDocument()
  })

  it('opens a seeded thread and renders its transcript without re-streaming', () => {
    renderApp(<AdvisorView />, { route: '/app/advisor' })

    fireEvent.click(screen.getByRole('button', { name: /Offer letter — Senior Analyst, BC/ }))

    /* Seeded messages render fully (status done — no typing dots). */
    expect(
      screen.getByText('Draft an offer letter for a Senior Analyst role in BC.'),
    ).toBeInTheDocument()
    expect(screen.getByText('BC-specific note')).toBeInTheDocument()
    expect(screen.queryByText('Advisor is thinking')).not.toBeInTheDocument()

    /* Jurisdiction context line stays visible on the active conversation. */
    expect(screen.getByText('British Columbia — Employment Standards Act (BC)')).toBeInTheDocument()

    /* Doc-generate chips + follow-up chips from the fixture. */
    expect(screen.getByText('Offer of employment letter (Ontario)')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Generate' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Set probation terms' })).toBeInTheDocument()
  })

  describe('with fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('streams the canned acknowledgement after a free-form send in a thread', () => {
      renderApp(<AdvisorView />, { route: '/app/advisor' })

      fireEvent.click(screen.getByRole('button', { name: /Remote work policy refresh/ }))

      const composer = screen.getByPlaceholderText('Message Advisor…')
      fireEvent.change(composer, { target: { value: 'What about vacation payout?' } })
      fireEvent.keyDown(composer, { key: 'Enter' })

      /* The user bubble lands immediately… */
      expect(screen.getByText('What about vacation payout?')).toBeInTheDocument()

      /* …then thinking (850ms) → streaming (3 chars / 16ms) → done. */
      act(() => {
        vi.advanceTimersByTime(849)
      })
      expect(screen.getByText('Advisor is thinking')).toBeInTheDocument()
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(screen.getByText(/Noted — I've added that to this case/)).toBeInTheDocument()
    })

    it('routes a signed-out home-composer crisis message to the support thread, not a scenario', () => {
      renderApp(<AdvisorView />, { route: '/app/advisor' })

      const composer = screen.getByPlaceholderText('Ask Advisor anything about your team…')
      fireEvent.change(composer, { target: { value: 'I feel suicidal' } })
      fireEvent.keyDown(composer, { key: 'Enter' })

      act(() => {
        vi.advanceTimersByTime(849 + 8000)
      })
      /* Maintained 9-8-8 resource, in a "Support" thread — no scenario script
         (s4's jurisdiction prompt is what routeScenarioFromText would give). */
      expect(screen.getByText(/please contact 9-8-8/)).toBeInTheDocument()
      expect(screen.getAllByText('Support').length).toBeGreaterThan(0)
      expect(screen.queryByText('Which jurisdiction applies?')).not.toBeInTheDocument()
    })

    it('crisis text wins over a dispatched termination flow (intercept precedes flow routing)', () => {
      /* Same navigation contract as the intake test below — but the prompt
         carries a crisis signal, so the quick form must never render. */
      renderApp(<AdvisorView />, {
        route: '/app/advisor',
        state: {
          prompt: 'They want to terminate me and I feel suicidal',
          flowKey: 'termination',
        },
      })
      act(() => {
        vi.advanceTimersByTime(849 + 8000)
      })
      expect(screen.getByText(/please contact 9-8-8/)).toBeInTheDocument()
      expect(
        screen.queryByText(/To calculate this correctly and flag any risk/),
      ).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Employment type')).not.toBeInTheDocument()
      /* The thread sheds its flow framing: support pill instead of the flow
         jurisdiction line, and a "Support" thread title (AGENT.md §8). */
      expect(screen.getByText('Supportive — not a compliance matter')).toBeInTheDocument()
      expect(screen.queryByText('Ontario — ESA, 2000')).not.toBeInTheDocument()
      expect(screen.getAllByText('Support').length).toBeGreaterThan(0)
    })

    it('runs the termination intake: quick form → answer chips → assessment with docs and follow-ups', () => {
      /* The intake flow is started by its navigation contract (Home /
         Workflows dispatch { prompt, flowKey } router state). */
      renderApp(<AdvisorView />, {
        route: '/app/advisor',
        state: {
          prompt: 'I need to terminate an employee in Ontario.',
          flowKey: 'termination',
        },
      })
      expect(screen.getByText('I need to terminate an employee in Ontario.')).toBeInTheDocument()
      expect(screen.getByText('Termination — new case')).toBeInTheDocument()

      /* Intro streams, then the intake quick form renders (5 labelled selects). */
      act(() => {
        vi.advanceTimersByTime(849 + 4000)
      })
      expect(screen.getByText(/To calculate this correctly and flag any risk/)).toBeInTheDocument()
      expect(screen.getByLabelText('Employment type')).toBeInTheDocument()
      expect(screen.getByLabelText('Length of service')).toBeInTheDocument()

      /* Change an answer, then submit. */
      fireEvent.change(screen.getByLabelText('Reason for termination'), {
        target: { value: 'Performance' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

      /* The answers land as user chips and the form is gone. */
      expect(screen.getByText('Performance')).toBeInTheDocument()
      expect(screen.getByText('Written, no termination clause')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument()

      /* Assessment turn streams: risk card, citations, doc chips, follow-ups. */
      act(() => {
        vi.advanceTimersByTime(849 + 12000)
      })
      expect(screen.getByText("Here's the assessment for this case.")).toBeInTheDocument()
      expect(screen.getByText('Notice exposure risk')).toBeInTheDocument()
      expect(screen.getByText('ESA s.57 — Notice of termination')).toBeInTheDocument()
      expect(screen.getByText('Termination Letter')).toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: 'Generate' })).toHaveLength(3)
      expect(
        screen.getByRole('button', { name: 'Run severance estimator (beta)' }),
      ).toBeInTheDocument()
    })

    it('routes home-composer text to a demo response mode and lists the thread under Today', () => {
      renderApp(<AdvisorView />, { route: '/app/advisor' })

      const composer = screen.getByPlaceholderText('Ask Advisor anything about your team…')
      fireEvent.change(composer, {
        target: { value: 'What changed in Ontario employment law this year?' },
      })
      fireEvent.keyDown(composer, { key: 'Enter' })

      /* Current-info scenario (s6) is selected and grouped under Today. */
      expect(screen.getAllByText('What changed in ON law?').length).toBeGreaterThan(0)
      expect(
        screen.getByText('What changed in Ontario employment law this year?'),
      ).toBeInTheDocument()
      expect(screen.getByText('Ontario — current-source check')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(849 + 8000)
      })
      expect(screen.getByText(/Working for Workers series continued/)).toBeInTheDocument()
      /* Info banner + follow-ups render once the turn is done. */
      expect(screen.getByText('Uses live web sources.')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Summarize the minimum-wage change' }),
      ).toBeInTheDocument()
    })

    it('asks for jurisdiction first when no province cue is given (never assumes Ontario)', () => {
      renderApp(<AdvisorView />, { route: '/app/advisor' })

      const composer = screen.getByPlaceholderText('Ask Advisor anything about your team…')
      fireEvent.change(composer, {
        target: { value: "What's the notice period we owe an employee?" },
      })
      fireEvent.keyDown(composer, { key: 'Enter' })

      act(() => {
        vi.advanceTimersByTime(849 + 8000)
      })
      /* Jurisdiction-unknown turn: asks first, withholds statutory figures. */
      expect(screen.getByText(/I need to know the jurisdiction/)).toBeInTheDocument()
      expect(screen.getByText('Which jurisdiction applies?')).toBeInTheDocument()
      expect(screen.getAllByText('Confirm jurisdiction before use').length).toBeGreaterThan(0)

      /* Confirming a province resolves the thread to the assumed state. */
      fireEvent.click(screen.getByRole('button', { name: 'Ontario' }))
      act(() => {
        vi.advanceTimersByTime(849 + 8000)
      })
      expect(screen.getByText(/Thanks — Ontario it is/)).toBeInTheDocument()
      expect(screen.getAllByText('Ontario — ESA, 2000').length).toBeGreaterThan(0)
    })
  })

  describe('signed in', () => {
    beforeEach(() => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
          matches: query.includes('min-width:') || query === '(prefers-reduced-motion: reduce)',
          media: query,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
          onchange: null,
        })),
      )
    })

    afterEach(() => {
      vi.unstubAllGlobals()
      vi.doUnmock('@/lib/supabaseClient')
      vi.resetModules()
    })

    /* PlanProvider (now in AppProviders) queries profiles.from().select().eq().maybeSingle() —
       mock it to resolve with a free plan so PlanGate doesn't block in production mode. */
    const mockFrom = () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { plan: 'pro' }, error: null }),
      }
      return vi.fn().mockReturnValue(chain)
    }

    it('routes home-composer text containing a flow keyword to real AI, not the scripted flow', async () => {
      const fakeSession = { user: { id: 'u1' } }
      const invoke = vi.fn().mockResolvedValue({
        data: { data: { reply: 'Real AI answer about termination.', conversation_id: 'conv-1' } },
        error: null,
      })
      vi.doMock('@/lib/supabaseClient', () => ({
        supabase: {
          auth: {
            getSession: () => Promise.resolve({ data: { session: fakeSession } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
          },
          rpc: vi.fn(() => Promise.resolve({ data: true, error: null })),
          from: mockFrom(),
          functions: { invoke },
        },
      }))
      vi.resetModules()

      const { renderApp: renderAppFresh } = await import('@/test/renderApp')
      const { AdvisorView: AdvisorViewFresh } = await import('./AdvisorView')
      const { resetAdvisorSession: resetAdvisorSessionFresh } = await import('./advisorSession')
      resetAdvisorSessionFresh()

      renderAppFresh(<AdvisorViewFresh />, { route: '/app/advisor' })

      const composer = await screen.findByPlaceholderText('Ask Advisor anything about your team…')
      fireEvent.change(composer, { target: { value: 'I need to terminate an employee' } })
      fireEvent.keyDown(composer, { key: 'Enter' })

      expect(invoke).toHaveBeenCalledWith('advisor-chat', {
        body: {
          message: 'I need to terminate an employee',
          conversation_id: null,
          organization_id: null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      })
      /* Real (unmocked) timers: the engine's 850ms thinking delay plus the
         streaming animation exceed testing-library's default 1000ms wait. */
      expect(
        await screen.findByText('Real AI answer about termination.', {}, { timeout: 3000 }),
      ).toBeInTheDocument()
      /* The scripted termination quick-form must NOT have launched. */
      expect(
        screen.queryByText(/To calculate this correctly and flag any risk/),
      ).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Employment type')).not.toBeInTheDocument()
    })

    it('intercepts a crisis message before any model call, even with a flow keyword', async () => {
      const fakeSession = { user: { id: 'u1' } }
      const invoke = vi.fn().mockResolvedValue({ data: { data: { recorded: 1 } }, error: null })
      vi.doMock('@/lib/supabaseClient', () => ({
        supabase: {
          auth: {
            getSession: () => Promise.resolve({ data: { session: fakeSession } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
          },
          rpc: vi.fn(() => Promise.resolve({ data: true, error: null })),
          from: mockFrom(),
          functions: { invoke },
        },
      }))
      vi.resetModules()

      const { renderApp: renderAppFresh } = await import('@/test/renderApp')
      const { AdvisorView: AdvisorViewFresh } = await import('./AdvisorView')
      const { resetAdvisorSession: resetAdvisorSessionFresh } = await import('./advisorSession')
      resetAdvisorSessionFresh()

      renderAppFresh(<AdvisorViewFresh />, { route: '/app/advisor' })

      const composer = await screen.findByPlaceholderText('Ask Advisor anything about your team…')
      /* Signed-in home-composer path: the crisis signal must stop the turn
         before the model call (flow-routing precedence is covered by the
         fake-timer dispatch test above). */
      fireEvent.change(composer, {
        target: { value: 'They want to terminate me and I feel suicidal' },
      })
      fireEvent.keyDown(composer, { key: 'Enter' })

      /* The maintained 9-8-8 resource streams in (never model-generated). */
      expect(await screen.findByText(/9-8-8/, {}, { timeout: 8000 })).toBeInTheDocument()
      /* No model call, no scripted flow — only the safety-event log. */
      expect(invoke).not.toHaveBeenCalledWith('advisor-chat', expect.anything())
      expect(invoke).toHaveBeenCalledWith('advisor-safety-event', {
        body: { conversation_id: null, actions: ['crisis-intercept'] },
      })
      expect(screen.queryByLabelText('Employment type')).not.toBeInTheDocument()
    })

    it('answers a beta usage limit as a reply, not as a failure to retry', async () => {
      const fakeSession = { user: { id: 'u1' } }
      /* What supabase-js hands back for the guardrail's 429. */
      const invoke = vi.fn().mockResolvedValue({
        data: null,
        error: Object.assign(new Error('Edge Function returned a non-2xx status code'), {
          context: {
            status: 429,
            json: () =>
              Promise.resolve({
                code: 'ai_usage_limit',
                scope: 'daily',
                retry_after_seconds: 7200,
              }),
          },
        }),
      })
      vi.doMock('@/lib/supabaseClient', () => ({
        supabase: {
          auth: {
            getSession: () => Promise.resolve({ data: { session: fakeSession } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
          },
          rpc: vi.fn(() => Promise.resolve({ data: true, error: null })),
          from: mockFrom(),
          functions: { invoke },
        },
      }))
      vi.resetModules()

      const { renderApp: renderAppFresh } = await import('@/test/renderApp')
      const { AdvisorView: AdvisorViewFresh } = await import('./AdvisorView')
      const { resetAdvisorSession: resetAdvisorSessionFresh } = await import('./advisorSession')
      resetAdvisorSessionFresh()

      renderAppFresh(<AdvisorViewFresh />, { route: '/app/advisor' })

      const composer = await screen.findByPlaceholderText('Ask Advisor anything about your team…')
      fireEvent.change(composer, { target: { value: 'What notice does a 3-year employee get?' } })
      fireEvent.keyDown(composer, { key: 'Enter' })

      /* The reply streams in, so wait on the tail of the sentence — the
         reassurance that the rest of the product still works. */
      expect(
        await screen.findByText(/Everything else in Dutiva still works/, {}, { timeout: 8000 }),
      ).toBeInTheDocument()
      expect(screen.getByText(/beta Advisor limit/)).toBeInTheDocument()
      expect(screen.getByText(/about 2 hours/)).toBeInTheDocument()
      /* Metered is not broken: no outage copy, and no Retry button that would
         only earn a second refusal. */
      expect(
        screen.queryByText('The AI Advisor is temporarily unavailable.'),
      ).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
    })

    it('offers prepaid reply packs on a commercial limit, not Retry', async () => {
      const fakeSession = { user: { id: 'u1' } }
      const invoke = vi.fn().mockResolvedValue({
        data: null,
        error: Object.assign(new Error('Edge Function returned a non-2xx status code'), {
          context: {
            status: 429,
            json: () =>
              Promise.resolve({
                code: 'ai_usage_limit',
                scope: 'commercial',
                retry_after_seconds: 86_400,
              }),
          },
        }),
      })
      vi.doMock('@/lib/supabaseClient', () => ({
        supabase: {
          auth: {
            getSession: () => Promise.resolve({ data: { session: fakeSession } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
          },
          rpc: vi.fn(() => Promise.resolve({ data: true, error: null })),
          from: mockFrom(),
          functions: { invoke },
        },
      }))
      vi.resetModules()

      const { renderApp: renderAppFresh } = await import('@/test/renderApp')
      const { AdvisorView: AdvisorViewFresh } = await import('./AdvisorView')
      const { resetAdvisorSession: resetAdvisorSessionFresh } = await import('./advisorSession')
      resetAdvisorSessionFresh()

      renderAppFresh(<AdvisorViewFresh />, { route: '/app/advisor' })

      const composer = await screen.findByPlaceholderText('Ask Advisor anything about your team…')
      fireEvent.change(composer, { target: { value: 'What notice does a 3-year employee get?' } })
      fireEvent.keyDown(composer, { key: 'Enter' })

      expect(
        await screen.findByText(/80 included Advisor replies/, {}, { timeout: 8000 }),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /50 replies/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /200 replies/ })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
      expect(screen.queryByText(/beta Advisor limit/)).not.toBeInTheDocument()
    })
  })

  describe('production mode', () => {
    afterEach(() => {
      vi.doUnmock('@/features/app/views/memory/conversationsApi')
      vi.doUnmock('@/lib/supabaseClient')
      vi.resetModules()
    })

    it('selects a production conversation from search nav chatId', async () => {
      const convId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
      vi.doMock('@/features/app/views/memory/conversationsApi', () => ({
        listOwnConversations: vi.fn().mockResolvedValue([
          {
            id: convId,
            messages: [{ role: 'user', content: 'Hello prod' }],
            updatedAt: '2026-08-23T12:00:00Z',
            lastAdvisorResponse: null,
          },
        ]),
        getOwnConversation: vi.fn().mockResolvedValue({
          id: convId,
          messages: [
            { role: 'user', content: 'Hello prod' },
            { role: 'assistant', content: 'Prod reply from backend' },
          ],
          updatedAt: '2026-08-23T12:00:00Z',
          lastAdvisorResponse: null,
        }),
        deleteOwnConversation: vi.fn(),
      }))

      const { listChain, mockProductionWorkspace } = await import('@/test/productionWorkspace')
      mockProductionWorkspace({
        tables: {
          employees: () => ({ select: () => listChain([]) }),
          hr_cases: () => ({ select: () => listChain([]) }),
          compliance_tasks: () => ({ select: () => listChain([]) }),
          compliance_findings: () => ({ select: () => listChain([]) }),
          hr_policies: () => ({ select: () => listChain([]) }),
        },
      })
      vi.resetModules()

      const { renderApp: renderAppFresh } = await import('@/test/renderApp')
      const { AdvisorView: AdvisorViewFresh } = await import('./AdvisorView')
      const { resetAdvisorSession: resetAdvisorSessionFresh } = await import('./advisorSession')
      resetAdvisorSessionFresh()

      renderAppFresh(<AdvisorViewFresh />, {
        route: '/app/advisor',
        state: { chatId: convId },
      })

      expect(await screen.findByText('Hello prod')).toBeInTheDocument()
      expect(await screen.findByText('Prod reply from backend')).toBeInTheDocument()
    })
  })
})
