import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SignaturePad } from './SignaturePad'
import type { SignatureValue } from './SignaturePad'

const LABELS = {
  name: 'Name',
  draw: 'Draw',
  type: 'Type',
  clear: 'Clear',
  placeholder: 'Your name',
}

/* jsdom has no canvas implementation — stub the 2d context and the export
   surface so stroke handlers run. Only the emit path matters here. */
function fakeCtx(): CanvasRenderingContext2D {
  return {
    scale: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
  } as unknown as CanvasRenderingContext2D
}

function drawStroke() {
  const canvas = document.querySelector('canvas')
  if (!canvas) throw new Error('canvas missing')
  fireEvent.mouseDown(canvas, { clientX: 4, clientY: 4 })
  fireEvent.mouseMove(canvas, { clientX: 12, clientY: 9 })
  fireEvent.mouseUp(canvas)
}

describe('SignaturePad', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      (() => fakeCtx()) as never,
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,drawn',
    )
  })

  it('emits the drawn signature once the name is entered (draw → name order)', () => {
    const onChange = vi.fn<(value: SignatureValue | undefined) => void>()
    render(<SignaturePad onChange={onChange} labels={LABELS} />)

    drawStroke()
    /* No name yet — the stroke emitted undefined. */
    expect(onChange).toHaveBeenLastCalledWith(undefined)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Sam Stone' } })
    expect(onChange).toHaveBeenLastCalledWith({
      image: 'data:image/png;base64,drawn',
      signedName: 'Sam Stone',
    })
  })

  it('emits undefined when the name is cleared after drawing', () => {
    const onChange = vi.fn<(value: SignatureValue | undefined) => void>()
    render(<SignaturePad onChange={onChange} labels={LABELS} />)

    drawStroke()
    const name = screen.getByLabelText('Name')
    fireEvent.change(name, { target: { value: 'Sam Stone' } })
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ signedName: 'Sam Stone' }))

    fireEvent.change(name, { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith(undefined)
  })

  it('Clear wipes the canvas and resets the emitted value', () => {
    const onChange = vi.fn<(value: SignatureValue | undefined) => void>()
    render(<SignaturePad onChange={onChange} labels={LABELS} />)

    drawStroke()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Sam Stone' } })
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ signedName: 'Sam Stone' }))

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onChange).toHaveBeenLastCalledWith(undefined)

    /* Typing the name again after Clear must not resurrect the wiped drawing. */
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Sam Stone' } })
    expect(onChange).toHaveBeenLastCalledWith(undefined)
  })
})
