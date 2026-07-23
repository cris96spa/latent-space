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
 * Self-assessed traits - temperament, not benchmarked skills. Sourced from Cristian's own
 * narrative interview, so each axis is something he actually said about himself. The low
 * scores are either physiology (colour vision) or vices he openly owns (stopping,
 * self-marketing); none of them are gaps in engineering competence. Colocated as typed
 * config the way `VOCABULARY_TOKENS` is: authored values kept close to the one view that
 * renders them, and honestly flagged as opinion rather than measurement.
 */
export const ENGINEERING_VIRTUES: readonly EngineeringVirtue[] = [
  {
    label: 'Table football',
    axisLabel: 'Table<br>football',
    rating: 10,
    caption: 'My drug. Self-reported SOTA, reproducible at any bar table, any time.',
  },
  {
    label: 'Dragon Ball: Sparking! Zero',
    axisLabel: 'Dragon Ball:<br>Sparking! Zero',
    rating: 9,
    caption: 'Peer-reviewed. Ask Federico for a reference.',
  },
  {
    label: 'Obsession beats talent',
    axisLabel: 'Obsession<br>beats talent',
    rating: 9,
    caption:
      'No innate-talent parameter found at initialization. Compensated with obsession; it compounds.',
  },
  {
    label: 'Seeks a bigger pond',
    axisLabel: 'Seeks a<br>bigger pond',
    rating: 8,
    caption:
      'If I am the smartest person in the room, I change room. The gradient is steeper next to better people.',
  },
  {
    label: 'Selling myself',
    axisLabel: 'Selling<br>myself',
    rating: 4,
    caption: 'Chronically underfit. This entire website is the fine-tuning run.',
  },
  {
    label: 'Knowing when to stop',
    axisLabel: 'Knowing<br>when to stop',
    rating: 3,
    caption: 'Ask my thesis: eighteen months in the optimization trap. Patched; regressions occur.',
  },
  {
    label: 'Buzzword tolerance',
    axisLabel: 'Buzzword<br>tolerance',
    rating: 1,
    caption:
      '"Passionate about synergy" fails to parse. If there is no number under the claim, it is an opinion.',
  },
  {
    label: 'Chromatic ability',
    axisLabel: 'Chromatic<br>ability',
    rating: 1,
    caption:
      'Red-green deficiency. Failed the army eye exam, got rerouted into engineering. Best hardware limitation I own.',
  },
]

/** The dry framing line under the chart, kept with the data it describes. */
export const RADAR_CAPTION =
  "Skills a resume can't grep for. Self-assessed, which is statistically the least reliable " +
  'eval in the building.'
