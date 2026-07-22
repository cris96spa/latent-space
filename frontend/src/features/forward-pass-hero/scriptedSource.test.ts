import { describe, expect, it } from 'vitest'

import { createForwardPassSourceFromTokens, createScriptedForwardPassSource } from './scriptedSource'
import type { ForwardPassFrame, ForwardPassSource, Token } from './types'

async function collectFrames(source: ForwardPassSource): Promise<ForwardPassFrame[]> {
  const frames: ForwardPassFrame[] = []
  for await (const frame of source.frames()) {
    frames.push(frame)
  }
  return frames
}

function tokens(texts: readonly string[]): Token[] {
  return texts.map((text, index) => ({ index, text, id: index }))
}

describe('createForwardPassSourceFromTokens', () => {
  it('streams a final frame whose emitted tokens reconstruct the output', async () => {
    const source = createForwardPassSourceFromTokens('Who?', tokens(['Who', '?']), tokens(['Hi', '!']))
    const frames = await collectFrames(source)
    const final = frames[frames.length - 1]

    expect(final.isComplete).toBe(true)
    expect(final.emittedTokens.map((token) => token.text).join('')).toBe('Hi!')
    expect(source.inputTokens.map((token) => token.id)).toEqual([0, 1])
  })
})

describe('createScriptedForwardPassSource', () => {
  it('stops yielding once the caller aborts', async () => {
    const source = createScriptedForwardPassSource({ prompt: 'A b?', output: 'Hi there' })
    const controller = new AbortController()
    const seen: ForwardPassFrame[] = []
    for await (const frame of source.frames(controller.signal)) {
      seen.push(frame)
      controller.abort()
    }
    expect(seen).toHaveLength(1)
  })

  it('marks fallback tokens with the -1 id sentinel', () => {
    const source = createScriptedForwardPassSource({ prompt: 'A b?', output: 'Hi' })
    expect(source.inputTokens.every((token) => token.id === -1)).toBe(true)
  })
})
