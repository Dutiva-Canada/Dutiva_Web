import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { GuideView } from './GuideView'
import { groupGuideBlocks } from './guideModel'
import type { GuideBlock } from './guideModel'
import { referenceGuides } from './data'
import { templateByTid } from '@/features/app/documents/data'
import { customTemplateByTid } from '@/features/app/documents/customTemplates'
import { flowBySlug } from '@/features/app/flows/data'

const renderGuide = (slug: string) =>
  renderApp(<GuideView />, {
    route: `/workspace/knowledge/${slug}`,
    path: '/workspace/knowledge/:slug',
  })

const bi = (en: string) => ({ en, fr: `${en} (fr)` })

describe('groupGuideBlocks', () => {
  it('collapses consecutive list items into one list', () => {
    const blocks: GuideBlock[] = [
      { type: 'p', text: bi('intro') },
      { type: 'li', text: bi('one') },
      { type: 'li', text: bi('two') },
      { type: 'p', text: bi('outro') },
      { type: 'li', text: bi('three') },
    ]
    expect(groupGuideBlocks(blocks).map((g) => g.kind)).toEqual(['p', 'list', 'p', 'list'])
    const first = groupGuideBlocks(blocks)[1]
    expect(first?.kind === 'list' && first.items).toHaveLength(2)
  })

  it('keeps a contrast pair as its own group', () => {
    const groups = groupGuideBlocks([
      { type: 'li', text: bi('one') },
      { type: 'contrast', instead: bi('do'), notThis: bi('do not') },
      { type: 'li', text: bi('two') },
    ])
    /* The contrast must break the run — otherwise the two list items either
       side would render as one list with the pair floating out of order. */
    expect(groups.map((g) => g.kind)).toEqual(['list', 'contrast', 'list'])
  })
})

describe('GuideView', () => {
  it('renders the guide, its sections and its jurisdiction notes', () => {
    renderGuide('functional-limitations')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Functional limitations, not diagnosis' }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { level: 2, name: 'The distinction' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 2, name: 'By jurisdiction' })).toBeVisible()
    expect(screen.getByText('Ontario')).toBeVisible()
    expect(screen.getByText('Québec')).toBeVisible()
    expect(screen.getByText('Federal')).toBeVisible()
  })

  it('renders a contrast pair as advice and its counter-example', () => {
    renderGuide('functional-limitations')
    /* The do/don't shape is the guide's main teaching device; losing the
       "not this" half would leave the counter-examples reading as advice. */
    expect(screen.getAllByText('Say this').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Not this').length).toBeGreaterThan(0)
    expect(screen.getByText('Has a herniated disc.')).toBeVisible()
  })

  it('links out to the templates and the flow it supports', () => {
    renderGuide('functional-limitations')
    expect(screen.getByRole('link', { name: /Duty to accommodate/ })).toHaveAttribute(
      'href',
      '/workspace/workflows/duty-to-accommodate',
    )
    expect(screen.getByRole('link', { name: /Accommodation request form/ })).toHaveAttribute(
      'href',
      '/workspace/documents/templates/T21',
    )
  })

  it('tells the user when the slug is not a guide', () => {
    renderGuide('not-a-guide')
    expect(screen.getByText('That guide does not exist.')).toBeVisible()
  })
})

describe.each(referenceGuides.map((g) => [g.slug, g] as const))('guide: %s', (_slug, guide) => {
  it('points every related template and flow at something that exists', () => {
    /* A dead link from a guide sends a reader mid-task to a blank page. */
    for (const tid of guide.relatedTemplates ?? []) {
      expect(templateByTid.get(tid) ?? customTemplateByTid.get(tid), tid).toBeDefined()
    }
    for (const slug of guide.relatedFlows ?? []) {
      expect(flowBySlug.get(slug), slug).toBeDefined()
    }
  })

  it('carries a note for every jurisdiction it claims', () => {
    /* Same rule the templates are held to: coverage claimed with nothing
       behind it is the implied coverage CANONICAL_FACTS §3 bars. */
    expect(Object.keys(guide.jurisdictionNotes).sort()).toEqual([...guide.jurisdictions].sort())
  })

  it('ships every string in both languages', () => {
    const strings: [string, { en: string; fr: string }][] = [
      ['title', guide.title],
      ['summary', guide.summary],
      ['tag', guide.tag],
    ]
    for (const [code, note] of Object.entries(guide.jurisdictionNotes)) {
      if (note) strings.push([`jurisdictionNotes.${code}`, note])
    }
    for (const [i, section] of guide.sections.entries()) {
      strings.push([`sections[${i}].heading`, section.heading])
      for (const [j, block] of section.blocks.entries()) {
        const at = `sections[${i}].blocks[${j}]`
        if (block.type === 'contrast') {
          strings.push([`${at}.instead`, block.instead], [`${at}.notThis`, block.notThis])
        } else {
          strings.push([at, block.text])
        }
      }
    }
    for (const [path, value] of strings) {
      expect(value.en.trim(), path).not.toBe('')
      expect(value.fr.trim(), path).not.toBe('')
      if (value.en.split(/\s+/).length > 3) {
        expect(value.fr, `${path} is untranslated`).not.toBe(value.en)
      }
      /* Guide copy renders as text, not markdown — `**emphasis**` reaches the
         reader as asterisks. Caught in review after two guides had shipped
         with it, so it is a test rather than a convention. */
      expect(value.en, `${path} carries markdown that will render literally`).not.toMatch(/\*\*/)
      expect(value.fr, `${path} carries markdown that will render literally`).not.toMatch(/\*\*/)
    }
  })
})
