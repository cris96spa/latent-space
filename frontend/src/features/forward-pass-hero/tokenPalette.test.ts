import { describe, expect, it } from 'vitest'

import { tokenChipClasses, tokenChipStyle } from './tokenPalette'

describe('tokenChipStyle', () => {
  it('cycles the six sweep hues by position', () => {
    expect(tokenChipStyle(0).hueIndex).toBe(0)
    expect(tokenChipStyle(5).hueIndex).toBe(5)
    expect(tokenChipStyle(6).hueIndex).toBe(0)
  })

  // The CVD guarantee: adjacent chips always differ in lightness band, so the boundary
  // is legible even when two hues look identical under red-green colour-vision deficiency.
  it('alternates the lightness band on every step', () => {
    for (let position = 0; position < 20; position++) {
      expect(tokenChipStyle(position).band).not.toBe(tokenChipStyle(position + 1).band)
    }
  })
})

describe('tokenChipClasses', () => {
  it('returns a non-empty class string that includes a dark-mode variant', () => {
    const classes = tokenChipClasses(0)
    expect(classes.length).toBeGreaterThan(0)
    expect(classes).toContain('dark:')
  })

  it('selects a different hue and band for the next position', () => {
    expect(tokenChipClasses(1)).not.toBe(tokenChipClasses(0))
    expect(tokenChipClasses(1)).toContain('sweep-2')
  })
})
