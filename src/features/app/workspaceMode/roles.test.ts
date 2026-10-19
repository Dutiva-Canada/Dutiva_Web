import { describe, expect, it } from 'vitest'
import {
  isAdminRole,
  isModuleScopedRole,
  isOrgMemberRole,
  memberModuleScope,
  roleAtLeast,
} from './roles'

describe('roleAtLeast', () => {
  it('orders viewer < member < manager < admin < owner', () => {
    expect(roleAtLeast('viewer', 'member')).toBe(false)
    expect(roleAtLeast('member', 'member')).toBe(true)
    expect(roleAtLeast('manager', 'admin')).toBe(false)
    expect(roleAtLeast('admin', 'member')).toBe(true)
    expect(roleAtLeast('owner', 'admin')).toBe(true)
  })

  it('treats a missing role as below everything', () => {
    expect(roleAtLeast(null, 'viewer')).toBe(false)
  })
})

describe('isAdminRole', () => {
  it('matches the RLS is_org_admin writer set exactly', () => {
    expect(isAdminRole('owner')).toBe(true)
    expect(isAdminRole('admin')).toBe(true)
    expect(isAdminRole('manager')).toBe(false)
    expect(isAdminRole('member')).toBe(false)
    expect(isAdminRole('viewer')).toBe(false)
    expect(isAdminRole(null)).toBe(false)
  })
})

describe('isOrgMemberRole', () => {
  it('accepts the vocabulary and rejects everything else', () => {
    expect(isOrgMemberRole('owner')).toBe(true)
    expect(isOrgMemberRole('viewer')).toBe(true)
    expect(isOrgMemberRole('superuser')).toBe(false)
    expect(isOrgMemberRole(null)).toBe(false)
  })
})

describe('isModuleScopedRole', () => {
  it('scopes exactly the roles org_member_has_module restricts (0244)', () => {
    expect(isModuleScopedRole('consultant')).toBe(true)
    expect(isModuleScopedRole('viewer')).toBe(true)
    expect(isModuleScopedRole('member')).toBe(false)
    expect(isModuleScopedRole('professional')).toBe(false)
    expect(isModuleScopedRole('admin')).toBe(false)
    expect(isModuleScopedRole('owner')).toBe(false)
    expect(isModuleScopedRole(null)).toBe(false)
  })
})

describe('memberModuleScope', () => {
  it('returns the grant list only for scoped roles with a non-empty list', () => {
    expect(memberModuleScope('consultant', ['cases', 'documents'])).toEqual([
      'cases',
      'documents',
    ])
    expect(memberModuleScope('viewer', ['finance'])).toEqual(['finance'])
  })

  it('treats an empty list on a scoped role as unscoped', () => {
    expect(memberModuleScope('consultant', [])).toBeNull()
    expect(memberModuleScope('consultant', null)).toBeNull()
  })

  it('ignores the list entirely on unscoped roles', () => {
    expect(memberModuleScope('member', ['cases'])).toBeNull()
    expect(memberModuleScope('admin', ['cases'])).toBeNull()
    expect(memberModuleScope(null, ['cases'])).toBeNull()
  })
})
