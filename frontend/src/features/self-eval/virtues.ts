/** Whether high is the aspirational end of an axis (`positive`) or the low, self-deprecating end (`negative`). */
export type VirtuePolarity = 'positive' | 'negative'

/** One axis of the engineering-virtues radar: a stance or habit, self-scored 0-10. */
export interface EngineeringVirtue {
  readonly label: string
  readonly axisLabel: string
  readonly rating: number
  readonly caption: string
  readonly polarity: VirtuePolarity
}

/** The ceiling every axis shares, so the radial grid and the accessible text agree. */
export const VIRTUE_SCALE_MAX = 10

export const ENGINEERING_VIRTUES: readonly EngineeringVirtue[] = [
  {
    label: 'Table football',
    axisLabel: 'Table<br>football',
    rating: 10,
    caption: 'My drug. Self-reported SOTA, reproducible at any bar table, any time.',
    polarity: 'positive',
  },
  {
    label: 'Chromatic ability',
    axisLabel: 'Chromatic<br>ability',
    rating: 1,
    caption:
      'Red-green deficiency. Failed the army eye exam, got rerouted into engineering. Best hardware limitation I own.',
    polarity: 'negative',
  },
  {
    label: 'Dragon Ball: Sparking! Zero',
    axisLabel: 'Dragon Ball:<br>Sparking! Zero',
    rating: 9,
    caption: 'Peer-reviewed. Ask Federico for a reference.',
    polarity: 'positive',
  },
  {
    label: 'Knowing when to stop',
    axisLabel: 'Knowing<br>when to stop',
    rating: 3,
    caption: 'Ask my thesis: eighteen months in the optimization trap. Patched; regressions occur.',
    polarity: 'negative',
  },
  {
    label: 'Obsession beats talent',
    axisLabel: 'Obsession<br>beats talent',
    rating: 9,
    caption:
      'No innate-talent parameter found at initialization. Compensated with obsession; it compounds.',
    polarity: 'positive',
  },
  {
    label: 'Doing nothing',
    axisLabel: 'Doing<br>nothing',
    rating: 2,
    caption: 'Tried it once, on a beach. The process kept spawning background jobs.',
    polarity: 'negative',
  },
  {
    label: 'Seeks a bigger pond',
    axisLabel: 'Seeks a<br>bigger pond',
    rating: 8,
    caption:
      'If I am the smartest person in the room, I change room. The gradient is steeper next to better people.',
    polarity: 'positive',
  },
  {
    label: 'R tolerance',
    axisLabel: 'R<br>tolerance',
    rating: 1,
    caption: 'I built my girlfriend an entire ML framework so one R installation could be retired.',
    polarity: 'negative',
  },
  {
    label: 'Knowledge seeker',
    axisLabel: 'Knowledge<br>seeker',
    rating: 10,
    caption:
      'Infinite recursion: every paper answered pushes three more onto the stack. No base case.',
    polarity: 'positive',
  },
  {
    label: 'Selling myself',
    axisLabel: 'Selling<br>myself',
    rating: 4,
    caption: 'Chronically underfit. This entire website is the fine-tuning run.',
    polarity: 'negative',
  },
  {
    label: 'Buzzword tolerance',
    axisLabel: 'Buzzword<br>tolerance',
    rating: 1,
    caption:
      '"Passionate about synergy" fails to parse. If there is no number under the claim, it is an opinion.',
    polarity: 'negative',
  },
  {
    label: 'Gym bro',
    axisLabel: 'Gym<br>bro',
    rating: 6,
    caption: 'Peak shape is in an old checkpoint. Training has resumed - warm restart, higher peak.',
    polarity: 'positive',
  },
]

/** The framing line under the strengths radar: the axes I lean into. */
export const STRENGTHS_CAPTION =
  'The axes I lean into, self-scored 0-10 on a training set of one. Overfitting is the point.'

/** The framing line under the quirks radar: the axes I lean away from, on an inverted scale. */
export const QUIRKS_CAPTION =
  'The axes I lean away from, plotted inverted - the worse the score, the closer to the rim. ' +
  'A 1/10 this stable has earned the full radius.'
