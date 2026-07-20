/**
 * Llama 3's pretokenizer pattern, transcribed from the released tokenizer config.
 *
 * JavaScript has no inline flag groups, so the case-insensitive contraction
 * alternation `(?i:'s|'t|'re|'ve|'m|'ll|'d)` is spelled out by hand; everything else
 * is the pattern verbatim. The trailing `\s+` and the `\s+(?!\S)` before it are what
 * make the split lossless.
 */
const LLAMA3_PRETOKEN_PATTERN =
  /'(?:[sStTmMdD]|[rR][eE]|[vV][eE]|[lL][lL])|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}{1,3}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+/gu

/**
 * Split text the way Llama 3 does before BPE runs.
 *
 * This is the real pretokenizer — the regex that decides where token boundaries may
 * fall — so leading spaces stay attached to their word, contractions (`'s`, `'ll`)
 * break off, digits group in runs of at most three, and punctuation clusters stand
 * alone. It is lossless: `pretokenizeText(text).join('') === text`.
 *
 * What it is not is the full tokenizer: BPE merges over the 128256-entry vocabulary
 * are not shipped to the browser, so a rare word that the real tokenizer would break
 * into several subwords stays whole here. Common English words, which are single
 * tokens in that vocabulary, come out exactly right.
 */
export function pretokenizeText(text: string): string[] {
  return text.match(LLAMA3_PRETOKEN_PATTERN) ?? []
}
