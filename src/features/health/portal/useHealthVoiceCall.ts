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
  /* 'ready' is the server engine's resting state — the mic is closed and a
     tap opens it. The speech engine never rests here: its mic is always
     hot between turns, so its resting state is 'listening'. */
  | 'ready'
  | 'listening'
  | 'recording'
  | 'transcribing'
  | 'thinking'
  | 'speaking'
  | 'muted'
  | 'blocked'
/* Why it blocked — 'perm' means the mic permission itself was refused
   (retryable once the user re-allows it); 'service' means the browser's
   recognition service or the transcription route is gone or unreachable
   (retry rarely helps, but the copy must not blame a permission that was
   never the problem). */
export type VoiceCallBlockKind = 'perm' | 'service'
/* Which transcription engine the call is riding — 'speech' is the
   browser's Web Speech API (interim text, auto endpointing, free);
   'server' is MediaRecorder → the health-transcribe function (the path
   for browsers where Web Speech is missing or unbacked). */
export type VoiceCallEngine = 'speech' | 'server'

export interface VoiceTranscriber {
  /** Answers whether the server path is actually live — deployed function
      plus a configured transcription route — so the call button never
      advertises a dead end. */
  available: () => Promise<boolean>
  /** One recorded utterance → its transcript. */
  send: (blob: Blob, lang: Lang) => Promise<string>
}

/**
 * A voice call with Mira, layered over the existing text conversation —
 * every utterance lands in the transcript as a normal turn, so the
 * distress regex, consent boundary, undo and history behave exactly as
 * typed chat.
 *
 * Two engines, picked at call start:
 * - 'speech'  — Web Speech API: hands-free walkie-talkie (continuous=false
 *               ends each utterance itself), interim results show live.
 * - 'server'  — MediaRecorder + edge transcription: tap-to-talk turns for
 *               Firefox/Brave-shaped browsers where recognition can't run.
 *               No interim text exists, so 'ready'/'recording'/'transcribing'
 *               statuses carry the loop instead.
 * speechSynthesis speaks replies on both engines; where it's missing the
 * reply just stays visual.
 *
 * `capable` is false unless a working engine exists (jsdom has neither) —
 * callers hide the affordance entirely.
 */
export function useHealthVoiceCall({
  lang,
  sendMessage,
  transcribe,
  onError,
}: {
  lang: Lang
  sendMessage: (text: string) => Promise<string | null>
  transcribe?: VoiceTranscriber
  onError?: () => void
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
  const [engine, setEngine] = useState<VoiceCallEngine | null>(null)
  /* Server-path probe — null while the check is still in flight. */
  const [serverOk, setServerOk] = useState<boolean | null>(null)

  const activeRef = useRef(false)
  const micOffRef = useRef(false)
  const voiceOffRef = useRef(false)
  const blockedRef = useRef(false)
  const statusRef = useRef<VoiceCallStatus>('idle')
  const engineRef = useRef<VoiceCallEngine | null>(null)
  const recRef = useRef<RecognitionLike | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  /* The confidence meter — an AnalyserNode on the held mic stream while
     the server engine records, answering "is it hearing me?" with a live
     level instead of a bare status word. Speech engine can't feed it
     (no MediaStream ever crosses our hands), and its interim transcript
     already answers the question — so the bar only exists server-side. */
  const [level, setLevel] = useState(0)
  const meterCtxRef = useRef<AudioContext | null>(null)
  const meterRafRef = useRef(0)
  /* sendMessage/onError close over fresh page state every render — the
     refs keep the recognition/recorder callbacks on the latest. */
  const sendRef = useRef(sendMessage)
  const errorRef = useRef(onError)
  const transcribeRef = useRef(transcribe)
  useEffect(() => {
    sendRef.current = sendMessage
    errorRef.current = onError
    transcribeRef.current = transcribe
  })

  const mark = (s: VoiceCallStatus) => {
    statusRef.current = s
    setStatus(s)
  }

  /* Capability — the button only renders where an engine can actually run.
     jsdom and Firefox lack SpeechRecognition; Brave is the subtler case:
     it exposes the constructor but ships no speech service (Google's
     endpoints are stripped for privacy), so start() fails every time —
     navigator.brave is Brave's own published signal. The server engine
     covers those browsers via MediaRecorder, gated on the same kind of
     probe the journal photos use: function deployed + route configured,
     else the button still hides rather than dead-ending. */
  const speechOk =
    typeof window !== 'undefined' &&
    recognitionCtor() !== undefined &&
    !(navigator as { brave?: unknown }).brave
  const recorderOk =
    typeof navigator !== 'undefined' &&
    'mediaDevices' in navigator &&
    typeof window !== 'undefined' &&
    'MediaRecorder' in window

  useEffect(() => {
    let live = true
    if (!speechOk && recorderOk && typeof transcribe?.available === 'function') {
      void transcribe
        .available()
        .then((ok) => {
          if (live) setServerOk(ok)
        })
        .catch(() => {})
    } else {
      setServerOk(false)
    }
    return () => {
      live = false
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- one-shot probe; transcribe is stable api surface
  }, [])
  const capable = speechOk || (recorderOk && serverOk === true)

  /* The resting state after a turn — speech reopens the mic itself,
     server waits for the next tap. */
  const nextTurn = () => {
    if (!activeRef.current) return
    if (engineRef.current === 'server') mark('ready')
    else listen()
  }

  /* ---- speech engine -------------------------------------------------- */

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

  /* ---- server engine -------------------------------------------------- */

  const stopMeter = () => {
    cancelAnimationFrame(meterRafRef.current)
    meterRafRef.current = 0
    void meterCtxRef.current?.close().catch(() => {})
    meterCtxRef.current = null
    setLevel(0)
  }

  /* Reads RMS off the mic stream ~15x/s — enough for the bar to feel
     alive without re-rendering every frame. Source is never wired to the
     destination, so monitoring stays silent. */
  const startMeter = (stream: MediaStream) => {
    try {
      const ctx = new AudioContext()
      const src = ctx.createMediaStreamSource(stream)
      const an = ctx.createAnalyser()
      an.fftSize = 256
      src.connect(an)
      meterCtxRef.current = ctx
      const buf = new Uint8Array(an.fftSize)
      let lastSet = 0
      const tick = () => {
        if (meterCtxRef.current !== ctx) return
        an.getByteTimeDomainData(buf)
        let sum = 0
        for (const v of buf) {
          const d = (v - 128) / 128
          sum += d * d
        }
        const now = performance.now()
        if (now - lastSet > 66) {
          lastSet = now
          setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4))
        }
        meterRafRef.current = requestAnimationFrame(tick)
      }
      meterRafRef.current = requestAnimationFrame(tick)
    } catch {
      /* no WebAudio — the recorder works fine without a meter */
    }
  }

  /* The mic stream is acquired once per call and held — re-prompting
     getUserMedia every turn would make each utterance a permission dance.
     A fresh MediaRecorder wraps each utterance so chunks don't mix. */
  const beginRecording = async () => {
    if (!activeRef.current || mediaRecRef.current) return
    try {
      const stream = (streamRef.current ??= await navigator.mediaDevices.getUserMedia({
        audio: true,
      }))
      chunksRef.current = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.onstop = () => {
        mediaRecRef.current = null
        stopMeter()
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        chunksRef.current = []
        if (!activeRef.current) return
        if (blob.size === 0) {
          mark('ready')
          return
        }
        void transcribeThen(blob)
      }
      mediaRecRef.current = rec
      rec.start()
      startMeter(stream)
      mark('recording')
    } catch (e) {
      /* getUserMedia denials read as permission-blocked; missing hardware
         or a dead recorder path reads as service-side. */
      blockedRef.current = true
      setBlockKind((e as DOMException | null)?.name === 'NotAllowedError' ? 'perm' : 'service')
      mark('blocked')
    }
  }

  const transcribeThen = async (blob: Blob) => {
    mark('transcribing')
    try {
      const send = transcribeRef.current?.send
      if (!send) throw new Error('no transcriber')
      const text = (await send(blob, lang)).trim()
      setLiveText('')
      if (!activeRef.current) return
      if (!text) {
        /* Silence or an unintelligible clip — park on ready rather than
           sending Mira an empty turn. */
        mark('ready')
        return
      }
      await takeTurn(text)
    } catch {
      errorRef.current?.()
      if (activeRef.current) mark('ready')
    }
  }

  /* ---- shared ---------------------------------------------------------- */

  const pickVoice = () => {
    if (!('speechSynthesis' in window)) return null
    const want = lang === 'fr' ? 'fr' : 'en'
    return (
      window.speechSynthesis
        .getVoices()
        .find((v) => v.lang.toLowerCase().startsWith(want)) ?? null
    )
  }

  const speak = (text: string) => {
    if (!activeRef.current) return
    if (!('speechSynthesis' in window)) {
      /* No voice engine on this browser — the reply stays visual and the
         loop moves on rather than stranding the caller. */
      nextTurn()
      return
    }
    try {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang === 'fr' ? 'fr-CA' : 'en-CA'
      const voice = pickVoice()
      if (voice) u.voice = voice
      const resume = () => {
        if (activeRef.current && !blockedRef.current) nextTurn()
      }
      u.onend = resume
      u.onerror = resume
      mark('speaking')
      window.speechSynthesis.speak(u)
    } catch {
      nextTurn()
    }
  }

  const takeTurn = async (text: string) => {
    setLastText(text)
    mark('thinking')
    const reply = await sendRef.current(text)
    if (!activeRef.current) return
    if (reply && !voiceOffRef.current) speak(reply)
    else if (micOffRef.current) mark('muted')
    else nextTurn()
  }

  const start = () => {
    if (!capable || activeRef.current) return
    engineRef.current = speechOk ? 'speech' : 'server'
    setEngine(engineRef.current)
    activeRef.current = true
    blockedRef.current = false
    micOffRef.current = false
    voiceOffRef.current = false
    setMicOff(false)
    setVoiceOff(false)
    setActive(true)
    setLiveText('')
    setLastText('')
    if (engineRef.current === 'server') mark('ready')
    else listen()
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
      mediaRecRef.current?.stop()
    } catch {
      /* teardown */
    }
    mediaRecRef.current = null
    stopMeter()
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {
      /* teardown */
    }
    streamRef.current = null
    chunksRef.current = []
    try {
      window.speechSynthesis?.cancel()
    } catch {
      /* teardown — nothing to report */
    }
    setActive(false)
    setEngine(null)
    engineRef.current = null
    setLiveText('')
    setLastText('')
    setMicOff(false)
    setVoiceOff(false)
    micOffRef.current = false
    voiceOffRef.current = false
    mark('idle')
  }

  /* The mic button is the loop's verb — what it does depends on where the
     call sits: barge-in while Mira speaks, retry when blocked, end the
     recording mid-utterance, or start one when the server engine is idle.
     During 'thinking'/'transcribing' the request is on the wire — the
     overlay disables it there. */
  const toggleMic = () => {
    if (!activeRef.current) return
    if (statusRef.current === 'blocked') {
      /* A refused permission can be re-allowed — the tap retries the
         engine's own way in. A genuine dead end lands back on blocked. */
      blockedRef.current = false
      if (engineRef.current === 'server') void beginRecording()
      else listen()
      return
    }
    if (engineRef.current === 'server') {
      if (statusRef.current === 'speaking') {
        try {
          window.speechSynthesis.cancel()
        } catch {
          /* still return to ready */
        }
        mark('ready')
        return
      }
      if (statusRef.current === 'recording') {
        /* onstop hands the clip to the transcriber. */
        try {
          mediaRecRef.current?.stop()
          mark('transcribing')
        } catch {
          mark('ready')
        }
        return
      }
      if (statusRef.current === 'ready') void beginRecording()
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
     cancels it and moves to the next turn. */
  const toggleVoice = () => {
    if (!activeRef.current) return
    const next = !voiceOffRef.current
    voiceOffRef.current = next
    setVoiceOff(next)
    if (next && statusRef.current === 'speaking') {
      try {
        window.speechSynthesis.cancel()
      } catch {
        /* fall through to the next turn */
      }
      nextTurn()
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
        mediaRecRef.current?.stop()
      } catch {
        /* nothing */
      }
      stopMeter()
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop())
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
    engine,
    liveText,
    lastText,
    level,
    micOff,
    voiceOff,
    start,
    end,
    toggleMic,
    toggleVoice,
  }
}
