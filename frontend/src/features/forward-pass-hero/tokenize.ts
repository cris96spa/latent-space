/** GPT-2's byte-level BPE pretokenizer pattern, transcribed from its tokenizer. */
const GPT2_PRETOKEN_PATTERN =
  /'(?:s|t|re|ve|m|ll|d)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu

/**
 * Split text the way GPT-2 does before byte-level BPE runs.
 *
 * This is the real pretokenizer - the regex that decides where token boundaries may
 * fall - so leading spaces stay attached to words and numbers, contractions (`'s`,
 * `'ll`) break off, and punctuation clusters stand alone. It is lossless:
 * `pretokenizeText(text).join('') === text`.
 *
 * What it is not is the full tokenizer: the byte encoder and BPE merges over GPT-2's
 * 50257-entry vocabulary are not shipped to the browser, so one pretoken can still
 * represent several model tokens. The diagram labels these authored chunks honestly
 * rather than claiming exact BPE boundaries.
 */
export function pretokenizeText(text: string): string[] {
  return text.match(GPT2_PRETOKEN_PATTERN) ?? []
}
