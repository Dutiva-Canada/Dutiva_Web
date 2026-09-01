import { afterEach, describe, expect, it } from 'vitest'
import { buildBrief, loadNotes, NOTES_KEY, type Annotation } from './annotations'
import { buildSelector, describeElement, getSourceInfo } from './domInspect'

function note(partial: Partial<Annotation>): Annotation {
  return {
    id: partial.id ?? 'x',
    route: partial.route ?? '/',
    file: partial.file ?? null,
    line: partial.line ?? null,
    component: partial.component ?? null,
    element: partial.element ?? 'div',
    selector: partial.selector ?? 'div',
    note: partial.note ?? '',
    createdAt: partial.createdAt ?? 0,
  }
}

describe('buildBrief', () => {
  it('returns a placeholder when there are no notes', () => {
    expect(buildBrief([])).toBe('No annotations yet.')
  })

  it('groups by route, sorts routes, and anchors each note to file:line', () => {
    const brief = buildBrief([
      note({
        route: '/app/cases',
        file: 'src/features/app/views/cases/CasesView.tsx',
        line: 88,
        element: 'button "New case"',
        note: 'Make this bigger',
        createdAt: 2,
      }),
      note({
        route: '/pricing',
        file: 'src/pages/Pricing.tsx',
        line: 10,
        element: 'h1',
        note: 'Shorten headline',
        createdAt: 1,
      }),
    ])

    expect(brief).toContain('# Requested changes (2 annotations)')
    // '/app/cases' sorts before '/pricing'
    expect(brief.indexOf('## /app/cases')).toBeLessThan(brief.indexOf('## /pricing'))
    expect(brief).toContain('`src/features/app/views/cases/CasesView.tsx:88`')
    expect(brief).toContain('button "New case"` — Make this bigger')
  })

  it('orders notes within a route by creation time', () => {
    const brief = buildBrief([
      note({ route: '/', note: 'second', createdAt: 20, element: 'b' }),
      note({ route: '/', note: 'first', createdAt: 10, element: 'a' }),
    ])
    expect(brief.indexOf('first')).toBeLessThan(brief.indexOf('second'))
  })

  it('falls back to component then a marker when no file is known', () => {
    expect(buildBrief([note({ component: 'HomeView', note: 'x' })])).toContain('`HomeView`')
    expect(buildBrief([note({ note: 'x' })])).toContain('(unknown source)')
  })

  it('singularizes the header for one note', () => {
    expect(buildBrief([note({ note: 'x' })])).toContain('(1 annotation)')
  })
})

describe('loadNotes', () => {
  afterEach(() => {
    localStorage.removeItem(NOTES_KEY)
  })

  it('returns an empty array when nothing is stored', () => {
    expect(loadNotes()).toEqual([])
  })

  it('returns an empty array for invalid JSON or non-array payloads', () => {
    localStorage.setItem(NOTES_KEY, '{not json')
    expect(loadNotes()).toEqual([])

    localStorage.setItem(NOTES_KEY, JSON.stringify({ route: '/' }))
    expect(loadNotes()).toEqual([])
  })

  it('drops entries missing required fields and coerces optional ones', () => {
    localStorage.setItem(
      NOTES_KEY,
      JSON.stringify([
        { id: 'a', route: '/', element: 'button', selector: '#x', note: 'keep me' },
        { id: 'b', route: '/' },
        { route: '/', element: 'div', selector: 'div' },
        'garbage',
      ]),
    )

    expect(loadNotes()).toEqual([
      {
        id: 'a',
        route: '/',
        file: null,
        line: null,
        component: null,
        element: 'button',
        selector: '#x',
        note: 'keep me',
        createdAt: 0,
      },
    ])
  })

  it('preserves valid stored annotations', () => {
    const stored = note({
      id: 'n1',
      route: '/pricing',
      file: 'src/pages/Pricing.tsx',
      line: 12,
      component: 'Pricing',
      element: 'h1',
      selector: '#hero',
      note: 'Tighten copy',
      createdAt: 99,
    })
    localStorage.setItem(NOTES_KEY, JSON.stringify([stored]))

    expect(loadNotes()).toEqual([stored])
  })

  it('nulls non-positive or non-integer line numbers', () => {
    localStorage.setItem(
      NOTES_KEY,
      JSON.stringify([
        {
          id: 'a',
          route: '/',
          element: 'div',
          selector: 'div',
          file: 'src/App.tsx',
          line: -4,
        },
        {
          id: 'b',
          route: '/',
          element: 'div',
          selector: 'div',
          file: 'src/App.tsx',
          line: 12.5,
        },
        {
          id: 'c',
          route: '/',
          element: 'div',
          selector: 'div',
          file: 'src/App.tsx',
          line: 0,
        },
      ]),
    )

    expect(loadNotes().map((n) => n.line)).toEqual([null, null, null])
  })
})

describe('describeElement', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('prefers aria-label over text content and truncates', () => {
    const el = document.createElement('button')
    el.setAttribute('aria-label', 'Open case')
    el.textContent = 'ignored'
    expect(describeElement(el)).toBe('button "Open case"')
  })

  it('includes id and data-testid, and collapses whitespace in text', () => {
    const el = document.createElement('a')
    el.id = 'link'
    el.setAttribute('data-testid', 'nav')
    el.textContent = '  Go   home  '
    expect(describeElement(el)).toBe('a#link[nav] "Go home"')
  })
})

describe('getSourceInfo', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('reads the nearest data-loc and derives the component name', () => {
    document.body.innerHTML = `<section data-loc="src/features/app/views/home/HomeView.tsx:42"><span id="t">hi</span></section>`
    const info = getSourceInfo(document.getElementById('t')!)
    expect(info).toEqual({
      file: 'src/features/app/views/home/HomeView.tsx',
      line: 42,
      component: 'HomeView',
    })
  })

  it('returns nulls when nothing is stamped (production-like DOM)', () => {
    document.body.innerHTML = `<div><span id="t">hi</span></div>`
    expect(getSourceInfo(document.getElementById('t')!)).toEqual({
      file: null,
      line: null,
      component: null,
    })
  })
})

describe('buildSelector', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('prefers an id', () => {
    const el = document.createElement('div')
    el.id = 'main'
    expect(buildSelector(el)).toBe('#main')
  })

  it('prefers a data-testid when there is no id', () => {
    const el = document.createElement('button')
    el.setAttribute('data-testid', 'save')
    expect(buildSelector(el)).toBe('[data-testid="save"]')
  })

  it('falls back to an nth-of-type path that re-selects the element', () => {
    document.body.innerHTML = `<ul id="list"><li>a</li><li>b</li><li>c</li></ul>`
    const third = document.querySelectorAll('li')[2]!
    const selector = buildSelector(third)
    expect(document.querySelector(selector)).toBe(third)
  })
})
