import { describe, expect, it } from 'vitest'

import { divergingValue, splitRadarAxes } from './split'
import { ENGINEERING_VIRTUES, VIRTUE_SCALE_MAX, type EngineeringVirtue } from './virtues'

const virtue = (over: Partial<EngineeringVirtue>): EngineeringVirtue => ({
  label: 'x',
  axisLabel: 'x',
  rating: 5,
  caption: 'c',
  polarity: 'positive',
  ...over,
})

describe('divergingValue', () => {
  it('keeps a positive score as its own signed height', () => {
    expect(divergingValue(virtue({ rating: 9, polarity: 'positive' }))).toBe(9)
    expect(divergingValue(virtue({ rating: 10, polarity: 'positive' }))).toBe(10)
  })

  it('scales a negative score by its distance from a perfect ten, pointing down', () => {
    // A proud 1/10 leans hard: 10 - 1 = 9 of magnitude, on the negative side.
    expect(divergingValue(virtue({ rating: 1, polarity: 'negative' }))).toBe(-(VIRTUE_SCALE_MAX - 1))
    expect(divergingValue(virtue({ rating: 4, polarity: 'negative' }))).toBe(-6)
  })
})

describe('splitRadarAxes', () => {
  it('groups every positive axis before every negative one, losing none', () => {
    const { positives, negatives, ordered } = splitRadarAxes(ENGINEERING_VIRTUES)
    expect(positives.every((axis) => axis.polarity === 'positive')).toBe(true)
    expect(negatives.every((axis) => axis.polarity === 'negative')).toBe(true)
    expect(positives.length).toBeGreaterThan(0)
    expect(negatives.length).toBeGreaterThan(0)
    expect(positives.length + negatives.length).toBe(ENGINEERING_VIRTUES.length)
    expect(ordered).toEqual([...positives, ...negatives])
  })

  it('plots positives at their score and negatives at their distance from a perfect ten', () => {
    const { ordered } = splitRadarAxes(ENGINEERING_VIRTUES)
    for (const axis of ordered) {
      const expected =
        axis.polarity === 'positive' ? axis.rating : VIRTUE_SCALE_MAX - axis.rating
      expect(axis.magnitude).toBe(expected)
      expect(axis.magnitude).toBeGreaterThanOrEqual(0)
      expect(axis.magnitude).toBeLessThanOrEqual(VIRTUE_SCALE_MAX)
    }
  })
})
