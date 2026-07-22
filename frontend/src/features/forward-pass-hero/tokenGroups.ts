import type { Token } from './types'

/** One or more consecutive tokens that render as a single grapheme cluster. */
export interface TokenGroup {
  readonly tokens: readonly Token[]
  readonly text: string
}

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

/**
 * Group tokens so a grapheme cluster split across several byte-level tokens (an emoji)
 * renders as one chip, while ordinary word-piece tokens stay one chip each.
 *
 * Tokens accumulate until the running character count lands on a grapheme boundary of
 * the joined text; each such run is one group. Empty-text continuation tokens advance
 * no characters, so they fold into the group of the character whose bytes they complete.
 */
export function groupTokensByGrapheme(tokens: readonly Token[]): TokenGroup[] {
  const fullText = tokens.map((token) => token.text).join('')
  const characters = [...fullText]

  const graphemeBoundaries = new Set<number>()
  let characterCount = 0
  for (const { segment } of graphemeSegmenter.segment(fullText)) {
    characterCount += [...segment].length
    graphemeBoundaries.add(characterCount)
  }

  const groups: TokenGroup[] = []
  let buffer: Token[] = []
  let groupStart = 0
  let position = 0
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    buffer.push(token)
    position += [...token.text].length
    // An empty-text next token holds continuation bytes of this grapheme's last
    // character, so keep it in the current group instead of flushing between them.
    // Without this guard, a single-codepoint emoji [glyph, "", ""] would split into a
    // glyph group plus phantom empty groups.
    const nextIsContinuation = index + 1 < tokens.length && tokens[index + 1].text === ''
    if (graphemeBoundaries.has(position) && !nextIsContinuation) {
      groups.push({ tokens: buffer, text: characters.slice(groupStart, position).join('') })
      buffer = []
      groupStart = position
    }
  }
  if (buffer.length > 0) {
    // Defensive: well-formed lossless input always ends on a grapheme boundary and flushes
    // in-loop, but a malformed/partial token stream is still emitted rather than dropped.
    groups.push({ tokens: buffer, text: characters.slice(groupStart).join('') })
  }
  return groups
}
