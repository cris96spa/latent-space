const SWEEP_HUE_COUNT = 6

export interface TokenChipStyle {
  /** 0..5, selecting the `sweep-1..6` hue. Pure decoration; carries no meaning. */
  readonly hueIndex: number
  /** Lightness band. Alternates every position so neighbours always differ in lightness. */
  readonly band: 'light' | 'dark'
}

/**
 * The colour of the token at `position`. Hue cycles the six `sweep` series for variety,
 * but the lightness band is the load-bearing, CVD-safe boundary cue: it flips on every
 * step, so adjacent chips are always separable by lightness, never by hue alone. The
 * colours mark token boundaries only and carry no meaning.
 */
export function tokenChipStyle(position: number): TokenChipStyle {
  return {
    hueIndex: position % SWEEP_HUE_COUNT,
    band: position % 2 === 0 ? 'light' : 'dark',
  }
}

// Literal Tailwind class strings (the scanner needs them whole). Light band uses a low
// alpha, dark band a stronger one, so the two bands read apart in both themes; dark-mode
// alphas are lower, where the same wash over a near-black panel reads hotter.
const LIGHT_BAND_CLASSES: readonly string[] = [
  'bg-sweep-1/15 dark:bg-sweep-1/25',
  'bg-sweep-2/15 dark:bg-sweep-2/25',
  'bg-sweep-3/15 dark:bg-sweep-3/25',
  'bg-sweep-4/15 dark:bg-sweep-4/25',
  'bg-sweep-5/15 dark:bg-sweep-5/25',
  'bg-sweep-6/15 dark:bg-sweep-6/25',
]

const DARK_BAND_CLASSES: readonly string[] = [
  'bg-sweep-1/40 dark:bg-sweep-1/45',
  'bg-sweep-2/40 dark:bg-sweep-2/45',
  'bg-sweep-3/40 dark:bg-sweep-3/45',
  'bg-sweep-4/40 dark:bg-sweep-4/45',
  'bg-sweep-5/40 dark:bg-sweep-5/45',
  'bg-sweep-6/40 dark:bg-sweep-6/45',
]

/** Tailwind background classes for the token at `position`, from `tokenChipStyle`. */
export function tokenChipClasses(position: number): string {
  const style = tokenChipStyle(position)
  const bands = style.band === 'light' ? LIGHT_BAND_CLASSES : DARK_BAND_CLASSES
  return bands[style.hueIndex]
}
