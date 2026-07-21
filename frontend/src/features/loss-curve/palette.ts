/**
 * The ablation sweep's line colours, one per `SWEEP_FAMILIES` entry, in order. These
 * mirror the `--color-sweep-*` design tokens in `index.css`, kept as literals here
 * because Plotly draws to its own canvas and cannot consume Tailwind classes - and
 * because Tailwind tree-shakes those tokens out of the compiled CSS once no utility
 * references them. The hues are theme-independent; the plot's axes and text follow the
 * active theme through CSS variables instead.
 */
export const SWEEP_COLORS: readonly string[] = [
  '#0ea5e9', // learning rate
  '#14b8a6', // batch size
  '#84cc16', // warmup
  '#f59e0b', // dropout
  '#f43f5e', // weight decay
  '#a855f7', // z-loss
]
