/** The class every wrapped word carries, so the reveal effect and CSS can find them. */
export const WORD_CLASS = 'ls-word'

export interface WrappedAnswer {
  /** The input HTML with each word in a text node wrapped in a `WORD_CLASS` span. */
  readonly html: string
  /** How many word spans were produced; the reveal player walks 0 → this. */
  readonly wordCount: number
}

// Matches an HTML tag (`<strong>`, `</li>`, …). The answer HTML is nh3-sanitized
// server-side, so any literal `<`/`>` in text is already an entity - a tag here is
// always a real element boundary, never stray text.
const TAG_PATTERN = /<[^>]+>/g
// Splits a text run into alternating word (non-space) and whitespace tokens, keeping
// the whitespace so line breaks between words survive.
const WORD_OR_SPACE_PATTERN = /\S+|\s+/g

/**
 * Wraps each word of an answer's sanitized HTML in a span so it can be revealed one
 * word at a time, leaving tag structure (`<ul>`, `<li>`, `<strong>`) untouched.
 *
 * Implemented as a tag-aware string scan rather than `DOMParser`, so it runs in the
 * Node test environment and during SSR without a DOM. Words are wrapped, never
 * decoded, so entities inside a word (`it&#x27;s`) pass through and render correctly.
 */
export function wrapWordsInHtml(html: string): WrappedAnswer {
  let wordCount = 0
  let cursor = 0
  let result = ''

  TAG_PATTERN.lastIndex = 0
  for (let tag = TAG_PATTERN.exec(html); tag !== null; tag = TAG_PATTERN.exec(html)) {
    result += wrapTextRun(html.slice(cursor, tag.index), () => wordCount++)
    result += tag[0]
    cursor = tag.index + tag[0].length
  }
  result += wrapTextRun(html.slice(cursor), () => wordCount++)

  return { html: result, wordCount }
}

/** Wraps every whitespace-delimited word in a text run, preserving the whitespace. */
function wrapTextRun(text: string, nextIndex: () => number): string {
  if (text.length === 0) {
    return ''
  }
  return text.replace(WORD_OR_SPACE_PATTERN, (token) => {
    if (/^\s+$/.test(token)) {
      return token
    }
    return `<span class="${WORD_CLASS}" data-word-index="${nextIndex()}">${token}</span>`
  })
}

// The only entities the Markdown (commonmark, html=false) + nh3 pipeline emits into
// answer text. Authored `&` is escaped to `&amp;`, so no author-written entity survives;
// dashes, quotes, apostrophes, and ellipses all arrive as literal Unicode and need no
// decoding. Decoded here so the sr-only copy a screen reader announces reads as
// characters. The pattern is derived from the table so the two cannot drift.
const HTML_ENTITIES: Readonly<Record<string, string>> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
}

const ENTITY_PATTERN = new RegExp(Object.keys(HTML_ENTITIES).join('|'), 'g')

/** Strips tags, decodes common entities, and collapses whitespace to plain text. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(TAG_PATTERN, ' ')
    .replace(ENTITY_PATTERN, (entity) => HTML_ENTITIES[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim()
}
