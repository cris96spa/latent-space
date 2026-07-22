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
  for (const token of tokens) {
    buffer.push(token)
    position += [...token.text].length
    if (graphemeBoundaries.has(position)) {
      groups.push({ tokens: buffer, text: characters.slice(groupStart, position).join('') })
      buffer = []
      groupStart = position
    }
  }
  if (buffer.length > 0) {
    groups.push({ tokens: buffer, text: characters.slice(groupStart).join('') })
  }
  return groups
}
