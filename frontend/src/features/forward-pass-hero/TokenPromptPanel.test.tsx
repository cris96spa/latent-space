import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { TokenPromptPanel } from './TokenPromptPanel'
import type { TokenView } from './TokenizedText'
import type { Token } from './types'

const tokens: Token[] = [
  { index: 0, text: 'Who', id: 8241 },
  { index: 1, text: ' is', id: 318 },
]
const counts = { tokenCount: 2, wordCount: 2, charCount: 6 }

function Harness({ idsAvailable = true }: { idsAvailable?: boolean }) {
  const [view, setView] = useState<TokenView>('text')
  return (
    <TokenPromptPanel
      tokens={tokens}
      promptText="Who is"
      counts={idsAvailable ? counts : null}
      view={view}
      onViewChange={setView}
      idsAvailable={idsAvailable}
    />
  )
}

describe('TokenPromptPanel', () => {
  it('shows the token, word, and character counts', () => {
    render(<Harness />)
    expect(screen.getByText(/2 tokens/)).toBeInTheDocument()
    expect(screen.getByText(/2 words/)).toBeInTheDocument()
    expect(screen.getByText(/6 chars/)).toBeInTheDocument()
  })

  it('flips the chips from text to ids when the ids radio is chosen', async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness />)
    expect(container.textContent).toContain('Who')

    await user.click(screen.getByRole('radio', { name: 'ids' }))
    expect(container.textContent).toContain('8241')
  })

  it('hides the toggle and counts in the fallback (no real ids)', () => {
    render(<Harness idsAvailable={false} />)
    expect(screen.queryByRole('radio', { name: 'ids' })).not.toBeInTheDocument()
    expect(screen.queryByText(/tokens/)).not.toBeInTheDocument()
  })
})
