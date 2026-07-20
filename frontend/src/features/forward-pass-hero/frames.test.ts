import { describe, expect, it } from 'vitest'

import {
  ATTENTION_HEADS,
  attentionEdgesForStep,
  buildDistractorVocabulary,
  buildForwardPassFrames,
  candidatesForStep,
  FORWARD_PASS_STAGES,
  frameDelayMs,
  mlpActivationsForStep,
  MLP_UNIT_COUNT,
  TOP_K,
} from './frames'
import { pretokenizeText } from './tokenize'
import type { ContextToken, Token } from './types'

function toTokens(text: string): Token[] {
  return pretokenizeText(text).map((tokenText, index) => ({ index, text: tokenText }))
}

function toContext(text: string): ContextToken[] {
  return toTokens(text).map((token) => ({ ...token, origin: 'prompt' as const }))
}

const PROMPT = toTokens('A b?')
const OUTPUT = toTokens('Hi there')
const VOCABULARY = buildDistractorVocabulary(OUTPUT)

describe('attentionEdgesForStep', () => {
  const context = toContext('who is Cristian?')
  const edges = attentionEdgesForStep(context, context.length - 1, 0)

  it('emits one weight per head per key in the window', () => {
    expect(edges).toHaveLength(ATTENTION_HEADS.length * context.length)
  })

  it('gives every head its own distribution summing to 1', () => {
    ATTENTION_HEADS.forEach((head) => {
      const total = edges
        .filter((edge) => edge.head === head.index)
        .reduce((sum, edge) => sum + edge.weight, 0)
      expect(total).toBeCloseTo(1, 10)
    })
  })

  it('puts the recency head on the query itself and the proper-noun head on the name', () => {
    const peakKeyFor = (head: number): number =>
      edges
        .filter((edge) => edge.head === head)
        .reduce((best, edge) => (edge.weight > best.weight ? edge : best)).keyIndex
    expect(peakKeyFor(0)).toBe(context.length - 1)
    expect(context[peakKeyFor(1)].text.trim()).toBe('Cristian')
  })

  it('returns nothing when there is no context yet', () => {
    expect(attentionEdgesForStep([], -1, 0)).toEqual([])
  })
})

describe('mlpActivationsForStep', () => {
  it('is one value per hidden unit, in [0, 1), and identical on replay', () => {
    const activations = mlpActivationsForStep(7)
    expect(activations).toHaveLength(MLP_UNIT_COUNT)
    activations.forEach((activation) => {
      expect(activation).toBeGreaterThanOrEqual(0)
      expect(activation).toBeLessThan(1)
    })
    expect(mlpActivationsForStep(7)).toEqual(activations)
  })
})

describe('candidatesForStep', () => {
  it('returns a sorted top-k distribution led by the emitted token', () => {
    const candidates = candidatesForStep(0, 'Hi', VOCABULARY)
    expect(candidates).toHaveLength(TOP_K)
    expect(candidates[0]).toMatchObject({ text: 'Hi', selected: true })
    expect(candidates.filter((candidate) => candidate.selected)).toHaveLength(1)

    const total = candidates.reduce((sum, candidate) => sum + candidate.probability, 0)
    expect(total).toBeCloseTo(1, 10)
    candidates.slice(1).forEach((candidate, rank) => {
      expect(candidate.probability).toBeLessThanOrEqual(candidates[rank].probability)
    })
  })

  it('never proposes the emitted token twice', () => {
    const texts = candidatesForStep(3, ' there', VOCABULARY).map((candidate) => candidate.text)
    expect(new Set(texts).size).toBe(texts.length)
  })

  /**
   * The bug this guards: deriving the runner-up logits as fixed offsets from the
   * winner makes every step share one distribution, because softmax only sees
   * differences. The winning probability must actually move from step to step.
   */
  it('varies the winning probability across steps instead of pinning to one value', () => {
    const winners = Array.from({ length: 40 }, (_, step) =>
      candidatesForStep(step, 'Hi', VOCABULARY)[0].probability,
    )
    expect(new Set(winners.map((probability) => probability.toFixed(4))).size).toBeGreaterThan(30)
    expect(Math.max(...winners) - Math.min(...winners)).toBeGreaterThan(0.2)
    winners.forEach((probability) => {
      expect(probability).toBeGreaterThan(1 / TOP_K)
      expect(probability).toBeLessThan(1)
    })
  })
})

describe('buildForwardPassFrames', () => {
  const frames = buildForwardPassFrames(PROMPT, OUTPUT)

  it('has length prompt + stages + (outputs - 1) + 1 complete', () => {
    expect(PROMPT).toHaveLength(3)
    expect(OUTPUT).toHaveLength(2)
    expect(frames).toHaveLength(3 + FORWARD_PASS_STAGES.length + 1 + 1)
    frames.forEach((frame, index) => expect(frame.index).toBe(index))
  })

  it('reveals the prompt one token at a time with a cold cache', () => {
    const tokenize = frames.filter((frame) => frame.phase === 'tokenize')
    expect(tokenize.map((frame) => frame.context.length)).toEqual([1, 2, 3])
    expect(tokenize.every((frame) => frame.kvCacheLength === 0)).toBe(true)
    expect(tokenize.every((frame) => frame.activeStage === null)).toBe(true)
  })

  it('walks the stages once in prefill, filling the cache for every prompt position', () => {
    const prefill = frames.filter((frame) => frame.phase === 'prefill')
    expect(prefill.map((frame) => frame.activeStage)).toEqual([...FORWARD_PASS_STAGES])
    expect(prefill[0].kvCacheLength).toBe(0)
    // One parallel pass, so the cache goes from empty to the whole prompt at once.
    expect(prefill[1].kvCacheLength).toBe(PROMPT.length)
    expect(prefill[0].attention).toEqual([])
    expect(prefill[2].attention.length).toBeGreaterThan(0)
    expect(prefill[4].logits).toHaveLength(TOP_K)
    expect(prefill[5].emittedTokens).toEqual(OUTPUT.slice(0, 1))
  })

  it('decodes the remaining tokens one pass at a time, growing the cache by one', () => {
    const decode = frames.filter((frame) => frame.phase === 'decode')
    expect(decode).toHaveLength(OUTPUT.length - 1)
    expect(decode[0].step).toBe(1)
    expect(decode[0].kvCacheLength).toBe(PROMPT.length + 1)
    expect(decode[0].sampledToken).toEqual(OUTPUT[1])
  })

  it('excludes the token being sampled from the context that produced it', () => {
    const decode = frames.filter((frame) => frame.phase === 'decode')[0]
    expect(decode.context).toHaveLength(PROMPT.length + 1)
    expect(decode.queryIndex).toBe(decode.context.length - 1)
    expect(decode.context.map((token) => token.text)).not.toContain(OUTPUT[1].text)
  })

  it('settles on a complete frame whose tokens reconstruct the answer', () => {
    const final = frames[frames.length - 1]
    expect(final).toMatchObject({ phase: 'complete', activeStage: null, isComplete: true })
    expect(final.emittedTokens.map((token) => token.text).join('')).toBe('Hi there')
    expect(final.context.filter((token) => token.origin === 'generated')).toHaveLength(
      OUTPUT.length,
    )
  })

  it('handles an empty answer without inventing a generation step', () => {
    const empty = buildForwardPassFrames(PROMPT, [])
    expect(empty.filter((frame) => frame.phase === 'decode')).toHaveLength(0)
    expect(empty[empty.length - 1].emittedTokens).toEqual([])
  })
})

describe('frameDelayMs', () => {
  const frames = buildForwardPassFrames(PROMPT, OUTPUT)

  it('paces prefill stage by stage, faster in decode, and holds at the end', () => {
    const prefill = frames.filter((frame) => frame.phase === 'prefill')
    const decode = frames.filter((frame) => frame.phase === 'decode')[0]
    const attentionStage = prefill.find((frame) => frame.activeStage === 'attention')
    const embedStage = prefill.find((frame) => frame.activeStage === 'embed')

    expect(frameDelayMs(attentionStage!)).toBeGreaterThan(frameDelayMs(embedStage!))
    expect(frameDelayMs(decode)).toBeLessThan(frameDelayMs(embedStage!))
    expect(frameDelayMs(frames[frames.length - 1])).toBe(0)
  })
})
