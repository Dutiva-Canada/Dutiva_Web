import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { decodeInvisibleTag, encodeInvisibleTag } from '../fingerprint'
import { buildWordDoc, type WordDocInput } from './wordDoc'

const EXPORT_ID = 'de305d54-75b4-431b-adb2-eb6b9e546014'

function input(overrides: Partial<WordDocInput> = {}): WordDocInput {
  return {
    title: 'Termination Letter — Jordan Mensah',
    paragraphs: ['Dear Jordan,', 'First line\nsecond line of the same paragraph.'],
    footerLines: ['Exported from Dutiva — Export ID ' + EXPORT_ID + '.', 'Confidential.'],
    invisibleTag: encodeInvisibleTag(EXPORT_ID),
    exportId: EXPORT_ID,
    author: 'Amara Osei (amara@northgate.ca)',
    workspaceLabel: 'Northgate Logistics Inc.',
    lang: 'en',
    ...overrides,
  }
}

async function readPart(bytes: Uint8Array, path: string): Promise<string> {
  const zip = await JSZip.loadAsync(bytes)
  const file = zip.file(path)
  if (!file) throw new Error(`Missing ${path} in docx package`)
  return file.async('string')
}

describe('buildWordDoc', () => {
  it('builds a real OOXML package with fingerprint channels', async () => {
    const bytes = await buildWordDoc(input())
    expect(bytes.byteLength).toBeGreaterThan(1000)
    /* PK zip signature */
    expect(bytes[0]).toBe(0x50)
    expect(bytes[1]).toBe(0x4b)

    const documentXml = await readPart(bytes, 'word/document.xml')
    const coreXml = await readPart(bytes, 'docProps/core.xml')
    const customXml = await readPart(bytes, 'docProps/custom.xml')

    expect(decodeInvisibleTag(documentXml)).toBe(EXPORT_ID)
    expect(documentXml).toContain('Exported from Dutiva')
    expect(coreXml).toContain(`dutiva-export-id:${EXPORT_ID}`)
    expect(coreXml).toContain('Amara Osei')
    expect(customXml).toContain('dutiva-export-id')
    expect(customXml).toContain(EXPORT_ID)
  })

  it('escapes user content and preserves in-paragraph line breaks', async () => {
    const bytes = await buildWordDoc(
      input({
        title: 'Offer <script>alert(1)</script> & Co',
        paragraphs: ['Salary > $70,000 & "benefits"'],
      }),
    )
    const documentXml = await readPart(bytes, 'word/document.xml')
    expect(documentXml).not.toContain('<script>')
    expect(documentXml).toContain('&lt;script&gt;')
    expect(documentXml).toContain('&amp;')
    expect(documentXml).toContain('&gt;')
    /* Soft line break between First line / second line in the default fixture */
    const defaultXml = await readPart(await buildWordDoc(input()), 'word/document.xml')
    expect(defaultXml).toContain('First line')
    expect(defaultXml).toContain('second line of the same paragraph.')
    expect(defaultXml).toMatch(/w:br/)
  })

  it('records locale on the custom property and description', async () => {
    const en = await buildWordDoc(input())
    const fr = await buildWordDoc(input({ lang: 'fr' }))
    expect(await readPart(en, 'docProps/custom.xml')).toContain('en-CA')
    expect(await readPart(fr, 'docProps/custom.xml')).toContain('fr-CA')
    expect(await readPart(fr, 'docProps/core.xml')).toContain('fr-CA')
  })
})
