/**
 * One entry per sweep family, in the same order as `SWEEP_FAMILIES`: the stroke for
 * its runs in the chart, and the swatch for its legend chip. They live apart from the
 * components so both can read the same mapping without breaking fast refresh.
 */
export const SWEEP_STROKES: readonly string[] = [
  'stroke-sweep-1',
  'stroke-sweep-2',
  'stroke-sweep-3',
  'stroke-sweep-4',
  'stroke-sweep-5',
  'stroke-sweep-6',
]

export const SWEEP_SWATCHES: readonly string[] = [
  'bg-sweep-1',
  'bg-sweep-2',
  'bg-sweep-3',
  'bg-sweep-4',
  'bg-sweep-5',
  'bg-sweep-6',
]
