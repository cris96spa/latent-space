import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { VOCABULARY_TOKENS } from './tokens'

const GPT2_VOCABULARY_SIZE = 50257
const here = dirname(fileURLToPath(import.meta.url))
const labels = JSON.parse(
  readFileSync(join(here, 'vocabulary.labels.json'), 'utf-8'),
) as string[]

describe('VOCABULARY_TOKENS', () => {
  it('matches the authored label list exactly, in order', () => {
    expect(VOCABULARY_TOKENS.map((token) => token.label)).toEqual(labels)
  })

  it('gives every label at least one token id', () => {
    for (const token of VOCABULARY_TOKENS) {
      expect(token.ids.length).toBeGreaterThan(0)
    }
  })

  it('only emits integer ids inside the GPT-2 vocabulary', () => {
    for (const token of VOCABULARY_TOKENS) {
      for (const id of token.ids) {
        expect(Number.isInteger(id)).toBe(true)
        expect(id).toBeGreaterThanOrEqual(0)
        expect(id).toBeLessThan(GPT2_VOCABULARY_SIZE)
      }
    }
  })
})
