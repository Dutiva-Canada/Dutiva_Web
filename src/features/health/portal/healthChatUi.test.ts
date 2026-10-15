import { describe, expect, it } from 'vitest'
import { DISTRESS_RE } from './healthChatUi'

/* The distress screen pins the crisis line under a bubble — the regex is
   the only thing between a typed cry for help and silence, so its edge
   cases get their own test file. Mobile keyboards autocorrect straight
   quotes to the curly U+2019 form; that was the ship-averting bug. */
describe('DISTRESS_RE', () => {
  it.each([
    "I don't want to live",
    /* U+2019 — the autocorrected form phone keyboards actually produce. */
    'I don’t want to live',
    'I dont want to live',
    "i don't want to be here anymore",
    "don't want to go on",
    'thinking about suicide',
    'i feel suicidal',
    'i want to die',
    'she wants to die',
    'i want to kill myself',
    'i want to hurt myself',
    'thinking of self harm',
    'self-harm',
    'self harming',
    'no reason to live',
    "doesn't want to go on",
    'everyone is better off without me',
    "je veux en finir",
    "j'ai envie de mourir",
    'plus envie de vivre',
    "envie de disparaître",
    'pensées suicidaires',
  ])('flags %j', (text) => {
    expect(DISTRESS_RE.test(text)).toBe(true)
  })

  it.each([
    'i had a rough day',
    'i want to live a long life',
    'killing time before dinner',
    'this deadline is going to kill the project',
    'i love live music',
    'je veux finir mes devoirs',
    "dis-moi quand tu reviendras",
  ])('lets %j through', (text) => {
    expect(DISTRESS_RE.test(text)).toBe(false)
  })
})
