import { describe, expect, it } from 'vitest'
import * as data from './index'
import { cases, caseNotes } from './cases'
import { chats, followupReplies, lightFlows } from './chats'
import { communicationDetails, communications } from './communications'
import { complianceItems } from './compliance'
import { documentTemplates, documentTemplatesByKey } from './documents'
import { compChanges, employeeDetails, employees, orgStructure, supportSignals } from './employees'
import { tasks } from './tasks'
import { certifications } from './workforce'
import { templateByTid } from '@/features/app/documents/data'
import { customTemplateByTid } from '@/features/app/documents/customTemplates'

const employeeIds = new Set(employees.map((e) => e.id))
const caseIds = new Set(cases.map((c) => c.id))
const chatIds = new Set(chats.map((c) => c.id))
const legacyDocKeys = new Set(documentTemplates.map((d) => d.key))
/* A doc reference is either a legacy title-string key (documentTemplates)
   or a doclib tid (T01-T16 generated, T17+ hand-authored in
   customTemplates.ts) — the same dual resolution DocStudioProvider and
   resolveDocTitle use at runtime. */
const docKeys = new Set([...legacyDocKeys, ...templateByTid.keys(), ...customTemplateByTid.keys()])
const followupKeys = new Set(Object.keys(followupReplies))

describe('fixture ids', () => {
  it('keeps prototype ids unique per collection', () => {
    expect(employeeIds.size).toBe(employees.length)
    expect(caseIds.size).toBe(cases.length)
    expect(chatIds.size).toBe(chats.length)
    expect(legacyDocKeys.size).toBe(documentTemplates.length)

    const messageIds = chats.flatMap((c) => c.messages.map((m) => m.id))
    expect(new Set(messageIds).size).toBe(messageIds.length)
  })
})

describe('cross-references resolve', () => {
  it('tasks link to existing chats', () => {
    for (const task of tasks) {
      expect(chatIds.has(task.chatId), `task ${task.id} → chat ${task.chatId}`).toBe(true)
    }
  })

  it('cases link to existing employees and chats', () => {
    for (const c of cases) {
      expect(employeeIds.has(c.empId), `case ${c.id} → employee ${c.empId}`).toBe(true)
      expect(chatIds.has(c.chatId), `case ${c.id} → chat ${c.chatId}`).toBe(true)
    }
  })

  it('compliance items link to existing chats', () => {
    for (const item of complianceItems) {
      expect(chatIds.has(item.chatId), `${item.id} → chat ${item.chatId}`).toBe(true)
    }
  })

  it('employee risk flags link to existing chats (when linked)', () => {
    for (const emp of employees) {
      if (emp.risk?.chatId != null) {
        expect(chatIds.has(emp.risk.chatId), `${emp.id} risk → chat ${emp.risk.chatId}`).toBe(true)
      }
    }
  })

  it('every employee has a detail record whose references resolve', () => {
    for (const emp of employees) {
      const det = employeeDetails[emp.id]
      expect(det, `detail for ${emp.id}`).toBeDefined()
      if (!det) continue
      expect(det.employeeId).toBe(emp.id)
      for (const key of det.docs) {
        expect(docKeys.has(key), `${emp.id} doc "${key}"`).toBe(true)
      }
      for (const caseId of det.cases) {
        expect(caseIds.has(caseId), `${emp.id} case ${caseId}`).toBe(true)
      }
      for (const ev of det.timeline) {
        if (ev.docKey != null) {
          expect(docKeys.has(ev.docKey), `${emp.id} timeline doc "${ev.docKey}"`).toBe(true)
        }
        if (ev.caseId != null) {
          expect(caseIds.has(ev.caseId), `${emp.id} timeline case ${ev.caseId}`).toBe(true)
        }
      }
    }
  })

  it('chat messages reference existing documents and followup replies', () => {
    for (const chat of chats) {
      for (const msg of chat.messages) {
        for (const key of msg.docs ?? []) {
          expect(docKeys.has(key), `${chat.id}/${msg.id} doc "${key}"`).toBe(true)
        }
        for (const label of msg.followups ?? []) {
          expect(followupKeys.has(label), `${chat.id}/${msg.id} followup "${label}"`).toBe(true)
        }
      }
    }
  })

  it('light flows reference existing documents and followup replies', () => {
    for (const [flowKey, flow] of Object.entries(lightFlows)) {
      for (const key of flow.docs ?? []) {
        expect(docKeys.has(key), `${flowKey} doc "${key}"`).toBe(true)
      }
      for (const label of flow.followups ?? []) {
        expect(followupKeys.has(label), `${flowKey} followup "${label}"`).toBe(true)
      }
    }
  })

  it('followup replies are keyed by their EN label and reference existing documents', () => {
    for (const [key, reply] of Object.entries(followupReplies)) {
      expect(reply.label.en).toBe(key)
      for (const docKey of reply.docs ?? []) {
        expect(docKeys.has(docKey), `"${key}" doc "${docKey}"`).toBe(true)
      }
    }
  })

  it('documentTemplatesByKey is a complete lookup', () => {
    for (const template of documentTemplates) {
      expect(documentTemplatesByKey[template.key]).toBe(template)
    }
  })

  it('keeps document reference namespaces collision-free', () => {
    const generatedTids = new Set(templateByTid.keys())
    const customTids = new Set(customTemplateByTid.keys())

    for (const key of legacyDocKeys) {
      expect(generatedTids.has(key), `legacy/generated collision: ${key}`).toBe(false)
      expect(customTids.has(key), `legacy/custom collision: ${key}`).toBe(false)
    }

    for (const key of generatedTids) {
      expect(customTids.has(key), `generated/custom collision: ${key}`).toBe(false)
    }
  })

  it('case notes attach to existing cases', () => {
    for (const caseId of Object.keys(caseNotes)) {
      expect(caseIds.has(caseId), `note → case ${caseId}`).toBe(true)
    }
  })

  it('comp changes, support signals, and org graph reference existing employees', () => {
    for (const change of compChanges) {
      expect(employeeIds.has(change.employeeId), `${change.id} → ${change.employeeId}`).toBe(true)
    }
    for (const signal of supportSignals) {
      if (signal.employeeId != null) {
        expect(employeeIds.has(signal.employeeId), `${signal.id} → ${signal.employeeId}`).toBe(true)
      }
    }
    for (const branch of orgStructure) {
      expect(employeeIds.has(branch.managerId), `org manager ${branch.managerId}`).toBe(true)
      for (const reportId of branch.reportIds) {
        expect(employeeIds.has(reportId), `org report ${reportId}`).toBe(true)
      }
    }
  })

  it('communications ids are unique and each has a detail record', () => {
    expect(new Set(communications.map((c) => c.id)).size).toBe(communications.length)
    for (const comm of communications) {
      const det = communicationDetails[comm.id]
      expect(det, `detail for ${comm.id}`).toBeDefined()
      expect(det?.communicationId).toBe(comm.id)
    }
  })

  it('keeps Amara-linked fixtures on Ontario, not stale British Columbia metadata', () => {
    const amaraTask = tasks.find((t) => t.id === 'tk5')
    const amaraComm = communications.find((c) => c.id === 'cm6')
    const amaraCompliance = complianceItems.find((c) => c.id === 'ci2')

    expect(amaraTask?.jur.en).toBe('Ontario')
    expect(amaraComm?.province.en).toBe('Ontario')
    expect(amaraCompliance?.province.en).toBe('Ontario')
    expect(communicationDetails.cm6?.bilingual.en).toContain('Ontario')
    expect(communicationDetails.cm6?.bilingual.en).not.toMatch(/BC|British Columbia/)
  })

  it('uses Multi-jurisdiction labels for cross-regime policy fixtures', () => {
    const remotePolicyTask = tasks.find((t) => t.id === 'tk6')
    const remotePolicyFlag = complianceItems.find((c) => c.id === 'ci3')
    const companyWideComms = ['cm1', 'cm2', 'cm3', 'cm4'] as const

    expect(remotePolicyTask?.jur.en).toBe('Multi-jurisdiction')
    expect(remotePolicyFlag?.province.en).toBe('Multi-jurisdiction')
    for (const commId of companyWideComms) {
      const comm = communications.find((c) => c.id === commId)
      expect(comm?.province.en, `${commId} province`).toBe('Multi-jurisdiction')
    }
    expect(communications.find((c) => c.id === 'cm5')?.province.en).toBe('Ontario')
    expect(communications.find((c) => c.id === 'cm6')?.province.en).toBe('Ontario')
  })

  it('keeps normalized certification fixtures on their intended jurisdictions', () => {
    const fatouCert = certifications.find((c) => c.id === 'cert-fatou-firstaid')
    expect(fatouCert?.jurisdiction.en).toBe('Ontario')
  })

  it('describes Amara accommodation case summary without diagnosis-level language', () => {
    const amaraCase = cases.find((c) => c.id === 'case3')
    expect(amaraCase?.summary.en).toMatch(/functional limitations/i)
    expect(amaraCase?.summary.en).not.toMatch(/medical condition/i)
    expect(amaraCase?.summary.fr).toMatch(/limitations fonctionnelles/i)
    expect(amaraCase?.summary.fr).not.toMatch(/condition médicale/i)
  })
})

describe('bilingual completeness', () => {
  const isBi = (value: unknown): value is { en: string; fr: string } =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['en'] === 'string' &&
    typeof (value as Record<string, unknown>)['fr'] === 'string'

  it('every Bi field has non-empty en and fr', () => {
    const visited = new Set<object>()
    let biCount = 0

    const walk = (value: unknown, path: string): void => {
      if (typeof value !== 'object' || value === null) return
      if (visited.has(value)) return
      visited.add(value)

      if (isBi(value)) {
        biCount += 1
        expect(value.en.trim().length, `${path}.en is empty`).toBeGreaterThan(0)
        expect(value.fr.trim().length, `${path}.fr is empty`).toBeGreaterThan(0)
        return
      }

      if (Array.isArray(value)) {
        value.forEach((item, i) => walk(item, `${path}[${i}]`))
        return
      }

      for (const [key, child] of Object.entries(value)) {
        walk(child, `${path}.${key}`)
      }
    }

    walk(data, 'data')

    expect(employees.length).toBeGreaterThan(0)
    expect(biCount).toBeGreaterThan(0)
  })
})
