const FNV_OFFSET_BASIS = 2166136261
const FNV_PRIME = 16777619
const UINT32_RANGE = 2 ** 32

/**
 * FNV-1a over the seed's UTF-16 code units, mapped into `[0, 1)`.
 *
 * The scripted visuals need values that look sampled but are identical on every
 * replay, every reload, and in server-rendered output, so they derive them from
 * stable string seeds instead of `Math.random`. For ASCII seeds - all the callers
 * feed it - the result matches the standard 32-bit FNV-1a test vectors.
 */
export function hashUnitInterval(seed: string): number {
  let hash = FNV_OFFSET_BASIS
  for (let position = 0; position < seed.length; position++) {
    hash ^= seed.charCodeAt(position)
    hash = Math.imul(hash, FNV_PRIME)
  }
  return (hash >>> 0) / UINT32_RANGE
}
