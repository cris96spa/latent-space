import { describe, expect, it } from 'vitest'

import { TARGET_MODEL } from './architecture'

describe('TARGET_MODEL', () => {
  it('matches the public GPT-2 124M configuration', () => {
    expect(TARGET_MODEL).toMatchObject({
      blockCount: 12,
      contextLength: 1024,
      feedForwardActivation: 'gelu_new',
      feedForwardSize: 3072,
      hiddenSize: 768,
      keyValueHeadCount: 12,
      normalization: 'layernorm',
      positionalEncoding: 'learned absolute',
      queryHeadCount: 12,
      vocabularySize: 50257,
    })
  })
})
