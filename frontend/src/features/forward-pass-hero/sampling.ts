/**
 * Numerically stable softmax: subtract the max logit before exponentiating so
 * large logits do not overflow. Returns a probability distribution that sums to 1
 * (empty in, empty out). This is the sampling math the logits stage and the
 * attention weights are both computed from.
 */
export function softmax(logits: readonly number[]): number[] {
  if (logits.length === 0) {
    return []
  }
  const maxLogit = Math.max(...logits)
  const weights = logits.map((logit) => Math.exp(logit - maxLogit))
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  return weights.map((weight) => weight / total)
}

const FNV_OFFSET_BASIS = 2166136261
const FNV_PRIME = 16777619
const UINT32_RANGE = 2 ** 32

/**
 * FNV-1a over the seed's UTF-16 code units, mapped into `[0, 1)`.
 *
 * The scripted forward pass needs values that look sampled but are identical on
 * every replay, every reload, and in server-rendered output, so it derives them
 * from stable string seeds instead of `Math.random`. For ASCII seeds - all this
 * module feeds it - the result matches the standard 32-bit FNV-1a test vectors.
 */
export function hashUnitInterval(seed: string): number {
  let hash = FNV_OFFSET_BASIS
  for (let position = 0; position < seed.length; position++) {
    hash ^= seed.charCodeAt(position)
    hash = Math.imul(hash, FNV_PRIME)
  }
  return (hash >>> 0) / UINT32_RANGE
}

/** Index of the largest value, or -1 for an empty input. Ties resolve to the first. */
export function argmax(values: readonly number[]): number {
  let bestIndex = -1
  let bestValue = Number.NEGATIVE_INFINITY
  values.forEach((value, index) => {
    if (value > bestValue) {
      bestValue = value
      bestIndex = index
    }
  })
  return bestIndex
}
