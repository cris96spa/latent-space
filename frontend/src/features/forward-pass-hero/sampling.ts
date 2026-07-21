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
