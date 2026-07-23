import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StreamingBio } from './StreamingBio'
import type { ForwardPassFrame } from './types'

const SIZER = 'RESERVE SIZER TEXT'

/** StreamingBio only reads `emittedTokens`; the rest of the frame is irrelevant here. */
const frame = {
  emittedTokens: [
    { index: 0, text: 'Hi', id: 17250 },
    { index: 1, text: ' there', id: 612 },
  ],
} as ForwardPassFrame

describe('StreamingBio', () => {
  it('reserves the final height with an invisible copy of the bio in the text view', () => {
    const { container } = render(
      <StreamingBio frame={frame} streaming={false} view="text" reserveText={SIZER} />,
    )
    const sizer = container.querySelector('[aria-hidden="true"].invisible')
    expect(sizer?.textContent).toBe(SIZER)
  })

  it('does not reserve height in the ids view, where the token grid drives the height', () => {
    const { container } = render(
      <StreamingBio frame={frame} streaming={false} view="ids" reserveText={SIZER} />,
    )
    expect(container.textContent).not.toContain(SIZER)
  })
})
