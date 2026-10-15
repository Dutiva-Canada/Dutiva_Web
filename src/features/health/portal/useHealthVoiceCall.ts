import { useEffect, useRef, useState } from 'react'
import type { Lang } from '@/i18n/core'

/* The Web Speech API ships no stable TS surface — the DOM lib omits
   SpeechRecognition entirely and Chrome exposes it as webkitSpeechRecognition.
   Minimal local typings cover exactly what the call loop uses. */
type RecognitionResultLike = {
  isFinal: boolean
  0: { transcript: string }
}
type RecognitionEventLike = { results: ArrayLike<RecognitionResultLike> }
type RecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: RecognitionEventLike) => void) | null
  onerror: ((e: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  abort: () => void
}
type RecognitionCtor = new () => RecognitionLike

const recognitionCtor = (): RecognitionCtor | undefined =>
  (
    window as unknown as {
      SpeechRecognition?: RecognitionCtor
      webkitSpeechRecognition?: RecognitionCtor
    }
  ).SpeechRecognition ??
  (
    window as unknown as { webkitSpeechRecognition?: RecognitionCtor }
  ).webkitSpeechRecognition

export type VoiceCallStatus =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'muted'
  | 'blocked'
/* Why it blocked — 'perm' means the mic permission itself was refused
   (retryable once the user re-allows it); 'service' means the browser's
   recognition service is gone or unreachable (retry rarely helps, but
   the copy must not blame a permission that was never the problem). */
export type VoiceCallBlockKind = 'perm' | 'service'

/**
 * A voice call with Mira, layered over the existing text conversation —
 * the browser transcribes the mic (Web Speech), the reply goes through the
 * same sendHealthChat pipeline, and speechSynthesis reads it back. Because
 * every utterance lands in the transcript as a normal turn, the distress
 * regex, consent boundary, undo and history all behave exactly as typed
 * chat. Capability-gated: `capable` is false where either API is missing
 * (Firefox's speech recognition, jsdom) and the caller hides the control.
 *
 * The loop is walkie-talkie, not duplex — one utterance, one reply, then
 * the mic reopens. continuous=false makes each utterance end itself, so
 * `onend` is the send trigger and no silence timer is needed.
 */
export function useHealthVoiceCall({
  lang,
  sendMessage,
}: {
  lang: Lang
  sendMessage: (text: string) => Promise<string | null>
}) {
  const [active, setActive] = useState(false)
  const [status, setStatus] = useState<VoiceCallStatus>('idle')
  const [liveText, setLiveText] = useState('')
  /* The last utterance actually sent — keeps the overlay showing your own
     words while Mira thinks and speaks. */
  const [lastText, setLastText] = useState('')
  const [micOff, setMicOff] = useState(false)
  const [voiceOff, setVoiceOff] = useState(false)
  const [blockKind, setBlockKind] = useState<VoiceCallBlockKind>('perm')

  const activeRef = useRef(false)
  const micOffRef = useRef(false)
  const voiceOffRef = useRef(false)
  const blockedRef = useRef(false)
  const statusRef = useRef<VoiceCallStatus>('idle')
  const recRef = useRef<RecognitionLike | null>(null)
  /* sendMessage closes over fresh page state every render — the ref keeps
     the recognition callbacks (created once per utterance) on the latest. */
  const sendRef = useRef(sendMessage)
  useEffect(() => {
    sendRef.current = sendMessage
  })

  const mark = (s: VoiceCallStatus) => {
    statusRef.current = s
    setStatus(s)
  }

  /* jsdom and Firefox lack the APIs — `capable` hides the affordance so the
     feature is never advertised where it can't run. Brave is the subtler
     case: it exposes the SpeechRecognition constructor but ships no speech
     service backend (Google's endpoints are stripped for privacy), so
     start() fails every time. navigator.brave is Brave's own published
     signal — a constructor that can never start isn't a capability. */
  const capable =
    typeof window !== 'undefined' &&
    recognitionCtor() !== undefined &&
    'speechSynthesis' in window &&
    !(navigator as { brave?: unknown }).brave

  const listen = () => {
    if (!activeRef.current || micOffRef.current || recRef.current) return
    const Ctor = recognitionCtor()
    if (!Ctor) return
    const rec = new Ctor()
    rec.lang = lang === 'fr' ? 'fr-CA' : 'en-CA'
    rec.interimResults = true
    rec.continuous = false
    let finalText = ''
    rec.onresult = (e) => {
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]
        if (!r) continue
        if (r.isFinal) finalText += r[0]?.transcript ?? ''
        else interim += r[0]?.transcript ?? ''
      }
      setLiveText((interim || finalText).trim())
    }
    rec.onerror = (e) => {
      /* not-allowed is the mic permission itself — the user can fix it and
         retry. Everything else (service-not-allowed, network, audio-capture)
         is the browser's recognition service, not something a permission
         toggle will repair. */
      if (e?.error === 'not-allowed') {
        blockedRef.current = true
        setBlockKind('perm')
        mark('blocked')
      } else if (e?.error && e.error !== 'no-speech' && e.error !== 'aborted') {
        blockedRef.current = true
        setBlockKind('service')
        mark('blocked')
      }
      /* no-speech and aborted fall through to onend — silence isn't a
         failure, and our own abort() fires 'aborted' on some builds. */
    }
    rec.onend = () => {
      if (recRef.current === rec) recRef.current = null
      const text = finalText.trim()
      setLiveText('')
      if (!activeRef.current || blockedRef.current) return
      if (micOffRef.current) {
        mark('muted')
        return
      }
      /* Silence — the browser ended the utterance with nothing final.
         Reopen the mic rather than dropping the call on a pause. */
      if (!text) {
        listen()
        return
      }
      void takeTurn(text)
    }
    recRef.current = rec
    try {
      /* Mark before start(): an implementation may fire onerror/onend
         synchronously inside start(), and a mark after the call would
         overwrite a blocked state that already landed. */
      mark('listening')
      rec.start()
    } catch {
      recRef.current = null
      blockedRef.current = true
      setBlockKind('service')
      mark('blocked')
    }
  }

  const pickVoice = () => {
    const want = lang === 'fr' ? 'fr' : 'en'
    return (
      window.speechSynthesis
        .getVoices()
        .find((v) => v.lang.toLowerCase().startsWith(want)) ?? null
    )
  }

  const speak = (text: string) => {
    if (!activeRef.current) return
    try {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang === 'fr' ? 'fr-CA' : 'en-CA'
      const voice = pickVoice()
      if (voice) u.voice = voice
      const resume = () => {
        if (activeRef.current && !blockedRef.current) listen()
      }
      u.onend = resume
      u.onerror = resume
      mark('speaking')
      window.speechSynthesis.speak(u)
    } catch {
      listen()
    }
  }

  const takeTurn = async (text: string) => {
    setLastText(text)
    mark('thinking')
    const reply = await sendRef.current(text)
    if (!activeRef.current) return
    if (reply && !voiceOffRef.current) speak(reply)
    else if (micOffRef.current) mark('muted')
    else listen()
  }

  const start = () => {
    if (!capable || activeRef.current) return
    activeRef.current = true
    blockedRef.current = false
    micOffRef.current = false
    voiceOffRef.current = false
    setMicOff(false)
    setVoiceOff(false)
    setActive(true)
    setLiveText('')
    setLastText('')
    listen()
  }

  const end = () => {
    activeRef.current = false
    try {
      recRef.current?.abort()
    } catch {
      /* teardown — nothing to report */
    }
    recRef.current = null
    try {
      window.speechSynthesis.cancel()
    } catch {
      /* teardown — nothing to report */
    }
    setActive(false)
    setLiveText('')
    setLastText('')
    setMicOff(false)
    setVoiceOff(false)
    micOffRef.current = false
    voiceOffRef.current = false
    mark('idle')
  }

  /* The mic button doubles as barge-in: while Mira is speaking it cuts the
     utterance and reopens listening instead of toggling a mute the caller
     didn't mean. During 'thinking' the send is on the wire — the button
     stays out of the way (the overlay disables it). */
  const toggleMic = () => {
    if (!activeRef.current) return
    /* In the blocked state the mic button is the retry — a refused
       permission can be re-allowed, and a transient service miss may
       recover. A genuine dead end just lands back on blocked. */
    if (statusRef.current === 'blocked') {
      blockedRef.current = false
      listen()
      return
    }
    if (statusRef.current === 'speaking') {
      try {
        window.speechSynthesis.cancel()
      } catch {
        /* still reopen the mic */
      }
      listen()
      return
    }
    if (micOffRef.current) {
      micOffRef.current = false
      setMicOff(false)
      if (!recRef.current && statusRef.current !== 'thinking') listen()
    } else {
      micOffRef.current = true
      setMicOff(true)
      try {
        recRef.current?.abort()
      } catch {
        /* the onend handler will see micOff and park on 'muted' */
      }
      mark('muted')
    }
  }

  /* Speaker toggle — Mira's voice off turns the call into speech-to-text:
     you talk, replies still render in the log. Cutting mid-utterance
     cancels it and reopens the mic. */
  const toggleVoice = () => {
    if (!activeRef.current) return
    const next = !voiceOffRef.current
    voiceOffRef.current = next
    setVoiceOff(next)
    if (next && statusRef.current === 'speaking') {
      try {
        window.speechSynthesis.cancel()
      } catch {
        /* fall through to listen */
      }
      listen()
    }
  }

  /* Unmount safety — leaving the page ends the call without ghost audio. */
  useEffect(
    () => () => {
      activeRef.current = false
      try {
        recRef.current?.abort()
      } catch {
        /* nothing */
      }
      try {
        window.speechSynthesis?.cancel()
      } catch {
        /* nothing */
      }
    },
    [],
  )

  return {
    capable,
    active,
    status,
    blockKind,
    liveText,
    lastText,
    micOff,
    voiceOff,
    start,
    end,
    toggleMic,
    toggleVoice,
  }
}
