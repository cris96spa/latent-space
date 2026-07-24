import { VIRTUE_SCALE_MAX, type EngineeringVirtue, type VirtuePolarity } from './virtues'

/**
 * The score a virtue contributes on a signed axis. A positive virtue keeps its raw score;
 * a negative one is scaled by its distance from a perfect ten (`VIRTUE_SCALE_MAX - rating`)
 * and turns negative, so a proud 1/10 reads as a strong lean rather than a stub.
 */
export function divergingValue(virtue: EngineeringVirtue): number {
  return virtue.polarity === 'positive' ? virtue.rating : -(VIRTUE_SCALE_MAX - virtue.rating)
}

/** One radar spoke: the virtue plus the radius it reaches, in the shared 0-`VIRTUE_SCALE_MAX` unit. */
export interface RadarAxis {
  readonly label: string
  readonly axisLabel: string
  readonly rating: number
  readonly caption: string
  readonly polarity: VirtuePolarity
  /** `|divergingValue|`: a positive spoke reaches its score, a negative one its distance from ten. */
  readonly magnitude: number
}

/** The virtues grouped for the split radar: positives first, negatives second. */
export interface SplitRadarAxes {
  readonly positives: readonly RadarAxis[]
  readonly negatives: readonly RadarAxis[]
  /** `[...positives, ...negatives]`, so each trace fills one contiguous arc of the circle. */
  readonly ordered: readonly RadarAxis[]
}

function toRadarAxis(virtue: EngineeringVirtue): RadarAxis {
  return {
    label: virtue.label,
    axisLabel: virtue.axisLabel,
    rating: virtue.rating,
    caption: virtue.caption,
    polarity: virtue.polarity,
    magnitude: Math.abs(divergingValue(virtue)),
  }
}

/**
 * Splits the virtues into a strengths arc and a quirks arc for the two-trace radar. Grouping
 * keeps each polarity contiguous so its trace fans over one side of the circle instead of
 * criss-crossing the centre.
 */
export function splitRadarAxes(virtues: readonly EngineeringVirtue[]): SplitRadarAxes {
  const positives = virtues.filter((virtue) => virtue.polarity === 'positive').map(toRadarAxis)
  const negatives = virtues.filter((virtue) => virtue.polarity === 'negative').map(toRadarAxis)
  return { positives, negatives, ordered: [...positives, ...negatives] }
}
