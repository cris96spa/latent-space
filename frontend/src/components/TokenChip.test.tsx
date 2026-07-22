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

  it('forwards title and aria-label to the chip element', () => {
    renderInApp(
      <TokenChip title="Python" aria-label="Python — GPT-2 token IDs 37906">
        37906
      </TokenChip>,
    )
    const chip = screen.getByLabelText('Python — GPT-2 token IDs 37906')
    expect(chip).toHaveAttribute('title', 'Python')
  })
})
