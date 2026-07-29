import { describe, expect, it } from 'vitest'

import { longestString } from './longestString'

describe('longestString', () => {
  it('returns the longest value', () => {
    expect(longestString(['decode', 'tokenize', 'complete'])).toBe('tokenize')
  })

  it('keeps the first of equally long values, so the answer is stable', () => {
    expect(longestString(['prefill', 'tokenize', 'complete'])).toBe('tokenize')
  })

  it('returns an empty string for no values', () => {
    expect(longestString([])).toBe('')
  })
})
