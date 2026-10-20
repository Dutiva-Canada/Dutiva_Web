import { describe, expect, it } from 'vitest'
import { safeHttpUrl } from './prUi'

/* Stored urls are free text — and mention urls arrive via feed ingest, not
   just the form — so the render gate is the last line before the href. */
describe('safeHttpUrl', () => {
  it('passes http and https values through', () => {
    expect(safeHttpUrl('https://cbc.ca/news/1')).toBe('https://cbc.ca/news/1')
    expect(safeHttpUrl('http://example.com')).toBe('http://example.com')
  })

  it('rejects script and data schemes', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull()
    expect(safeHttpUrl('  javascript:alert(1)  ')).toBeNull()
    expect(safeHttpUrl('JavaScript:alert(1)')).toBeNull()
    expect(safeHttpUrl('data:text/html,<h1>x</h1>')).toBeNull()
    expect(safeHttpUrl('vbscript:x')).toBeNull()
    expect(safeHttpUrl('file:///etc/passwd')).toBeNull()
  })

  it('rejects scheme-less and empty values', () => {
    expect(safeHttpUrl('')).toBeNull()
    expect(safeHttpUrl('   ')).toBeNull()
    expect(safeHttpUrl('example.com/page')).toBeNull()
    expect(safeHttpUrl('//example.com/page')).toBeNull()
  })
})
