/** Canonical Memory entity routes (still under /app/settings/memory). */

export type MemoryEntityScope = 'person' | 'case' | 'thread'

export function memoryPathForEntity(scope: MemoryEntityScope, entityId: string): string {
  switch (scope) {
    case 'person':
      return `/app/settings/memory/people/${entityId}`
    case 'case':
      return `/app/settings/memory/cases/${entityId}`
    case 'thread':
      return `/app/settings/memory/conversations/${entityId}`
  }
}

export function memoryPathForFact(input: {
  scope?: string
  entityId?: string
  factId?: string
}): string {
  const { scope, entityId } = input
  if (
    (scope === 'person' || scope === 'case' || scope === 'thread') &&
    typeof entityId === 'string' &&
    entityId.length > 0
  ) {
    return memoryPathForEntity(scope, entityId)
  }
  return '/app/settings/memory'
}
