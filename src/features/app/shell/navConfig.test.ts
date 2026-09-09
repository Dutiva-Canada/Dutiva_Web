import { describe, expect, it } from 'vitest'
import { pick } from '@/i18n/core'
import { getNavGroups, viewLabelFor } from './navConfig'
import { shellMessages as M } from '@/i18n/messages/shell'

describe('viewLabelFor', () => {
  it('titles an employee profile route with the fixture person name', () => {
    expect(pick(viewLabelFor('/app/employees/e1'), 'en')).toBe('Jordan Mensah')
  })

  it('distinguishes Documents sub-routes', () => {
    expect(viewLabelFor('/app/documents/hr-library')).toEqual(M.shell_hr_studio_templates)
    expect(viewLabelFor('/app/documents/studio')).toEqual(M.shell_hr_studio_studio)
    expect(viewLabelFor('/app/documents')).toEqual(M.shell_hr_studio_library)
    expect(viewLabelFor('/app/documents/generate/T01')).toEqual(M.shell_hr_studio_studio)
    expect(M.shell_hr_studio_studio.en).toBe('Templates')
    expect(M.shell_hr_studio_library.en).toBe('My documents')
  })

  it('returns planning sub-route labels', () => {
    expect(viewLabelFor('/app/planning/tasks')).toEqual(M.shell_nav_tasks)
    expect(viewLabelFor('/app/planning/calendar')).toEqual(M.shell_nav_calendar)
  })

  it('titles Memory routes as Advisor memory', async () => {
    const { memoryMessages: MEM } = await import('@/i18n/messages/memory')
    expect(viewLabelFor('/app/settings/memory')).toEqual(MEM.memory_title)
    expect(viewLabelFor('/app/settings')).toEqual(M.shell_v_settings)
  })
})

describe('getNavGroups', () => {
  it('shows all modules when enabled_modules is empty', () => {
    const groups = getNavGroups('/app', 'admin', {})
    const keys = groups.flatMap((g) => g.items.map((i) => i.key))
    expect(keys).toContain('finance')
    expect(keys).toContain('employees')
    expect(keys).toContain('revenue')
  })

  it('hides disabled modules while keeping always-on modules', () => {
    const groups = getNavGroups('/app', 'admin', { finance: false, revenue: false })
    const keys = groups.flatMap((g) => g.items.map((i) => i.key))
    expect(keys).not.toContain('finance')
    expect(keys).not.toContain('revenue')
    expect(keys).toContain('home')
    expect(keys).toContain('advisor')
    expect(keys).toContain('employees')
  })

  it('removes empty section headings after filtering', () => {
    const groups = getNavGroups('/app', 'admin', {
      revenue: false,
      crm: false,
      comms: false,
    })
    const headings = groups.map((g) => (g.heading ? pick(g.heading, 'en') : null))
    expect(headings).not.toContain('Revenue')
  })
})
