import { describe, expect, it } from 'vitest'

import { pretokenizeText } from './tokenize'

describe('pretokenizeText', () => {
  it('keeps leading spaces attached to their word', () => {
    expect(pretokenizeText('Who is Cristian?')).toEqual(['Who', ' is', ' Cristian', '?'])
  })

  it('splits contractions the way the GPT-2 pattern does', () => {
    expect(pretokenizeText("GPT-2's tokenizer")).toEqual(['GPT', '-', '2', "'s", ' tokenizer'])
  })

  it('keeps each run of digits together', () => {
    expect(pretokenizeText('110110')).toEqual(['110110'])
    expect(pretokenizeText('version 12345')).toEqual(['version', ' 12345'])
  })

  it('clusters punctuation and keeps a preceding space with it', () => {
    expect(pretokenizeText('done... (really)')).toEqual(['done', '...', ' (', 'really', ')'])
  })

  it('is lossless, so the tokens rebuild the source exactly', () => {
    const sources = [
      'GPT-2, 110/110 - cum laude.',
      "Who is Cristian? He's an NLP engineer.",
      'trailing space ',
      '',
    ]
    sources.forEach((source) => expect(pretokenizeText(source).join('')).toBe(source))
  })
})
