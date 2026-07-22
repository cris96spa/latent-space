import { afterEach, describe, expect, it, vi } from 'vitest'

import { tokenize } from './api'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('tokenize', () => {
  it('POSTs the text and maps the snake_case wire to camelCase', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          tokens: [
            { id: 8241, text: 'Who' },
            { id: 318, text: ' is' },
          ],
          token_count: 2,
          word_count: 2,
          char_count: 6,
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await tokenize('Who is')

    expect(fetchMock).toHaveBeenCalledWith('/api/tokenize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Who is' }),
    })
    expect(result).toEqual({
      tokens: [
        { id: 8241, text: 'Who' },
        { id: 318, text: ' is' },
      ],
      tokenCount: 2,
      wordCount: 2,
      charCount: 6,
    })
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 422 })))
    await expect(tokenize('x')).rejects.toThrow('422')
  })
})
