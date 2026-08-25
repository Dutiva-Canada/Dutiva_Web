import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/renderApp'
import { TestimonialWall } from './TestimonialWall'

describe('TestimonialWall', () => {
  it('renders nothing until published testimonials exist', () => {
    const { container } = renderApp(<TestimonialWall />, { route: '/', path: '/' })
    expect(container.querySelector('#testimonials')).toBeNull()
  })
})
