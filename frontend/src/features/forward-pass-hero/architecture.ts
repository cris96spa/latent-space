/**
 * The model the hero draws: Meta's Llama 3 8B, as published in its released config.
 *
 * The animation is scripted, but the shape it draws should not be invented — every
 * number here is the real architecture, so the diagram's labels (32 blocks, grouped
 * query attention with 8 KV heads, a SwiGLU feed-forward that widens 4096 → 14336,
 * RMSNorm, RoPE, a 128256-entry vocabulary) can be checked against the model card
 * rather than taken on faith.
 */
export const TARGET_MODEL = {
  label: 'llama-3-8b',
  blockCount: 32,
  queryHeadCount: 32,
  keyValueHeadCount: 8,
  hiddenSize: 4096,
  feedForwardSize: 14336,
  vocabularySize: 128256,
  contextLength: 8192,
  normalization: 'rmsnorm',
  positionalEncoding: 'rope',
  feedForwardActivation: 'swiglu',
} as const

/** How many of the 32 query heads the diagram has room to draw. */
export const DRAWN_HEAD_COUNT = 4
