import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TokenizedText } from './TokenizedText'
import type { Token } from './types'

const tokens: Token[] = [
  { index: 0, text: 'Who', id: 8241 },
  { index: 1, text: ' is', id: 318 },
]

describe('TokenizedText', () => {
  it('renders the token text in the text view', () => {
    const { container } = render(<TokenizedText tokens={tokens} view="text" />)
    expect(container.textContent).toBe('Who is')
  })

  it('renders the ids joined by spaces in the ids view', () => {
    const { container } = render(<TokenizedText tokens={tokens} view="ids" />)
    expect(container.textContent).toContain('8241')
    expect(container.textContent).toContain('318')
    expect(container.textContent).not.toContain('Who')
  })

  it('is decorative (aria-hidden) so assistive tech is not read token by token', () => {
    const { container } = render(<TokenizedText tokens={tokens} view="text" />)
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })
})
