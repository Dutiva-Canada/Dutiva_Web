import { describe, expect, it } from 'vitest'
import { pick } from '@/i18n/core'
import { getNavGroups, viewLabelFor } from './navConfig'
import { shellMessages as M } from '@/i18n/messages/shell'

describe('viewLabelFor', () => {
  it('titles an employee profile route with the fixture person name', () => {
    expect(pick(viewLabelFor('/workspace/employees/e1'), 'en')).toBe('Jordan Mensah')
  })

  it('distinguishes Documents sub-routes', () => {
    expect(viewLabelFor('/workspace/documents/hr-library')).toEqual(M.shell_hr_studio_templates)
    expect(viewLabelFor('/workspace/documents/studio')).toEqual(M.shell_hr_studio_studio)
    expect(viewLabelFor('/workspace/documents')).toEqual(M.shell_hr_studio_library)
    expect(viewLabelFor('/workspace/documents/generate/T01')).toEqual(M.shell_hr_studio_studio)
    expect(M.shell_hr_studio_studio.en).toBe('Templates')
    expect(M.shell_hr_studio_library.en).toBe('My documents')
  })

  it('returns planning sub-route labels', () => {
    expect(viewLabelFor('/workspace/planning/tasks')).toEqual(M.shell_nav_tasks)
    expect(viewLabelFor('/workspace/planning/calendar')).toEqual(M.shell_nav_calendar)
  })

  it('titles Memory routes as Advisor memory', async () => {
    const { memoryMessages: MEM } = await import('@/i18n/messages/memory')
    expect(viewLabelFor('/workspace/settings/memory')).toEqual(MEM.memory_title)
    expect(viewLabelFor('/workspace/settings')).toEqual(M.shell_v_settings)
  })
})

describe('getNavGroups', () => {
  it('shows all modules when enabled_modules is empty', () => {
    const groups = getNavGroups('/workspace', 'admin', {})
    const keys = groups.flatMap((g) => g.items.map((i) => i.key))
    expect(keys).toContain('finance')
    expect(keys).toContain('employees')
    expect(keys).toContain('revenue')
  })

  it('hides disabled modules while keeping always-on modules', () => {
    const groups = getNavGroups('/workspace', 'admin', { finance: false, revenue: false })
    const keys = groups.flatMap((g) => g.items.map((i) => i.key))
    expect(keys).not.toContain('finance')
    expect(keys).not.toContain('revenue')
    expect(keys).toContain('home')
    expect(keys).toContain('advisor')
    expect(keys).toContain('employees')
  })

  it('removes empty section headings after filtering', () => {
    const groups = getNavGroups('/workspace', 'admin', {
      revenue: false,
      crm: false,
      comms: false,
    })
    const headings = groups.map((g) => (g.heading ? pick(g.heading, 'en') : null))
    expect(headings).not.toContain('Revenue')
  })

  it('scopes a consultant to their granted modules, keeping home', () => {
    const groups = getNavGroups('/workspace', 'consultant', {}, ['cases', 'documents'])
    const keys = groups.flatMap((g) => g.items.map((i) => i.key))
    expect(keys).toContain('home')
    expect(keys).toContain('cases')
    expect(keys).toContain('documents')
    expect(keys).not.toContain('finance')
    expect(keys).not.toContain('employees')
    expect(keys).not.toContain('advisor')
  })

  it('member scope does not widen role gating', () => {
    /* consultant is in the CONSULTANT nav group, so finance would otherwise
       show — scope is a separate axis that intersects, never widens. */
    const groups = getNavGroups('/workspace', 'consultant', {}, ['cases'])
    const keys = groups.flatMap((g) => g.items.map((i) => i.key))
    expect(keys).not.toContain('finance')

    const viewerGroups = getNavGroups('/workspace', 'viewer', {}, ['finance'])
    const viewerKeys = viewerGroups.flatMap((g) => g.items.map((i) => i.key))
    /* finance is in scope but viewer is not in CONSULTANT — hidden anyway. */
    expect(viewerKeys).not.toContain('finance')
    expect(viewerKeys).toContain('home')
  })

  it('null scope leaves every role-gated item untouched', () => {
    const scoped = getNavGroups('/workspace', 'consultant', {}, null)
    const keys = scoped.flatMap((g) => g.items.map((i) => i.key))
    expect(keys).toContain('finance')
    expect(keys).toContain('revenue')
  })
})
