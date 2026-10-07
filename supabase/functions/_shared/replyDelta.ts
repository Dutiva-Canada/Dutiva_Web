/* Shared streaming extractor — the portal chat kinds all answer one JSON
   object {"reply":"…","action":…}; this surfaces the reply text only. */

/** Incremental extractor for streamed chat replies. The model's output is
    one JSON object — {"reply":"…","action":…} — arriving piece by piece.
    To stream we surface the reply text WITHOUT the JSON scaffolding or the
    action block: this hunts the "reply" key, then emits its string content
    (escapes resolved) until the closing quote. Emits nothing when the
    shape never arrives — the fully-parsed payload stays authoritative. */
export function createReplyDeltaExtractor(): { push: (chunk: string) => string } {
  const KEY = '"reply"'
  const ESCAPES: Record<string, string> = {
    n: '\n',
    t: '\t',
    r: '\r',
    b: '\b',
    f: '\f',
    '"': '"',
    '\\': '\\',
    '/': '/',
  }
  let buf = ''
  let emitting = false
  let done = false
  return {
    push(chunk) {
      if (done) return ''
      buf += chunk
      if (!emitting) {
        const ki = buf.indexOf(KEY)
        if (ki === -1) {
          /* keep only a tail — the key cannot straddle an evicted boundary */
          buf = buf.length > 64 ? buf.slice(-KEY.length) : buf
          return ''
        }
        const rest = buf.slice(ki + KEY.length)
        const open = /^\s*:\s*"/.exec(rest)
        if (!open) {
          /* the `:` and quote may not have arrived yet — hold briefly, then
             stop hoping (a malformed shape still resolves via `done`) */
          if (rest.length < 8) {
            buf = rest
            return ''
          }
          done = true
          return ''
        }
        buf = rest.slice(open[0].length)
        emitting = true
      }
      let out = ''
      let i = 0
      while (i < buf.length) {
        const ch = buf[i]
        if (ch === '"') {
          done = true
          i += 1
          break
        }
        if (ch === '\\') {
          const esc = buf[i + 1]
          if (esc === undefined) break /* escaped char not here yet */
          if (esc === 'u') {
            if (i + 6 > buf.length) break /* hex digits not here yet */
            const code = Number.parseInt(buf.slice(i + 2, i + 6), 16)
            if (!Number.isNaN(code)) out += String.fromCharCode(code)
            i += 6
            continue
          }
          out += ESCAPES[esc] ?? esc
          i += 2
          continue
        }
        out += ch
        i += 1
      }
      buf = buf.slice(i)
      return out
    },
  }
}
