import { describe, expect, it } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { allTemplates } from '@/features/app/documents/catalogue'
import { FlowRunner } from './FlowRunner'

/**
 * The runner's own behaviour. The engine's rules are tested against a fixture
 * graph in `flowEngine.test.ts`; what matters here is that the component is
 * wired to them — that a click advances, that back returns, and that a
 * completed run surfaces the documents rather than stopping at advice.
 *
 * Driven through the shipped duty-to-accommodate flow rather than a fixture,
 * because the wiring worth guarding is the wiring users hit.
 */
const renderFlow = (slug = 'duty-to-accommodate') =>
  renderApp(<FlowRunner />, { route: `/app/workflows/${slug}`, path: '/app/workflows/:slug' })

describe('FlowRunner', () => {
  it('opens on the flow’s first step', () => {
    renderFlow()
    expect(screen.getByRole('heading', { level: 1, name: 'Duty to accommodate' })).toBeVisible()
    expect(
      screen.getByRole('heading', { level: 2, name: 'What has happened so far?' }),
    ).toBeVisible()
  })

  it('advances when an option is chosen', async () => {
    const user = userEvent.setup()
    renderFlow()
    await user.click(screen.getByRole('button', { name: /Someone has asked for a change/ }))
    expect(
      screen.getByRole('heading', { level: 2, name: 'Gather what you are entitled to' }),
    ).toBeVisible()
  })

  it('returns to a clean choice when stepping back', async () => {
    const user = userEvent.setup()
    renderFlow()
    await user.click(screen.getByRole('button', { name: /Someone has asked for a change/ }))
    await user.click(screen.getByRole('button', { name: 'Back' }))
    /* Both branches offered again — a retained answer would read as decided. */
    expect(screen.getByRole('button', { name: /Someone has asked for a change/ })).toBeVisible()
    expect(screen.getByRole('button', { name: /Nobody has asked/ })).toBeVisible()
  })

  it('hides Back on the first step and restores it after advancing', async () => {
    const user = userEvent.setup()
    renderFlow()
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Someone has asked for a change/ }))
    expect(screen.getByRole('button', { name: 'Back' })).toBeVisible()
  })

  it('ends at an outcome that names the documents to produce', async () => {
    const user = userEvent.setup()
    renderFlow()
    await user.click(screen.getByRole('button', { name: /Someone has asked for a change/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' })) // gather
    await user.click(screen.getByRole('button', { name: 'Continue' })) // explore
    await user.click(screen.getByRole('button', { name: /we have something that works/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' })) // implement

    expect(screen.getByRole('heading', { level: 2, name: 'Accommodation in place' })).toBeVisible()
    /* The handoff is the point — a flow that ends in advice leaves nothing on
       the file. */
    expect(screen.getByRole('link', { name: /Accommodation request response/ })).toHaveAttribute(
      'href',
      '/app/documents/templates/T22',
    )
    expect(screen.getByRole('link', { name: /Accommodation plan/ })).toHaveAttribute(
      'href',
      '/app/documents/templates/T23',
    )
  })

  it('says why an ending produces no document, instead of showing nothing', async () => {
    /* The one ending allowed to name no template. Leading it with a document
       prompt would ask for exactly the health record the outcome just said
       not to create — so the absence is the instruction, and it has to be
       visible rather than a blank space where the handoff would be. */
    const user = userEvent.setup()
    renderFlow('mental-health-response')
    await user.click(screen.getByRole('button', { name: /noticed a change/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' })) // observe
    await user.click(screen.getByRole('button', { name: /everything is fine/ }))

    expect(screen.getByRole('heading', { level: 2, name: 'Take the answer' })).toBeVisible()
    expect(screen.getByText('No document to open')).toBeVisible()
    expect(screen.getByText(/Nothing goes on file/)).toBeVisible()
    expect(screen.queryAllByRole('link', { name: /Open$/ })).toHaveLength(0)
  })

  it('shows the path taken once complete', async () => {
    const user = userEvent.setup()
    renderFlow()
    await user.click(screen.getByRole('button', { name: /follows a workplace injury/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' })) // injury_path
    await user.click(screen.getByRole('button', { name: 'Continue' })) // gather
    await user.click(screen.getByRole('button', { name: 'Continue' })) // explore
    await user.click(screen.getByRole('button', { name: /nothing we found works/ }))
    await user.click(screen.getByRole('button', { name: /cost or a safety risk/ }))

    expect(screen.getByRole('heading', { level: 2, name: /Undue hardship/ })).toBeVisible()
    /* The record is what gets copied onto the file, so it has to carry both
       the questions and the answers — a list of step titles alone would not
       show why the refusal was reached. */
    const path = screen.getByText('The path you took').parentElement?.textContent ?? ''
    expect(path).toContain('What has happened so far?')
    expect(path).toContain('It follows a workplace injury')
    expect(path).toContain('Test it before you call it hardship')
  })

  it('restarts to the first step', async () => {
    const user = userEvent.setup()
    renderFlow()
    await user.click(screen.getByRole('button', { name: /Someone has asked for a change/ }))
    await user.click(screen.getByRole('button', { name: 'Start over' }))
    expect(
      screen.getByRole('heading', { level: 2, name: 'What has happened so far?' }),
    ).toBeVisible()
  })

  it('tells the user when the slug is not a flow', () => {
    renderFlow('not-a-flow')
    expect(screen.getByText('That process does not exist.')).toBeVisible()
  })

  it('ends at the ESA floor for a mid tenure band', async () => {
    const user = userEvent.setup()
    renderFlow('statutory-notice-ontario')
    expect(
      screen.getByRole('heading', { level: 1, name: /Ontario statutory notice/ }),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: /1 year to under 3 years/ }))
    expect(screen.getByRole('heading', { level: 2, name: 'ESA floor: 2 weeks' })).toBeVisible()
    expect(screen.getByRole('link', { name: /Termination letter/i })).toHaveAttribute(
      'href',
      '/app/documents/templates/T03',
    )
  })

  it('gates ESA severance without stating an amount', async () => {
    const user = userEvent.setup()
    renderFlow('severance-eligibility-ontario')
    await user.click(screen.getByRole('button', { name: /Yes — five or more/ }))
    await user.click(screen.getByRole('button', { name: /global payroll is at least/ }))
    await user.click(screen.getByRole('button', { name: /No exclusion appears/ }))
    expect(
      screen.getByRole('heading', { level: 2, name: /may apply — amount not calculated/ }),
    ).toBeVisible()
  })
})

describe('FlowRunner — a scored assessment', () => {
  const renderCheck = () =>
    renderApp(<FlowRunner />, {
      route: '/app/workflows/psychological-safety-check',
      path: '/app/workflows/:slug',
    })

  /**
   * Answer the intro and all thirteen rated questions with the same option.
   *
   * `fireEvent` rather than `userEvent`: this is fourteen clicks through the
   * full provider tree per run, and userEvent's input simulation made the file
   * take two minutes. Nothing here depends on realistic pointer events.
   */
  /** The headline score line, which the per-factor rows would otherwise
      make ambiguous — they report percentages of their own. */
  const scoreRow = () => screen.getByText('Your score').parentElement?.textContent ?? ''

  const answerAll = (label: RegExp) => {
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    for (let i = 0; i < 13; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: label }))
    }
  }

  it('scores a perfect run at 100% and lands the top band', () => {
    renderCheck()
    answerAll(/In place and written down/)

    /* Scoped to the score row: every factor also reports a percentage, so a
       bare getByText('100%') matches fourteen things. */
    expect(scoreRow()).toContain('100%')
    expect(scoreRow()).toContain('39')
    expect(screen.getByText('Largely established')).toBeVisible()
  })

  it('scores the bottom of the scale as 0%, reports every factor, and hands off', () => {
    renderCheck()
    answerAll(/Not in place/)

    /* Zero is a real score, not an absence of one. */
    expect(scoreRow()).toContain('0%')
    expect(scoreRow()).toContain('39')
    /* The lowest scorer is the reader who most needs a result. */
    expect(screen.getByText(/Early — start with the obligations/)).toBeVisible()

    /* The breakdown is the actionable part — a single percentage says how you
       did and nothing about what to change. */
    expect(screen.getByText('By factor')).toBeVisible()
    expect(screen.getByText('Psychological support')).toBeVisible()
    expect(screen.getByText('Protection of physical safety')).toBeVisible()

    /* And the weakest band points at the legally required pieces first. The
       name is read from the catalogue rather than written here: T13 was
       renamed when it was widened into Pillar C's respectful workplace policy,
       and a literal turned that into an unrelated test failure. */
    const t13 = allTemplates.find((t) => t.tid === 'T13')
    expect(t13).toBeDefined()
    expect(screen.getByRole('link', { name: new RegExp(t13!.name.en) })).toHaveAttribute(
      'href',
      '/app/documents/templates/T13',
    )
  })

  it('orders the factor breakdown weakest first', () => {
    renderCheck()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    /* A mixed run: the first factor scores nothing, the rest score full. Both
       other scenarios answer uniformly, so every factor ties and the sort is
       invisible — this is the only test that would notice it being removed or
       reversed, which is the point of having it. */
    fireEvent.click(screen.getByRole('button', { name: /Not in place/ }))
    for (let i = 0; i < 12; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /In place and written down/ }))
    }

    const rows = within(screen.getByRole('list', { name: 'By factor' })).getAllByRole('listitem')
    const labels = rows.map((row) => row.textContent ?? '')
    expect(labels[0]).toContain('Psychological support')
    expect(labels[0]).toContain('0%')
    /* And everything after it scored higher. */
    for (const label of labels.slice(1)) {
      expect(label).toContain('100%')
    }
  })

  it('says plainly that it is not an audit against the Standard', () => {
    renderCheck()
    /* CSA Z1003-13 is copyrighted and this reproduces none of it. Claiming to
       measure conformance would be the compliance defect, not the copyright
       one, and both are avoided by saying what this is. */
    expect(screen.getByText(/not an audit against CSA Z1003-13/)).toBeVisible()
  })
})
