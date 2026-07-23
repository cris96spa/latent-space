import { screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it } from 'vitest'

import { NotFound } from './NotFound'
import { renderInApp } from '../test-utils/render'

describe('NotFound', () => {
  it('shows the error and a single link back home', () => {
    renderInApp(<NotFound />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /input layer/i })).toHaveAttribute('href', '/')
  })

  it('shows the logo with a text alternative', () => {
    renderInApp(<NotFound />)
    expect(screen.getByAltText('latent-space')).toBeInTheDocument()
  })

  it('has no automatically-detectable accessibility violations', async () => {
    const { container } = renderInApp(<NotFound />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
