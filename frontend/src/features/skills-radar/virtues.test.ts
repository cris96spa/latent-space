import { describe, expect, it } from 'vitest'

import { ENGINEERING_VIRTUES, VIRTUE_SCALE_MAX } from './virtues'

describe('ENGINEERING_VIRTUES', () => {
  it('scores every axis as an integer within the shared 0-max scale', () => {
    for (const virtue of ENGINEERING_VIRTUES) {
      expect(Number.isInteger(virtue.rating)).toBe(true)
      expect(virtue.rating).toBeGreaterThanOrEqual(0)
      expect(virtue.rating).toBeLessThanOrEqual(VIRTUE_SCALE_MAX)
    }
  })

  it('keeps the wrapped axis label in sync with the accessible label', () => {
    // The chart shows `axisLabel` (with `<br>` breaks) while the screen-reader list reads
    // `label`; unwrapping the former must reproduce the latter, so the two never drift.
    for (const virtue of ENGINEERING_VIRTUES) {
      expect(virtue.axisLabel.replaceAll('<br>', ' ')).toBe(virtue.label)
    }
  })

  it('labels each axis uniquely and non-emptily', () => {
    const labels = ENGINEERING_VIRTUES.map((virtue) => virtue.label)
    expect(new Set(labels).size).toBe(labels.length)
    for (const virtue of ENGINEERING_VIRTUES) {
      expect(virtue.label.length).toBeGreaterThan(0)
      expect(virtue.caption.length).toBeGreaterThan(0)
    }
  })
})
