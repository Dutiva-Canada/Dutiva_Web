import { describe, expect, it } from 'vitest'
import { pick } from '@/i18n/core'
import { viewLabelFor } from './navConfig'
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
})
