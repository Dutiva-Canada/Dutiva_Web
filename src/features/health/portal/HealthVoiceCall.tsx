import { useEffect } from 'react'
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from 'lucide-react'
import { healthMessages as HM } from '@/i18n/messages/health'
import { CrisisNote } from './CrisisNote'
import type { VoiceCallStatus } from './useHealthVoiceCall'

const STATUS_KEY: Record<Exclude<VoiceCallStatus, 'idle'>, { en: string; fr: string }> = {
  listening: HM.health_chat_call_listening,
  thinking: HM.health_chat_call_thinking,
  speaking: HM.health_chat_call_speaking,
  muted: HM.health_chat_call_muted,
  blocked: HM.health_chat_call_blocked,
}

/**
 * The in-call overlay — a modal card over the chat page: Mira's status, the
 * live transcript, and the three call controls (mic, her voice, hang up).
 * The conversation underneath stays the same object — voice is an
 * input/output modality, so the log behind the overlay keeps every turn.
 * Escape hangs up; the standing crisis line stays reachable in the footer.
 */
export function HealthVoiceCall({
  status,
  liveText,
  lastText,
  micOff,
  voiceOff,
  x,
  onMic,
  onVoice,
  onEnd,
}: {
  status: VoiceCallStatus
  liveText: string
  lastText: string
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

  const statusText = status === 'idle' ? '' : x(STATUS_KEY[status])

  return (
    <div className="hbcall" role="dialog" aria-modal="true" aria-label={x(HM.health_chat_call)}>
      <div className="hbcall-card">
        <p className="hbcall-name">Mira</p>
        <p className="hbcall-status" role="status">
          {statusText}
        </p>
        {/* Live transcript — interim words while you speak, then the
            utterance you sent while she thinks and answers. */}
        <p className="hbcall-live" aria-live="polite">
          {liveText || lastText || ' '}
        </p>
        <div className="hbcall-controls">
          <button
            type="button"
            className="hbcall-btn"
            onClick={onMic}
            disabled={status === 'thinking' || status === 'blocked'}
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
        {/* Honest provenance — the browser's speech services carry the
            audio; the conversation itself saves like typed chat. */}
        <p className="hbcall-note">{x(HM.health_chat_call_note)}</p>
        <p className="hbcall-crisis">
          <CrisisNote />
        </p>
      </div>
    </div>
  )
}
