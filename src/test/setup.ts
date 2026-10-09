/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { configure } from '@testing-library/dom'
import { webcrypto } from 'node:crypto'
import { afterEach } from 'vitest'

/* findBy and waitFor default to a 1s asyncUtilTimeout — under vmThreads the
   parallel-suite import+render path (dynamic `await import()` inside portal
   tests) routinely exceeds it on a loaded machine, producing flakes that
   always pass in isolation. 5s keeps the intent (fail on genuinely absent
   content) while absorbing transform contention. */
configure({ asyncUtilTimeout: 5000 })

// Node ≥25 defines a global `localStorage` that is broken unless Node is
// started with --localstorage-file, and it shadows jsdom's implementation
// (in the vitest jsdom env, `window` IS `globalThis`). Replace it with a
// spec-shaped in-memory Storage so app code and tests behave normally.
class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>()
  get length(): number {
    return this.map.size
  }
  clear(): void {
    this.map.clear()
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null
  }
  removeItem(key: string): void {
    this.map.delete(key)
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value))
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  writable: true,
  configurable: true,
})

/* jsdom never implemented scrollTo; components that scroll on mount fill the
   output with "Not implemented" noise. A no-op stub is enough — tests assert
   on rendered content, not scroll position. */
Object.defineProperty(window, 'scrollTo', {
  value: () => {},
  writable: true,
  configurable: true,
})

/* Under the vmThreads pool the VM context's crypto comes from jsdom, which
   never implemented WebCrypto — crypto.subtle is undefined and every signing
   or hashing test fails. Node ships a real implementation; put it back. */
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  })
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})
