import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { DoclibProvider } from '../DoclibProvider'
import { fillProgress, templateTokens } from '../engine'
import { templateByTid } from '../data'
import { GenerateScreen } from './GenerateScreen'

const PATH = '/app/documents/generate/:templateId'

const renderWizard = (templateId: string) =>
  renderApp(
    <DoclibProvider>
      <GenerateScreen />
    </DoclibProvider>,
    { route: `/app/documents/generate/${templateId}`, path: PATH },
  )

/**
 * Answer every required question of a template, and report how many distinct
 * merge-backed fields that filled. Derived from the template rather than
 * listed, so a question added later is answered here too.
 */
const fillRequired = (templateId: string): number => {
  const tpl = [...templateByTid.values()].find((t) => t.id === templateId)
  if (!tpl) throw new Error(`missing template ${templateId}`)
  let filled = 0
  for (const q of tpl.questions) {
    if (!q.required) continue
    if (q.type === 'radio') {
      /* A radio renders as a row of buttons with no associated control, so
         `getByLabelText` cannot reach it — click the first option instead. */
      const first = q.options?.[0]
      if (!first) throw new Error(`radio ${q.id} has no options`)
      fireEvent.click(screen.getByRole('button', { name: first.label.en }))
    } else {
      const field = screen.getByLabelText(
        new RegExp(`^${q.label.en.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)}`),
      )
      const value =
        q.type === 'select' ? (q.options?.[0]?.value ?? '') : q.type === 'date' ? '2026-09-01' : 'x'
      fireEvent.change(field, { target: { value } })
    }
    filled += 1
  }
  return filled
}

describe('GenerateScreen', () => {
  it('renders the context step for T01 with jurisdiction/language toggles and the org strip', async () => {
    renderWizard('tpl_t01')

    /* Data loads async from fixtures — first assertion must await. */
    expect(
      await screen.findByText('Generate · Offer of employment letter (Ontario)'),
    ).toBeInTheDocument()
    expect(screen.getByText('Who and where is this document for?')).toBeInTheDocument()

    /* Org compliance strip (default profile: 42 employees, non-union, ON).
       T01 carries a 25+ headcount clause gate → 'Required for you'. */
    expect(screen.getByText('Small employer · 42')).toBeInTheDocument()
    expect(screen.getByText('Non-union')).toBeInTheDocument()
    expect(screen.getByText('Required for you')).toBeInTheDocument()

    /* Candidate-subject template: employee link is optional, case picker shown. */
    expect(screen.getByRole('combobox', { name: 'Employee record (optional)' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Case file (optional)' })).toBeInTheDocument()

    /* T01 is Ontario-only, so the jurisdiction segment is a single, fixed ON
       button (still + doc language). */
    for (const code of ['ON', 'EN', 'FR']) {
      expect(screen.getByRole('button', { name: code })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'ON' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('advances to guided questions and autosaves a typed answer (unsaved → saving → saved)', async () => {
    renderWizard('tpl_t01')
    await screen.findByText('Generate · Offer of employment letter (Ontario)')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByRole('heading', { name: 'Employee' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Role' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Compensation' })).toBeInTheDocument()

    /* Typing flips the autosave indicator through its simulated cycle. */
    expect(screen.getByRole('status')).toHaveTextContent('All changes saved')
    fireEvent.change(screen.getByLabelText(/^Employee full name/), {
      target: { value: 'Gabriel Dubois' },
    })
    expect(screen.getByRole('status')).toHaveTextContent('Unsaved changes')
    expect(await screen.findByText('Saving…', {}, { timeout: 2500 })).toBeInTheDocument()
    expect(await screen.findByText('All changes saved', {}, { timeout: 2500 })).toBeInTheDocument()
  })

  it('will not advance past the questions until every required one is answered', async () => {
    /* `required` was decoration only: the wizard advanced and created
       regardless, so a document could be saved with its required merge fields
       blank and render as unfilled placeholders in the customer's copy. */
    renderWizard('tpl_t01')
    await screen.findByText('Generate · Offer of employment letter (Ontario)')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    const next = () => screen.getByRole('button', { name: 'Next' })
    expect(next()).toBeDisabled()
    expect(screen.getByText('Still needed before this can be created:')).toBeInTheDocument()

    fillRequired('tpl_t01')
    expect(next()).toBeEnabled()
  })

  it('shows fill progress and risk/review posture on the review step', async () => {
    renderWizard('tpl_t01')
    await screen.findByText('Generate · Offer of employment letter (Ontario)')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    const filled = fillRequired('tpl_t01')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    const t01 = templateByTid.get('T01')
    if (!t01) throw new Error('fixture template T01 missing')
    const { total } = fillProgress(t01, {})
    expect(screen.getByText(`${filled}/${total}`)).toBeInTheDocument()
    expect(screen.getByText('fields filled')).toBeInTheDocument()

    expect(screen.getByText('Low risk')).toBeInTheDocument()
    expect(screen.getByText('HR review required')).toBeInTheDocument()
    expect(
      screen.getByText('HR review is required before this document is used.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save to repository' })).toBeInTheDocument()
  })

  it('renders the context step for T02 (Ontario-only, employee-subject)', async () => {
    renderWizard('tpl_t02')

    expect(await screen.findByText('Generate · Employment agreement (Ontario)')).toBeInTheDocument()

    /* Employee-subject template: employee link is required. */
    const next = screen.getByRole('button', { name: 'Next' })
    expect(next).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Employee' })).toBeInTheDocument()

    /* T02 is Ontario-only, so the jurisdiction segment is a single, fixed ON
       button (still + doc language). */
    for (const code of ['ON', 'EN', 'FR']) {
      expect(screen.getByRole('button', { name: code })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'ON' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.change(screen.getByRole('combobox', { name: 'Employee' }), {
      target: { value: 'emp_go' },
    })
    expect(next).toBeEnabled()
  })

  it('advances to T02 guided questions, gated by the required employee link', async () => {
    renderWizard('tpl_t02')
    await screen.findByText('Generate · Employment agreement (Ontario)')

    fireEvent.change(screen.getByRole('combobox', { name: 'Employee' }), {
      target: { value: 'emp_go' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByRole('heading', { name: 'Employee' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Compensation' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Termination' })).toBeInTheDocument()

    /* employee_name is prefilled once from the chosen employee. */
    expect(screen.getByLabelText(/^Employee full name/)).toHaveValue('Grace Osei')
  })

  it('will not advance past T02 questions until every required one is answered', async () => {
    renderWizard('tpl_t02')
    await screen.findByText('Generate · Employment agreement (Ontario)')
    fireEvent.change(screen.getByRole('combobox', { name: 'Employee' }), {
      target: { value: 'emp_go' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    const next = () => screen.getByRole('button', { name: 'Next' })
    expect(next()).toBeDisabled()

    fillRequired('tpl_t02')
    expect(next()).toBeEnabled()
  })

  it('shows fill progress and risk/review posture on the T02 review step', async () => {
    renderWizard('tpl_t02')
    await screen.findByText('Generate · Employment agreement (Ontario)')
    fireEvent.change(screen.getByRole('combobox', { name: 'Employee' }), {
      target: { value: 'emp_go' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fillRequired('tpl_t02')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    const t02 = templateByTid.get('T02')
    if (!t02) throw new Error('fixture template T02 missing')
    /* fillRequired answers every required question, but the fill-progress
       metric counts merge tokens actually embedded in the document text —
       narrower than "required," since a few required T02 questions (the
       enhanced-termination toggle, the signer name/title) drive branching or
       the signature block rather than appearing as a literal {{token}}. */
    const tokens = templateTokens(t02)
    const filledTokenCount = t02.questions.filter((q) => q.required && tokens.includes(q.id)).length
    const { total } = fillProgress(t02, {})
    expect(screen.getByText(`${filledTokenCount}/${total}`)).toBeInTheDocument()
    expect(screen.getByText('fields filled')).toBeInTheDocument()

    expect(screen.getByText('Medium risk')).toBeInTheDocument()
    expect(screen.getByText('HR review required')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save to repository' })).toBeInTheDocument()
  })

  it('renders the context step for T04 (Ontario-only, org-wide subject)', async () => {
    renderWizard('tpl_t04')

    expect(await screen.findByText('Generate · Employee handbook (Ontario)')).toBeInTheDocument()

    /* Org-wide document: no employee/case pickers, just the org-scope note.
       Next is not gated on an employee link, so it's enabled immediately. */
    expect(
      screen.getByText(
        'Organization-wide document — it applies to the whole workplace, not one employee.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Employee' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()

    /* T04 is Ontario-only, so the jurisdiction segment is a single, fixed ON
       button (still + doc language). */
    for (const code of ['ON', 'EN', 'FR']) {
      expect(screen.getByRole('button', { name: code })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'ON' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('will not advance past T04 questions until every required one is answered, then shows fill progress', async () => {
    renderWizard('tpl_t04')
    await screen.findByText('Generate · Employee handbook (Ontario)')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    const next = () => screen.getByRole('button', { name: 'Next' })
    expect(next()).toBeDisabled()

    const filled = fillRequired('tpl_t04')
    expect(next()).toBeEnabled()
    fireEvent.click(next())

    const t04 = templateByTid.get('T04')
    if (!t04) throw new Error('fixture template T04 missing')
    const { total } = fillProgress(t04, {})
    expect(screen.getByText(`${filled}/${total}`)).toBeInTheDocument()
    expect(screen.getByText('fields filled')).toBeInTheDocument()
    expect(screen.getByText('Low risk')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save to repository' })).toBeInTheDocument()
  })

  it('requires an employee before Next on an employee-subject template (T03) and prefills the name', async () => {
    renderWizard('tpl_t03')
    await screen.findByText('Generate · Termination letter (without cause)')

    const next = screen.getByRole('button', { name: 'Next' })
    expect(next).toBeDisabled()

    fireEvent.change(screen.getByRole('combobox', { name: 'Employee' }), {
      target: { value: 'emp_jm' },
    })
    expect(next).toBeEnabled()

    fireEvent.click(next)
    /* employee_name is prefilled once from the chosen employee. */
    expect(screen.getByPlaceholderText('Full legal name')).toHaveValue('Jordan Mensah')
    expect(screen.getByText('Auto-filled from context')).toBeInTheDocument()
  })

  /**
   * The statutory-notice floor, wired end to end (statutoryFloor.ts). The
   * letter tells the employee the figure "meets or exceeds" the ESA minimum,
   * so a number below it ships a letter asserting compliance while
   * under-providing. Unit tests cover the arithmetic; these cover the wiring.
   */
  describe('statutory notice floor (T03, Ontario)', () => {
    /* Jurisdiction is chosen on the context step, so it has to be set before
       advancing to the questions. */
    const openQuestions = async (jurisdiction?: 'QC' | 'FED') => {
      renderWizard('tpl_t03')
      await screen.findByText('Generate · Termination letter (without cause)')
      fireEvent.change(screen.getByRole('combobox', { name: 'Employee' }), {
        target: { value: 'emp_jm' },
      })
      if (jurisdiction) fireEvent.click(screen.getByRole('button', { name: jurisdiction }))
      fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    }

    const setField = (label: string, value: string) =>
      fireEvent.change(screen.getByLabelText(new RegExp(label)), { target: { value } })

    it('warns when the entered notice is below the statutory minimum', async () => {
      await openQuestions()
      setField('Years of continuous service', '6')
      setField('Notice / pay in lieu', '2')

      /* 6 completed years → 6 weeks under ESA s.57. */
      expect(screen.getByRole('alert')).toHaveTextContent(/Below the statutory minimum of 6 weeks/)
    })

    it('confirms a figure that meets the minimum, without alarm', async () => {
      await openQuestions()
      setField('Years of continuous service', '6')
      setField('Notice / pay in lieu', '6')

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.getByText(/At or above the statutory minimum of 6 weeks/)).toBeInTheDocument()
    })

    it('always says the floor is only a floor', async () => {
      /* The figure must never read as a recommended amount — common-law
         reasonable notice is frequently far higher. */
      await openQuestions()
      setField('Years of continuous service', '6')
      setField('Notice / pay in lieu', '6')

      expect(
        screen.getByText(/common-law reasonable notice is often considerably higher/),
      ).toBeInTheDocument()
    })

    it('shows the floor as guidance before a figure is entered', async () => {
      await openQuestions()
      setField('Years of continuous service', '3')

      expect(screen.getByText(/Statutory minimum for this tenure: 3 weeks/)).toBeInTheDocument()
    })

    it('hedges for a jurisdiction with no reviewed schedule', async () => {
      /* QC and FED bands are deliberately null pending legal review. */
      await openQuestions('QC')
      setField('Years of continuous service', '6')
      setField('Notice / pay in lieu', '1')

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.getByText(/No verified minimum is available/)).toBeInTheDocument()
    })
  })
})
