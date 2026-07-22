import { afterEach, describe, expect, it, vi } from 'vitest'

import { CANONICAL_BIO, HERO_PROMPT } from './content'

vi.mock('../../lib/api', () => ({ tokenize: vi.fn() }))
import { tokenize } from '../../lib/api'
import { buildHeroForwardPass } from './heroSource'

const tokenizeMock = vi.mocked(tokenize)

afterEach(() => {
  tokenizeMock.mockReset()
})

describe('buildHeroForwardPass', () => {
  it('uses real backend tokens and exposes their ids and counts', async () => {
    tokenizeMock.mockImplementation(async (text: string) => {
      if (text === HERO_PROMPT) {
        return {
          tokens: [
            { id: 8241, text: 'Who' },
            { id: 318, text: ' is' },
          ],
          tokenCount: 2,
          wordCount: 2,
          charCount: 6,
        }
      }
      return { tokens: [{ id: 1, text: 'Hi' }], tokenCount: 1, wordCount: 1, charCount: 2 }
    })

    const hero = await buildHeroForwardPass()

    expect(hero.idsAvailable).toBe(true)
    expect(hero.promptTokens.map((token) => token.id)).toEqual([8241, 318])
    expect(hero.promptCounts).toEqual({ tokenCount: 2, wordCount: 2, charCount: 6 })
    expect(hero.source.prompt).toBe(HERO_PROMPT)
  })

  it('falls back to the client pretokenizer when the backend fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    tokenizeMock.mockRejectedValue(new Error('offline'))

    const hero = await buildHeroForwardPass()

    expect(hero.idsAvailable).toBe(false)
    expect(hero.promptCounts).toBeNull()
    // Fallback tokens carry the -1 sentinel and still reconstruct the prompt.
    expect(hero.promptTokens.every((token) => token.id === -1)).toBe(true)
    expect(hero.promptTokens.map((token) => token.text).join('')).toBe(HERO_PROMPT)
    expect(CANONICAL_BIO.length).toBeGreaterThan(0)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    warnSpy.mockRestore()
  })
})
