import { useEffect, useRef, useState } from 'react'

export interface SignatureValue {
  /** Base64 PNG of the captured signature. */
  image: string
  /** Plain-text name the signer entered. */
  signedName: string
}

interface SignaturePadProps {
  readonly onChange: (value: SignatureValue | undefined) => void
  readonly labels: {
    name: string
    draw: string
    type: string
    clear: string
    placeholder: string
  }
}

function setupCanvas(canvas: HTMLCanvasElement, container: HTMLElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const { width, height } = container.getBoundingClientRect()
  canvas.width = Math.max(1, Math.floor(width * dpr))
  canvas.height = Math.max(1, Math.floor(height * dpr))
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.scale(dpr, dpr)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 2
  ctx.strokeStyle = '#111827'
  return ctx
}

export function SignaturePad({ onChange, labels }: SignaturePadProps) {
  const [mode, setMode] = useState<'draw' | 'type'>('draw')
  const [signedName, setSignedName] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const drawingRef = useRef(false)
  const lastRef = useRef({ x: 0, y: 0 })

  const emit = (image: string) => {
    onChange(signedName.trim() ? { image, signedName: signedName.trim() } : undefined)
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    const { width, height } = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, width, height)
    onChange(undefined)
  }

  const renderTyped = () => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    const container = containerRef.current
    if (!canvas || !ctx || !container) return
    const { width, height } = container.getBoundingClientRect()
    ctx.clearRect(0, 0, width, height)
    if (!signedName.trim()) return
    ctx.font = '32px cursive, Georgia, serif'
    ctx.fillStyle = '#111827'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(signedName.trim(), width / 2, height / 2)
    emit(canvas.toDataURL('image/png'))
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    ctxRef.current = setupCanvas(canvas, container)
    return () => {
      ctxRef.current = null
    }
  }, [])

  useEffect(() => {
    if (mode === 'type') {
      renderTyped()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, signedName])

  const startStroke = (x: number, y: number) => {
    const ctx = ctxRef.current
    if (!ctx) return
    drawingRef.current = true
    lastRef.current = { x, y }
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const moveStroke = (x: number, y: number) => {
    if (!drawingRef.current) return
    const ctx = ctxRef.current
    if (!ctx) return
    ctx.lineTo(x, y)
    ctx.stroke()
    lastRef.current = { x, y }
  }

  const endStroke = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const canvas = canvasRef.current
    if (canvas) emit(canvas.toDataURL('image/png'))
  }

  const pointerFor = (event: React.MouseEvent | React.TouchEvent) => {
    const container = containerRef.current
    if (!container) return { x: 0, y: 0 }
    const rect = container.getBoundingClientRect()
    let clientX: number
    let clientY: number
    if ('touches' in event) {
      clientX = event.touches[0]?.clientX ?? event.changedTouches[0]?.clientX ?? 0
      clientY = event.touches[0]?.clientY ?? event.changedTouches[0]?.clientY ?? 0
    } else {
      clientX = event.clientX
      clientY = event.clientY
    }
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  return (
    <div className="w-full space-y-3">
      <div>
        <label className="mb-1 block text-[12.5px] font-semibold text-text" htmlFor="signer-name">
          {labels.name}
        </label>
        <input
          id="signer-name"
          type="text"
          value={signedName}
          onChange={(e) => {
            setSignedName(e.target.value)
            if (mode === 'draw' && !e.target.value.trim()) {
              onChange(undefined)
            }
          }}
          placeholder={labels.placeholder}
          className="w-full rounded-[10px] border border-border bg-surface px-3 py-2.25 text-[13px] text-text placeholder:text-text-faint"
        />
      </div>

      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setMode('draw')}
          className={`rounded-lg px-2.5 py-1.25 text-[12px] font-semibold ${
            mode === 'draw' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'
          }`}
        >
          {labels.draw}
        </button>
        <button
          type="button"
          onClick={() => setMode('type')}
          className={`rounded-lg px-2.5 py-1.25 text-[12px] font-semibold ${
            mode === 'type' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'
          }`}
        >
          {labels.type}
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative h-35 w-full touch-none overflow-hidden rounded-[10px] border border-border bg-inset"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={labels.draw}
          onMouseDown={(event) => {
            event.preventDefault()
            const { x, y } = pointerFor(event)
            startStroke(x, y)
          }}
          onMouseMove={(event) => {
            event.preventDefault()
            const { x, y } = pointerFor(event)
            moveStroke(x, y)
          }}
          onMouseUp={endStroke}
          onMouseLeave={endStroke}
          onTouchStart={(event) => {
            event.preventDefault()
            const { x, y } = pointerFor(event)
            startStroke(x, y)
          }}
          onTouchMove={(event) => {
            event.preventDefault()
            const { x, y } = pointerFor(event)
            moveStroke(x, y)
          }}
          onTouchEnd={endStroke}
        />
      </div>

      <button
        type="button"
        onClick={clear}
        className="text-[12px] font-semibold text-text-muted underline-offset-2 hover:text-text hover:underline"
      >
        {labels.clear}
      </button>
    </div>
  )
}
