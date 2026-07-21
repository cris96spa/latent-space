/** One axis of the engineering-virtues radar: a stance or habit, self-scored 0-10. */
export interface EngineeringVirtue {
  /** Clean one-line label for the accessible list and the hover heading. */
  readonly label: string
  /** The label wrapped with `<br>` so the polar ticks read as two tidy lines. */
  readonly axisLabel: string
  /** Self-assessment on the shared 0-`VIRTUE_SCALE_MAX` scale; higher is better. */
  readonly rating: number
  /** One-beat aside revealed on hover and read out in the accessible list. */
  readonly caption: string
}

/** The ceiling every axis shares, so the radial grid and the accessible text agree. */
export const VIRTUE_SCALE_MAX = 10

/**
 * Self-assessed engineering virtues - temperament and taste, not benchmarked skills. These
 * are Cristian's own calibration of how he works; the two deliberately lower scores are
 * vices of taste (over-polishing, the Rust urge), never gaps in competence. Colocated as
 * typed config the way `VOCABULARY_TOKENS` is: authored values kept close to the one view
 * that renders them, and honestly flagged as opinion rather than measurement.
 */
export const ENGINEERING_VIRTUES: readonly EngineeringVirtue[] = [
  {
    label: 'Reads the paper, not the thread',
    axisLabel: 'Reads the<br>paper, not<br>the thread',
    rating: 8,
    caption: 'The arXiv PDF before the quote-tweet. The ablation table is where the truth hides.',
  },
  {
    label: 'Trusts the loss over the vibe',
    axisLabel: 'Trusts the<br>loss over<br>the vibe',
    rating: 9,
    caption:
      'When the curve disagrees with my intuition, the curve wins and I go debug the intuition.',
  },
  {
    label: 'Deletes code without grieving',
    axisLabel: 'Deletes code<br>without grieving',
    rating: 7,
    caption: 'The best pull request is a red one.',
  },
  {
    label: 'Reproducible by Friday',
    axisLabel: 'Reproducible<br>by Friday',
    rating: 8,
    caption: "Seed pinned, config committed, or it didn't happen.",
  },
  {
    label: "Ships before it's perfect",
    axisLabel: "Ships before<br>it's perfect",
    rating: 6,
    caption: 'Perfect is a checkpoint I never reach. Good is one I can actually serve.',
  },
  {
    label: 'Resists rewriting it in Rust',
    axisLabel: 'Resists<br>rewriting<br>it in Rust',
    rating: 4,
    caption: 'Deliberately low. The urge is constant; the borrow checker is patient.',
  },
  {
    label: 'CUDA-error composure',
    axisLabel: 'CUDA-error<br>composure',
    rating: 7,
    caption: 'Reads `device-side assert triggered` without flipping the desk. Most days.',
  },
  {
    label: 'Sniffs out hand-waving',
    axisLabel: 'Sniffs out<br>hand-waving',
    rating: 9,
    caption:
      'A high-recall detector for hype. "It just works" is a claim, not an eval; show me the benchmark table.',
  },
]

/** The dry framing line under the chart, kept with the data it describes. */
export const RADAR_CAPTION =
  "Skills a resume can't grep for. Self-assessed, which is statistically the least reliable " +
  'eval in the building.'
