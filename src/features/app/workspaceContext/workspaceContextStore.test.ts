import { describe, expect, it } from 'vitest'
import { employees } from '@/data'
import { contextFromEmployee } from './workspaceContextStore'

const emp = (() => {
  const found = employees.find((e) => e.id === 'e1')
  if (!found) throw new Error('fixture employee e1 missing')
  return found
})()

describe('contextFromEmployee', () => {

  it('builds subject, initials, and employee entity type', () => {
    const ctx = contextFromEmployee(emp)
    expect(ctx.subject).toBe(emp.name)
    expect(ctx.initials).toBe(emp.initials)
    expect(ctx.entityType).toBe('employee')
    expect(ctx.empId).toBe(emp.id)
  })

  it('chains meta as province · role · status when no topic is passed', () => {
    const ctx = contextFromEmployee(emp)
    expect(ctx.meta).toHaveLength(3)
    expect(ctx.meta[0]).toEqual(emp.province)
    expect(ctx.meta[1]).toEqual(emp.role)
    expect(ctx.meta[2]).toEqual(emp.status)
  })

  it('uses the topic as the third meta chip when provided', () => {
    const topic = { en: 'Probation review', fr: 'Révision probatoire' }
    const ctx = contextFromEmployee(emp, topic)
    expect(ctx.meta[2]).toEqual(topic)
  })

  it('accepts non-employee entity types for module reviews', () => {
    const ctx = contextFromEmployee(emp, undefined, 'compensation')
    expect(ctx.entityType).toBe('compensation')
  })
})
