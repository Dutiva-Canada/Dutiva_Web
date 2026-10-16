import { useEffect } from 'react'
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from 'lucide-react'
import { healthMessages as HM } from '@/i18n/messages/health'
import { CrisisNote } from './CrisisNote'
import type {
  VoiceCallBlockKind,
  VoiceCallEngine,
  VoiceCallStatus,
} from './useHealthVoiceCall'

const STATUS_KEY: Record<
  Exclude<VoiceCallStatus, 'idle' | 'blocked'>,
  { en: string; fr: string }
> = {
  ready: HM.health_chat_call_ready,
  listening: HM.health_chat_call_listening,
  recording: HM.health_chat_call_recording,
  transcribing: HM.health_chat_call_transcribing,
  thinking: HM.health_chat_call_thinking,
  speaking: HM.health_chat_call_speaking,
  muted: HM.health_chat_call_muted,
}
/* Blocked splits by cause — a refused mic permission names the fix and
   invites retry; a dead recognition service must not blame a permission
   that was never asked. */
const BLOCK_KEY: Record<VoiceCallBlockKind, { en: string; fr: string }> = {
  perm: HM.health_chat_call_blocked,
  service: HM.health_chat_call_unavailable,
}

/**
 * The in-call overlay — a modal card over the chat page: Mira's status, the
 * live transcript, and the three call controls (mic, her voice, hang up).
 * The conversation underneath stays the same object — voice is an
 * input/output modality, so the log behind the overlay keeps every turn.
 * Escape hangs up; the standing crisis line stays reachable in the footer.
 * Two transcription engines can carry the call — browser Web Speech or
 * server-side transcription — and the provenance note names which is
 * carrying the audio.
 */
export function HealthVoiceCall({
  status,
  blockKind,
  engine,
  liveText,
  lastText,
  level,
  micOff,
  voiceOff,
  x,
  onMic,
  onVoice,
  onEnd,
}: {
  status: VoiceCallStatus
  blockKind: VoiceCallBlockKind
  engine: VoiceCallEngine | null
  liveText: string
  lastText: string
  /** Mic RMS 0..1 while the server engine records — the live "it hears
      you" the tap-to-talk loop otherwise lacks. Unused on the speech
      engine (its interim transcript already answers that). */
  level: number
  micOff: boolean
  voiceOff: boolean
  x: (m: { en: string; fr: string }) => string
  onMic: () => void
  onVoice: () => void
  onEnd: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEnd()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onEnd])

  const statusText =
    status === 'idle' ? '' : status === 'blocked' ? x(BLOCK_KEY[blockKind]) : x(STATUS_KEY[status])

  return (
    <div className="hbcall" role="dialog" aria-modal="true" aria-label={x(HM.health_chat_call)}>
      <div className="hbcall-card">
        <p className="hbcall-name">Mira</p>
        <p className="hbcall-status" role="status">
          {statusText}
        </p>
        {/* The level bar is visual confirmation only — aria-hidden; the
            status word already says "recording". */}
        {status === 'recording' && (
          <div className="hbcall-meter" aria-hidden="true">
            <span
              style={{ transform: `scaleX(${Math.min(1, Math.max(0.04, level))})` }}
            />
          </div>
        )}
        {/* Live transcript — interim words while you speak, then the
            utterance you sent while she thinks and answers. */}
        <p className="hbcall-live" aria-live="polite">
          {liveText || lastText || ' '}
        </p>
        <div className="hbcall-controls">
          <button
            type="button"
            className={status === 'recording' ? 'hbcall-btn is-rec' : 'hbcall-btn'}
            onClick={onMic}
            /* Thinking/transcribing keeps it inert (the request is on the
               wire); blocked keeps it live — it's the retry the copy
               promises. */
            disabled={status === 'thinking' || status === 'transcribing'}
            aria-pressed={!micOff}
            title={x(micOff ? HM.health_chat_call_mic_on : HM.health_chat_call_mic_off)}
          >
            {micOff ? <MicOff size={20} aria-hidden="true" /> : <Mic size={20} aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="hbcall-btn"
            onClick={onVoice}
            aria-pressed={!voiceOff}
            title={x(voiceOff ? HM.health_chat_call_voice_on : HM.health_chat_call_voice_off)}
          >
            {voiceOff ? (
              <VolumeX size={20} aria-hidden="true" />
            ) : (
              <Volume2 size={20} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="hbcall-btn hbcall-end"
            onClick={onEnd}
            aria-label={x(HM.health_chat_call_end)}
          >
            <PhoneOff size={20} aria-hidden="true" />
          </button>
        </div>
        {/* Honest provenance — who carries the audio differs by engine:
            the browser's speech services, or the configured transcription
            provider. Either way the conversation itself saves like typed
            chat. */}
        <p className="hbcall-note">
          {x(engine === 'server' ? HM.health_chat_call_note_server : HM.health_chat_call_note)}
        </p>
        <p className="hbcall-crisis">
          <CrisisNote />
        </p>
      </div>
    </div>
  )
}
