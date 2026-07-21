import { describe, expect, it } from 'vitest'

import { htmlToPlainText, WORD_CLASS, wrapWordsInHtml } from './revealHtml'

describe('wrapWordsInHtml', () => {
  it('wraps every word and counts them', () => {
    const { html, wordCount } = wrapWordsInHtml('<p>Python first.</p>')
    expect(wordCount).toBe(2)
    expect(html.match(new RegExp(WORD_CLASS, 'g'))).toHaveLength(2)
    expect(html).toContain('data-word-index="0"')
    expect(html).toContain('data-word-index="1"')
  })

  it('leaves tag structure intact, wrapping only text', () => {
    const source = '<ul><li><strong>PyTorch</strong> and vLLM</li></ul>'
    const { html, wordCount } = wrapWordsInHtml(source)
    expect(wordCount).toBe(3)
    // Tags survive verbatim; the span sits inside <strong>, not around it.
    expect(html).toContain('<ul><li><strong><span')
    expect(html).toContain('</strong>')
    expect(html).toContain('</li></ul>')
  })

  it('is lossless: stripping the spans restores the original text', () => {
    const source = '<p>Polars over pandas when I get to choose.</p>'
    const { html } = wrapWordsInHtml(source)
    expect(htmlToPlainText(html)).toBe(htmlToPlainText(source))
  })

  it('handles empty and whitespace-only input without inventing words', () => {
    expect(wrapWordsInHtml('')).toEqual({ html: '', wordCount: 0 })
    expect(wrapWordsInHtml('<p> </p>').wordCount).toBe(0)
  })

  it('keeps an entity inside a single word intact', () => {
    const { html, wordCount } = wrapWordsInHtml('<p>R&amp;D</p>')
    expect(wordCount).toBe(1)
    expect(html).toContain('R&amp;D')
  })
})

describe('htmlToPlainText', () => {
  it('strips tags and collapses whitespace', () => {
    expect(htmlToPlainText('<ul>\n<li>a</li>\n<li>b</li>\n</ul>')).toBe('a b')
  })

  it('decodes the entities the Markdown pipeline emits and leaves literal Unicode alone', () => {
    // markdown-it + nh3 only ever emit &amp; &lt; &gt; &nbsp;; dashes, quotes, and
    // apostrophes arrive as literal characters and must pass through untouched.
    expect(htmlToPlainText('<p>SFT &amp; DPO, a &lt; b, one&nbsp;space</p>')).toBe(
      'SFT & DPO, a < b, one space',
    )
    expect(htmlToPlainText("<p>fast — really, it's fine</p>")).toBe("fast — really, it's fine")
  })
})
