import { describe, expect, it } from 'vitest'
import { parseResumeText } from './resumeParser'

describe('parseResumeText — headline extraction', () => {
  it('skips the pipe-separated contact line under the name', () => {
    const resume = [
      'Jane Morin',
      'Toronto, ON | 416-555-0100 | jane@example.com',
      'Senior Product Manager',
      '',
      'Experience',
      'Led product teams.',
    ].join('\n')
    const result = parseResumeText(resume)
    expect(result.name).toBe('Jane Morin')
    expect(result.headline).toBe('Senior Product Manager')
  })

  it('skips a standalone location line under the name', () => {
    const resume = ['Jane Morin', 'Toronto, ON', 'Senior Product Manager'].join('\n')
    const result = parseResumeText(resume)
    expect(result.headline).toBe('Senior Product Manager')
  })

  it('skips a "City, Canada" location line', () => {
    const resume = ['Jane Morin', 'Montréal, Canada', 'HR Manager'].join('\n')
    const result = parseResumeText(resume)
    expect(result.headline).toBe('HR Manager')
  })

  it('skips bare email and phone lines', () => {
    const resume = ['Jane Morin', 'jane@example.com', '416-555-0100', 'HR Manager'].join('\n')
    const result = parseResumeText(resume)
    expect(result.headline).toBe('HR Manager')
  })

  it('skips URL lines', () => {
    const resume = ['Jane Morin', 'https://linkedin.com/in/janemorin', 'Operations Manager'].join(
      '\n',
    )
    const result = parseResumeText(resume)
    expect(result.headline).toBe('Operations Manager')
  })

  it('still reads a headline directly under the name', () => {
    const resume = ['Jane Morin', 'Senior Recruiter', '', 'Summary', 'Ten years in TA.'].join('\n')
    const result = parseResumeText(resume)
    expect(result.headline).toBe('Senior Recruiter')
  })

  it('leaves headline empty when only contact info follows the name', () => {
    const resume = [
      'Jane Morin',
      'Toronto, ON | 416-555-0100 | jane@example.com',
      '',
      'Experience',
      'Did things.',
    ].join('\n')
    const result = parseResumeText(resume)
    expect(result.headline).toBeUndefined()
  })
})
