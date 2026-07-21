import { describe, expect, it } from 'vitest'

import { hashUnitInterval } from './hash'

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
