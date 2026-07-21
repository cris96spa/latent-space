/**
 * The model the hero draws: the original 124M-parameter GPT-2 configuration.
 *
 * The animation is scripted, but the shape it draws is not invented. Its 12 blocks,
 * 12-head attention, 768 → 3072 GELU feed-forward, LayerNorm, learned position
 * embeddings, 50257-entry vocabulary, and 1024-token context can all be checked
 * against the public model configuration. GPT-2 leaves `n_inner` unset; Transformers
 * therefore uses the published implementation's 4 × hidden-size default, 3072.
 */
export const TARGET_MODEL = {
  label: 'gpt-2 · 124m',
  blockCount: 12,
  queryHeadCount: 12,
  keyValueHeadCount: 12,
  hiddenSize: 768,
  feedForwardSize: 3072,
  vocabularySize: 50257,
  contextLength: 1024,
  normalization: 'layernorm',
  positionalEncoding: 'learned absolute',
  feedForwardActivation: 'gelu_new',
} as const

/** How many of the 12 attention heads the diagram has room to draw. */
export const DRAWN_HEAD_COUNT = 4
