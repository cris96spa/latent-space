import { screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it } from 'vitest'

import { TokenChip } from './TokenChip'
import { renderInApp } from '../test/render'

describe('TokenChip', () => {
  it('renders its children', () => {
    renderInApp(<TokenChip tone="neutral">PyTorch</TokenChip>)
    expect(screen.getByText('PyTorch')).toBeInTheDocument()
  })

  it('has no automatically-detectable accessibility violations', async () => {
    const { container } = renderInApp(<TokenChip tone="neutral">PyTorch</TokenChip>)
    expect(await axe(container)).toHaveNoViolations()
  })
})
