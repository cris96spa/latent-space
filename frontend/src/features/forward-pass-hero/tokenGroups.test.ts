import { describe, expect, it } from 'vitest'

import { groupTokensByGrapheme } from './tokenGroups'
import type { Token } from './types'

function token(text: string, id = 0): Token {
  return { index: 0, text, id }
}

describe('groupTokensByGrapheme', () => {
  it('keeps ordinary word-piece tokens as one group each', () => {
    const groups = groupTokensByGrapheme([token('Crist', 1), token('ian', 2)])
    expect(groups.map((group) => group.text)).toEqual(['Crist', 'ian'])
    expect(groups.every((group) => group.tokens.length === 1)).toBe(true)
  })

  it('groups the byte-level tokens of one emoji into a single glyph group', () => {
    // The lossless mapping attributes the emoji to its lead token and leaves the
    // continuation-byte tokens empty; the trailing token carries the variation selector.
    const emojiTokens = [token('🛠', 10), token('', 11), token('', 12), token('️', 13)]
    const groups = groupTokensByGrapheme(emojiTokens)

    expect(groups).toHaveLength(1)
    expect(groups[0].tokens).toHaveLength(4)
    expect(groups[0].text).toBe('🛠️')
  })

  it('folds a single-codepoint emoji continuation tokens into one group, no empty phantom groups', () => {
    const groups = groupTokensByGrapheme([token('🤓', 20), token('', 21), token('', 22)])
    expect(groups).toHaveLength(1)
    expect(groups[0].tokens).toHaveLength(3)
    expect(groups[0].text).toBe('🤓')
  })

  it('keeps two adjacent multi-token emoji as separate groups', () => {
    const groups = groupTokensByGrapheme([
      token('🤓', 1),
      token('', 2),
      token('', 3),
      token('📉', 4),
      token('', 5),
      token('', 6),
    ])
    expect(groups).toHaveLength(2)
    expect(groups.map((group) => group.text)).toEqual(['🤓', '📉'])
    expect(groups.every((group) => group.tokens.length === 3)).toBe(true)
    expect(groups.some((group) => group.text === '')).toBe(false)
  })
})
