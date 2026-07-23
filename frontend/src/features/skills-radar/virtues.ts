/** One axis of the engineering-virtues radar: a stance or habit, self-scored 0-10. */
export interface EngineeringVirtue {
  readonly label: string
  readonly axisLabel: string
  readonly rating: number
  readonly caption: string
}

/** The ceiling every axis shares, so the radial grid and the accessible text agree. */
export const VIRTUE_SCALE_MAX = 10

export const ENGINEERING_VIRTUES: readonly EngineeringVirtue[] = [
  {
    label: 'Table football',
    axisLabel: 'Table<br>football',
    rating: 10,
    caption: 'My drug. Self-reported SOTA, reproducible at any bar table, any time.',
  },
  {
    label: 'Chromatic ability',
    axisLabel: 'Chromatic<br>ability',
    rating: 1,
    caption:
      'Red-green deficiency. Failed the army eye exam, got rerouted into engineering. Best hardware limitation I own.',
  },
  {
    label: 'Dragon Ball: Sparking! Zero',
    axisLabel: 'Dragon Ball:<br>Sparking! Zero',
    rating: 9,
    caption: 'Peer-reviewed. Ask Federico for a reference.',
  },
  {
    label: 'Knowing when to stop',
    axisLabel: 'Knowing<br>when to stop',
    rating: 3,
    caption: 'Ask my thesis: eighteen months in the optimization trap. Patched; regressions occur.',
  },
  {
    label: 'Obsession beats talent',
    axisLabel: 'Obsession<br>beats talent',
    rating: 9,
    caption:
    'No innate-talent parameter found at initialization. Compensated with obsession; it compounds.',
  },
  {
    label: 'Doing nothing',
    axisLabel: 'Doing<br>nothing',
    rating: 2,
    caption: 'Tried it once, on a beach. The process kept spawning background jobs.',
  },
  {
    label: 'Seeks a bigger pond',
    axisLabel: 'Seeks a<br>bigger pond',
    rating: 8,
    caption:
      'If I am the smartest person in the room, I change room. The gradient is steeper next to better people.',
  },
  {
    label: 'R tolerance',
    axisLabel: 'R<br>tolerance',
    rating: 1,
    caption: 'I built my girlfriend an entire ML framework so one R installation could be retired.',
  },
  {
    label: 'Knowledge seeker',
    axisLabel: 'Knowledge<br>seeker',
    rating: 10,
    caption:
      'Infinite recursion: every paper answered pushes three more onto the stack. No base case.',
  },
  {
    label: 'Selling myself',
    axisLabel: 'Selling<br>myself',
    rating: 4,
    caption: 'Chronically underfit. This entire website is the fine-tuning run.',
  },
  {
    label: 'Buzzword tolerance',
    axisLabel: 'Buzzword<br>tolerance',
    rating: 1,
    caption:
      '"Passionate about synergy" fails to parse. If there is no number under the claim, it is an opinion.',
  },
]

/** The dry framing line under the chart, kept with the data it describes. */
export const RADAR_CAPTION =
  "Skills a resume can't grep for. Self-assessed, which is statistically the least reliable " +
  'eval in the building.'
