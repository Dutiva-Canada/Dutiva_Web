/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

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

afterEach(() => {
  cleanup()
  localStorage.clear()
})
