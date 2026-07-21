import { hashUnitInterval } from '../../lib/hash'

/**
 * Chinchilla scaling-law coefficients, from Hoffmann et al. 2022, "Training
 * Compute-Optimal Large Language Models", the parametric fit
 * `L(N, D) = E + A / N^alpha + B / D^beta`. Keeping the published numbers means the
 * curves on the page are a real prediction rather than a shape someone drew.
 */
export const IRREDUCIBLE_LOSS = 1.69
export const PARAMETER_COEFFICIENT = 406.4
export const PARAMETER_EXPONENT = 0.34
export const DATA_COEFFICIENT = 410.7
export const DATA_EXPONENT = 0.28

/** GPT-2's published 124M parameter budget and 50257-entry vocabulary. */
export const MODEL_PARAMETERS = 124e6
export const VOCABULARY_SIZE = 50257

/**
 * A round 10B-token horizon for the simulated sweep, not a claim about GPT-2's
 * training corpus. The GPT-2 paper reports WebText in document count and bytes rather
 * than an exact post-tokenization total, so the chart keeps this choice explicit.
 */
export const TRAINED_TOKENS = 10e9

/** Where the plotted sweep starts. Much earlier and every run sits pinned at the ceiling. */
export const WARMUP_TOKENS = 1e7

const NOISE_AMPLITUDE = 0.035
/**
 * Noise scales with the loss still left to fall, but stops growing past this much
 * headroom: without the cap, the high-loss start of a detuned run gets a half-nat
 * sawtooth that reads as a rendering fault rather than as batch-to-batch variance.
 */
const NOISE_HEADROOM_CAP = 1.2

/**
 * Predicted cross-entropy for a model of `parameterCount` parameters trained on
 * `trainedTokens` tokens, per the Chinchilla parametric fit. Both terms decay as
 * power laws toward the irreducible entropy of the data, `IRREDUCIBLE_LOSS`.
 *
 * `dataPenalty` scales the data term only. A run whose hyperparameters are detuned
 * still converges to the same floor - it just needs proportionally more tokens to get
 * there, which is exactly what multiplying `B` by a constant greater than 1 encodes.
 * That is the one modelling choice here that Hoffmann et al. do not supply.
 */
export function chinchillaLoss(
  parameterCount: number,
  trainedTokens: number,
  dataPenalty = 1,
): number {
  return (
    IRREDUCIBLE_LOSS +
    PARAMETER_COEFFICIENT / parameterCount ** PARAMETER_EXPONENT +
    (DATA_COEFFICIENT * dataPenalty) / trainedTokens ** DATA_EXPONENT
  )
}

/**
 * The loss this model can never train away: the irreducible term plus the penalty for
 * having only `MODEL_PARAMETERS` parameters. The data term vanishes as tokens grow, so
 * this is the horizontal asymptote every run approaches and none of them crosses.
 */
export function asymptoticLoss(parameterCount: number): number {
  return IRREDUCIBLE_LOSS + PARAMETER_COEFFICIENT / parameterCount ** PARAMETER_EXPONENT
}

/**
 * Loss at initialisation: a model with untrained weights puts uniform mass over the
 * vocabulary, so its cross-entropy is `ln(vocabularySize)` — about 10.83 nats for
 * GPT-2's 50257 tokens. No run may be drawn above this ceiling.
 */
export function initialLoss(vocabularySize: number): number {
  return Math.log(vocabularySize)
}

export interface SweepFamily {
  readonly id: string
  readonly label: string
  /** Data penalty at the worst setting of this knob; 1 means "as good as baseline". */
  readonly worstDataPenalty: number
}

/**
 * One band per hyperparameter, swept while the others stay at baseline.
 *
 * The ordering is the only qualitative claim being made, and it is the uncontroversial
 * one: learning rate is the knob a language-model run is most sensitive to, and
 * auxiliary regularisers such as z-loss are the least. Every band starts at a penalty
 * of 1 - a well-set knob costs nothing - so the runs fan upward from a shared floor
 * rather than sitting in arbitrarily stacked lanes.
 */
export const SWEEP_FAMILIES: readonly SweepFamily[] = [
  { id: 'learning-rate', label: 'learning rate', worstDataPenalty: 2.7 },
  { id: 'batch-size', label: 'batch size', worstDataPenalty: 2.15 },
  { id: 'warmup', label: 'warmup', worstDataPenalty: 1.78 },
  { id: 'dropout', label: 'dropout', worstDataPenalty: 1.5 },
  { id: 'weight-decay', label: 'weight decay', worstDataPenalty: 1.3 },
  { id: 'z-loss', label: 'z-loss', worstDataPenalty: 1.14 },
]

export const RUNS_PER_FAMILY = 3

export interface LossSample {
  readonly tokens: number
  readonly loss: number
}

export interface AblationRun {
  readonly familyId: string
  readonly familyIndex: number
  readonly runIndex: number
  readonly dataPenalty: number
  readonly samples: readonly LossSample[]
}

/** Deterministic wobble in `[-1, 1)` from a stable string seed. */
function jitter(seed: string): number {
  return hashUnitInterval(seed) * 2 - 1
}

/**
 * Log-spaced samples of one run, from `WARMUP_TOKENS` to `TRAINED_TOKENS`.
 *
 * Each point is the scaling-law prediction for this run's data penalty, clamped to the
 * untrained ceiling, plus a deterministic wobble scaled by the distance still left to
 * fall - noisy early where batches disagree, quiet late where the curve has flattened.
 * The wobble is cosmetic; the trend is the published fit.
 */
export function sampleRun(dataPenalty: number, seed: string, sampleCount: number): LossSample[] {
  const ceiling = initialLoss(VOCABULARY_SIZE)
  const logStart = Math.log10(WARMUP_TOKENS)
  const logEnd = Math.log10(TRAINED_TOKENS)
  const floor = asymptoticLoss(MODEL_PARAMETERS)

  return Array.from({ length: sampleCount }, (_, index) => {
    const progress = index / (sampleCount - 1)
    const tokens = 10 ** (logStart + progress * (logEnd - logStart))
    const predicted = Math.min(ceiling, chinchillaLoss(MODEL_PARAMETERS, tokens, dataPenalty))
    const headroom = Math.min(NOISE_HEADROOM_CAP, Math.max(0, predicted - floor))
    const wobble = jitter(`${seed}:${index}`) * NOISE_AMPLITUDE * headroom
    return { tokens, loss: Math.min(ceiling, predicted + wobble) }
  })
}

/**
 * The whole sweep: `RUNS_PER_FAMILY` runs for each knob in `SWEEP_FAMILIES`, spaced
 * evenly from a baseline penalty of 1 up to that knob's worst setting.
 */
export function sampleAblationSweep(sampleCount: number): AblationRun[] {
  return SWEEP_FAMILIES.flatMap((family, familyIndex) =>
    Array.from({ length: RUNS_PER_FAMILY }, (_, runIndex) => {
      const severity = runIndex / (RUNS_PER_FAMILY - 1)
      const dataPenalty = 1 + severity * (family.worstDataPenalty - 1)
      return {
        familyId: family.id,
        familyIndex,
        runIndex,
        dataPenalty,
        samples: sampleRun(dataPenalty, `${family.id}:${runIndex}`, sampleCount),
      }
    }),
  )
}
