import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  buildBrief,
  loadEnabled,
  loadNotes,
  saveEnabled,
  saveNotes,
  type Annotation,
} from './annotations'
import { buildSelector, describeElement, getSourceInfo } from './domInspect'

/**
 * In-app developer annotation overlay (dev + preview only — gated in App.tsx).
 *
 * Arm "annotate" mode, click any element to pin a comment to it; each note
 * captures the element's source file:line (from the data-loc attribute stamped
 * in vite.config.ts), a description, and the current route. "Copy brief" emits
 * a Markdown summary to paste into an AI chat. Toggle with ⌘/Ctrl+Shift+D.
 *
 * Self-contained: it portals to <body> with its own hard-coded styles (the
 * app's theme tokens are scoped to the marketing/app surfaces, which this sits
 * outside of) and a full-screen but pointer-events:none container, so it never
 * blocks or restyles the page it's inspecting.
 */

const Z = 2147483000

const STYLE = `
.ddv-root { position: fixed; inset: 0; z-index: ${Z}; pointer-events: none;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #e6edf3; }
.ddv-root * { box-sizing: border-box; }
.ddv-hl-svg { position: fixed; inset: 0; z-index: ${Z}; pointer-events: none; width: 100%; height: 100%; }
.ddv-hl-rect { fill: rgba(110,168,254,.14); stroke: #6ea8fe; stroke-width: 2; }
.ddv-hl-label-svg { fill: #fff; font-size: 11px; font-family: ui-monospace, monospace; }
.ddv-banner { position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
  pointer-events: none; background: #1f6feb; color: #fff; font-size: 12px; font-weight: 600;
  padding: 7px 12px; border-radius: 100px; box-shadow: 0 4px 14px rgba(0,0,0,.35); }
.ddv-launcher { position: fixed; left: 16px; bottom: 16px; pointer-events: auto; cursor: pointer;
  display: flex; align-items: center; gap: 7px; background: #161b22; border: 1px solid #30363d;
  color: #e6edf3; font-size: 12px; font-weight: 600; padding: 8px 12px; border-radius: 100px;
  box-shadow: 0 6px 20px rgba(0,0,0,.4); font-family: ui-monospace, monospace; }
.ddv-launcher:hover { border-color: #6ea8fe; }
.ddv-badge { background: #1f6feb; color: #fff; border-radius: 100px; font-size: 10px;
  padding: 1px 6px; min-width: 16px; text-align: center; }
.ddv-panel { position: fixed; left: 16px; bottom: 16px; width: 360px; max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px); display: flex; flex-direction: column; pointer-events: auto;
  background: #0d1117; border: 1px solid #30363d; border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,.5); overflow: hidden; }
.ddv-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px;
  border-bottom: 1px solid #21262d; }
.ddv-title { font-size: 12.5px; font-weight: 700; flex: 1; }
.ddv-tools { display: flex; gap: 6px; padding: 8px 12px; border-bottom: 1px solid #21262d;
  flex-wrap: wrap; }
.ddv-btn { cursor: pointer; background: #21262d; border: 1px solid #30363d; color: #e6edf3;
  font-size: 11.5px; font-weight: 600; padding: 5px 9px; border-radius: 7px;
  font-family: ui-monospace, monospace; }
.ddv-btn:hover { border-color: #6ea8fe; }
.ddv-btn[data-on="1"] { background: #1f6feb; border-color: #1f6feb; color: #fff; }
.ddv-btn-icon { padding: 5px 8px; }
.ddv-list { overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 8px; }
.ddv-empty { color: #8b949e; font-size: 12px; padding: 16px 8px; text-align: center; line-height: 1.5; }
.ddv-row { background: #161b22; border: 1px solid #21262d; border-radius: 9px; padding: 8px; }
.ddv-meta { font-size: 10.5px; color: #8b949e; word-break: break-all; margin-bottom: 5px; }
.ddv-file { color: #6ea8fe; }
.ddv-elem { color: #d2a8ff; }
.ddv-note { width: 100%; resize: vertical; min-height: 42px; background: #0d1117;
  border: 1px solid #30363d; border-radius: 6px; color: #e6edf3; font-size: 12px; padding: 6px;
  font-family: inherit; }
.ddv-note:focus { outline: none; border-color: #6ea8fe; }
.ddv-rowbar { display: flex; gap: 6px; margin-top: 6px; }
.ddv-link { cursor: pointer; background: none; border: none; color: #8b949e; font-size: 11px;
  padding: 2px 4px; font-family: inherit; }
.ddv-link:hover { color: #e6edf3; }
.ddv-link[data-danger="1"]:hover { color: #f85149; }
.ddv-preview { margin: 0 8px 8px; width: calc(100% - 16px); height: 120px; background: #010409;
  border: 1px solid #30363d; border-radius: 6px; color: #e6edf3; font-size: 11px; padding: 6px;
  font-family: ui-monospace, monospace; }
`

function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

interface Highlight {
  rect: { top: number; left: number; width: number; height: number }
  label: string
}

export default function DevAnnotations() {
  const [enabled, setEnabled] = useState<boolean>(() => loadEnabled(true))
  const [panelOpen, setPanelOpen] = useState(false)
  const [annotating, setAnnotating] = useState(false)
  const [notes, setNotes] = useState<Annotation[]>(() => loadNotes())
  const [highlight, setHighlight] = useState<Highlight | null>(null)
  const [copied, setCopied] = useState(false)
  const [showBrief, setShowBrief] = useState(false)

  const rootRef = useRef<HTMLDivElement | null>(null)
  const focusId = useRef<string | null>(null)
  const flashTimer = useRef<number | null>(null)

  useEffect(() => saveNotes(notes), [notes])
  useEffect(() => saveEnabled(enabled), [enabled])

  const insideUi = useCallback((target: EventTarget | null): boolean => {
    return target instanceof Node && rootRef.current !== null && rootRef.current.contains(target)
  }, [])

  const labelFor = (el: Element): string => {
    const { file, line, component } = getSourceInfo(el)
    if (file) return `${component ?? file}${line ? `:${line}` : ''}`
    return el.tagName.toLowerCase()
  }

  const pin = useCallback((el: Element) => {
    const source = getSourceInfo(el)
    const note: Annotation = {
      id: newId(),
      route: window.location.pathname,
      file: source.file,
      line: source.line,
      component: source.component,
      element: describeElement(el),
      selector: buildSelector(el),
      note: '',
      createdAt: Date.now(),
    }
    focusId.current = note.id
    setNotes((prev) => [...prev, note])
    setPanelOpen(true)
  }, [])

  /* Global keyboard: ⌘/Ctrl+Shift+D toggles (and re-enables when hidden);
     Escape leaves annotate mode. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault()
        if (!enabled) {
          setEnabled(true)
          setPanelOpen(true)
          return
        }
        setPanelOpen((v) => !v)
      } else if (e.key === 'Escape' && annotating) {
        setAnnotating(false)
        setHighlight(null)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [enabled, annotating])

  /* Annotate mode: hover to highlight, click (captured) to pin. */
  useEffect(() => {
    if (!annotating) return

    const onMove = (e: MouseEvent) => {
      const target = e.target
      if (!(target instanceof Element) || insideUi(target)) {
        setHighlight(null)
        return
      }
      const rect = target.getBoundingClientRect()
      setHighlight({
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        label: labelFor(target),
      })
    }
    const onClick = (e: MouseEvent) => {
      if (insideUi(e.target)) return
      e.preventDefault()
      e.stopPropagation()
      if (e.target instanceof Element) pin(e.target)
    }

    document.addEventListener('mousemove', onMove, true)
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('mousemove', onMove, true)
      document.removeEventListener('click', onClick, true)
    }
  }, [annotating, insideUi, pin])

  /* Focus the textarea of a freshly pinned note. */
  useEffect(() => {
    if (!focusId.current) return
    const id = focusId.current
    focusId.current = null
    rootRef.current?.querySelector<HTMLTextAreaElement>(`textarea[data-note-id="${id}"]`)?.focus()
  }, [notes])

  useEffect(() => {
    return () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current)
    }
  }, [])

  const updateNote = (id: string, value: string) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, note: value } : n)))
  const deleteNote = (id: string) => setNotes((prev) => prev.filter((n) => n.id !== id))
  const clearAll = () => {
    if (notes.length === 0 || window.confirm('Delete all annotations?')) setNotes([])
  }

  const locate = (note: Annotation) => {
    let el: Element | null = null
    try {
      el = note.selector ? document.querySelector(note.selector) : null
    } catch {
      el = null
    }
    if (!el) {
      window.alert('Element not found on this page — the note may be for a different route.')
      return
    }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const rect = el.getBoundingClientRect()
    setHighlight({
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      label: labelFor(el),
    })
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setHighlight(null), 1400)
  }

  const copyBrief = () => {
    const text = buildBrief(notes)
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1600)
      },
      () => setShowBrief(true),
    )
  }

  if (!enabled) return null

  const overlay = (
    <div ref={rootRef} className="ddv-root" data-dev-annotations="">
      {highlight && (
        <svg className="ddv-hl-svg" aria-hidden="true">
          <rect
            x={highlight.rect.left - 2}
            y={highlight.rect.top - 2}
            width={highlight.rect.width + 4}
            height={highlight.rect.height + 4}
            rx={3}
            className="ddv-hl-rect"
          />
          <rect
            x={highlight.rect.left - 2}
            y={highlight.rect.top - 24}
            width={Math.max(highlight.label.length * 7 + 12, 40)}
            height={18}
            rx={4}
            fill="#1f6feb"
          />
          <text
            x={highlight.rect.left + 4}
            y={highlight.rect.top - 11}
            className="ddv-hl-label-svg"
          >
            {highlight.label}
          </text>
        </svg>
      )}

      {annotating && (
        <div className="ddv-banner">Annotation mode — click an element · Esc to stop</div>
      )}

      {!panelOpen && (
        <button type="button" className="ddv-launcher" onClick={() => setPanelOpen(true)}>
          <span aria-hidden>◎</span> Annotate
          {notes.length > 0 && <span className="ddv-badge">{notes.length}</span>}
        </button>
      )}

      {panelOpen && (
        <div className="ddv-panel">
          <div className="ddv-head">
            <span className="ddv-title">Dev Annotations</span>
            <button
              type="button"
              className="ddv-btn ddv-btn-icon"
              title="Hide (⌘/Ctrl+Shift+D to reopen)"
              onClick={() => setEnabled(false)}
            >
              Hide
            </button>
            <button
              type="button"
              className="ddv-btn ddv-btn-icon"
              title="Close"
              onClick={() => {
                setPanelOpen(false)
                setAnnotating(false)
                setHighlight(null)
              }}
            >
              ✕
            </button>
          </div>

          <div className="ddv-tools">
            <button
              type="button"
              className="ddv-btn"
              data-on={annotating ? '1' : '0'}
              onClick={() => setAnnotating((v) => !v)}
            >
              {annotating ? '● Annotating' : '◎ Annotate'}
            </button>
            <button
              type="button"
              className="ddv-btn"
              onClick={copyBrief}
              disabled={notes.length === 0}
            >
              {copied ? '✓ Copied' : 'Copy brief'}
            </button>
            <button type="button" className="ddv-btn" onClick={() => setShowBrief((v) => !v)}>
              {showBrief ? 'Hide brief' : 'Show brief'}
            </button>
            <button
              type="button"
              className="ddv-btn"
              onClick={clearAll}
              disabled={notes.length === 0}
            >
              Clear
            </button>
          </div>

          {showBrief && <textarea className="ddv-preview" readOnly value={buildBrief(notes)} />}

          <div className="ddv-list">
            {notes.length === 0 ? (
              <div className="ddv-empty">
                No annotations yet.
                <br />
                Click <b>Annotate</b>, then click any element on the page to pin a note to it.
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="ddv-row">
                  <div className="ddv-meta">
                    <span>{note.route}</span>
                    {' · '}
                    <span className="ddv-file">
                      {note.file
                        ? `${note.file}${note.line ? `:${note.line}` : ''}`
                        : 'unknown source'}
                    </span>
                    <br />
                    <span className="ddv-elem">{note.element}</span>
                  </div>
                  <textarea
                    className="ddv-note"
                    data-note-id={note.id}
                    placeholder="Describe the change you want…"
                    value={note.note}
                    onChange={(e) => updateNote(note.id, e.target.value)}
                  />
                  <div className="ddv-rowbar">
                    <button type="button" className="ddv-link" onClick={() => locate(note)}>
                      Locate
                    </button>
                    <button
                      type="button"
                      className="ddv-link"
                      data-danger="1"
                      onClick={() => deleteNote(note.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )

  return createPortal(
    <>
      <style>{STYLE}</style>
      {overlay}
    </>,
    document.body,
  )
}
