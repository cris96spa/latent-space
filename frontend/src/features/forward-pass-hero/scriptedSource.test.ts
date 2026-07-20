import { describe, expect, it } from 'vitest'

import { CANONICAL_BIO, HERO_PROMPT } from './content'
import { createHeroForwardPassSource, createScriptedForwardPassSource } from './scriptedSource'
import { pretokenizeText } from './tokenize'
import type { ForwardPassFrame, ForwardPassSource } from './types'

async function collectFrames(source: ForwardPassSource): Promise<ForwardPassFrame[]> {
  const frames: ForwardPassFrame[] = []
  for await (const frame of source.frames()) {
    frames.push(frame)
  }
  return frames
}

describe('createHeroForwardPassSource', () => {
  it('exposes the tokenized prompt as its input tokens', () => {
    const source = createHeroForwardPassSource()
    expect(source.prompt).toBe(HERO_PROMPT)
    expect(source.inputTokens.map((token) => token.text)).toEqual(pretokenizeText(HERO_PROMPT))
  })

  it('streams a final frame whose emitted tokens reconstruct the canonical bio', async () => {
    const frames = await collectFrames(createHeroForwardPassSource())
    const final = frames[frames.length - 1]
    expect(final.isComplete).toBe(true)
    expect(final.emittedTokens.map((token) => token.text).join('')).toBe(CANONICAL_BIO)
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
})
