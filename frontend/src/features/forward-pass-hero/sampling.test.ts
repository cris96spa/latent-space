import { describe, expect, it } from 'vitest'

import { argmax, hashUnitInterval, softmax } from './sampling'

describe('softmax', () => {
  it('matches a hand-computed distribution', () => {
    // e^0, e^-1, e^-2 over their sum (1.5032148): 0.665241, 0.244728, 0.090031.
    const probabilities = softmax([2, 1, 0])
    expect(probabilities[0]).toBeCloseTo(0.665241, 5)
    expect(probabilities[1]).toBeCloseTo(0.244728, 5)
    expect(probabilities[2]).toBeCloseTo(0.090031, 5)
  })

  it('sums to 1 and is invariant to a constant shift', () => {
    const shifted = softmax([5, 4, 3])
    const base = softmax([2, 1, 0])
    const total = shifted.reduce((sum, probability) => sum + probability, 0)
    expect(total).toBeCloseTo(1, 10)
    shifted.forEach((probability, index) => expect(probability).toBeCloseTo(base[index], 10))
  })

  it('returns an empty distribution for empty input', () => {
    expect(softmax([])).toEqual([])
  })
})

describe('argmax', () => {
  it('returns the index of the largest value', () => {
    expect(argmax([0.1, 0.9, 0.3])).toBe(1)
  })

  it('resolves ties to the first index and handles empty input', () => {
    expect(argmax([0.5, 0.5])).toBe(0)
    expect(argmax([])).toBe(-1)
  })
})

describe('hashUnitInterval', () => {
  it('matches the published 32-bit FNV-1a test vectors', () => {
    expect(hashUnitInterval('')).toBeCloseTo(0x811c9dc5 / 2 ** 32, 12)
    expect(hashUnitInterval('a')).toBeCloseTo(0xe40c292c / 2 ** 32, 12)
    expect(hashUnitInterval('foobar')).toBeCloseTo(0xbf9cf968 / 2 ** 32, 12)
  })

  it('stays inside [0, 1) and is stable across calls', () => {
    const seeds = ['logit:0:0', 'mlp:7:3', 'head:2:41', 'vocab:88']
    seeds.forEach((seed) => {
      const value = hashUnitInterval(seed)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
      expect(hashUnitInterval(seed)).toBe(value)
    })
  })

  it('separates seeds that differ only in their last character', () => {
    expect(hashUnitInterval('logit:0:0')).not.toBe(hashUnitInterval('logit:0:1'))
  })
})
