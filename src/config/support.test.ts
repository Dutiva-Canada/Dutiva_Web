import { describe, expect, it } from 'vitest'
import { staffedHoursLine, SUPPORT_HOURS } from './support'

const en = staffedHoursLine((e) => e)
const fr = staffedHoursLine((_e, f) => f)

describe('staffedHoursLine', () => {
  it('states the day window — never bare hours that imply weekend coverage', () => {
    expect(en).toContain('Mon–Fri')
    expect(fr).toContain('lun.–ven.')
  })

  it('states the holiday closure, not the bare jurisdiction', () => {
    expect(en).toContain('closed on Ontario statutory holidays')
    expect(fr).toContain('fermé les jours fériés légaux de l’Ontario')
  })

  it('derives the hour span from SUPPORT_HOURS', () => {
    expect(en).toContain(`${SUPPORT_HOURS.startHour} a.m.–${SUPPORT_HOURS.endHour - 12} p.m.`)
    expect(fr).toContain(`${SUPPORT_HOURS.startHour} h à ${SUPPORT_HOURS.endHour} h`)
  })
})
