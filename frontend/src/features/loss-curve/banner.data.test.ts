import { describe, expect, it } from 'vitest'

import { BANNER_CATEGORIES, BANNER_RUNS, BANNER_VIEW } from './banner.data'

describe('BANNER_RUNS', () => {
  it('carries the nine legend categories, uniquely keyed', () => {
    expect(BANNER_CATEGORIES).toHaveLength(9)
    const keys = BANNER_CATEGORIES.map((category) => category.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const category of BANNER_CATEGORIES) {
      expect(category.label.length).toBeGreaterThan(0)
    }
  })

  it('keys every run to a known category and names it', () => {
    const keys = new Set(BANNER_CATEGORIES.map((category) => category.key))
    expect(BANNER_RUNS.length).toBeGreaterThanOrEqual(20)
    for (const run of BANNER_RUNS) {
      expect(keys.has(run.category)).toBe(true)
      expect(run.run.length).toBeGreaterThan(0)
    }
  })

  it('keeps every polyline point inside the declared viewBox', () => {
    for (const run of BANNER_RUNS) {
      const pairs = run.points.split(' ')
      expect(pairs.length).toBeGreaterThanOrEqual(2)
      for (const pair of pairs) {
        const [x, y] = pair.split(',').map(Number)
        expect(Number.isFinite(x)).toBe(true)
        expect(Number.isFinite(y)).toBe(true)
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(BANNER_VIEW.width)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(BANNER_VIEW.height)
      }
    }
  })
})
