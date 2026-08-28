import { describe, expect, it, vi } from 'vitest'
import { modKeyLabel, searchShortcutLabel } from './keyboardShortcut'

describe('keyboardShortcut', () => {
  it('uses ⌘ on Apple platforms and Ctrl elsewhere', () => {
    vi.stubGlobal('navigator', { platform: 'MacIntel' })
    expect(modKeyLabel()).toBe('⌘')
    expect(searchShortcutLabel()).toBe('⌘K')

    vi.stubGlobal('navigator', { platform: 'Win32' })
    expect(modKeyLabel()).toBe('Ctrl')
    expect(searchShortcutLabel()).toBe('CtrlK')

    vi.unstubAllGlobals()
  })
})
