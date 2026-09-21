/**
 * Voice-note capture helpers for the on-device ASR models (Whisper).
 *
 * The runtime expects mono PCM at 16 kHz as a `Float32Array`; browsers hand
 * us a compressed MediaRecorder blob at the hardware's own rate and channel
 * count. `decodeBlobToMono16k` bridges the two: decode → mixdown → resample.
 * The two math steps are exported pure so tests can pin them without an
 * AudioContext (absent in jsdom).
 */

export const VOICE_SAMPLE_RATE = 16_000

/** Average N channels into one. Shorter channels stop contributing early. */
export function mixdownToMono(channels: readonly Float32Array[]): Float32Array {
  if (channels.length === 0) return new Float32Array(0)
  const len = Math.max(...channels.map((c) => c.length))
  const out = new Float32Array(len)
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) out[i]! += ch[i]! / channels.length
  }
  return out
}

/** Linear-interpolation resample — adequate for speech at these rates. */
export function resampleLinear(
  samples: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (samples.length === 0) return new Float32Array(0)
  if (fromRate === toRate) return samples.slice()
  const outLen = Math.max(1, Math.round(samples.length * (toRate / fromRate)))
  const out = new Float32Array(outLen)
  const step = fromRate / toRate
  for (let i = 0; i < outLen; i++) {
    const pos = i * step
    const lo = Math.min(Math.floor(pos), samples.length - 1)
    const hi = Math.min(lo + 1, samples.length - 1)
    const frac = pos - lo
    out[i] = samples[lo]! * (1 - frac) + samples[hi]! * frac
  }
  return out
}

/** MediaRecorder blob → mono 16 kHz samples ready for the ASR pipeline. */
export async function decodeBlobToMono16k(blob: Blob): Promise<Float32Array> {
  const ctx = new AudioContext()
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer())
    const channels = Array.from({ length: buf.numberOfChannels }, (_, i) => buf.getChannelData(i))
    return resampleLinear(mixdownToMono(channels), buf.sampleRate, VOICE_SAMPLE_RATE)
  } finally {
    void ctx.close()
  }
}
