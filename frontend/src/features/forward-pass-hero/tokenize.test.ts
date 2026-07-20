import { describe, expect, it } from 'vitest'

import { pretokenizeText } from './tokenize'

describe('pretokenizeText', () => {
  it('keeps leading spaces attached to their word', () => {
    expect(pretokenizeText('who is Cristian?')).toEqual(['who', ' is', ' Cristian', '?'])
  })

  it('splits contractions the way the Llama 3 pattern does', () => {
    expect(pretokenizeText("Llama 3's tokenizer")).toEqual(['Llama', ' ', '3', "'s", ' tokenizer'])
  })

  it('groups digits in runs of at most three', () => {
    expect(pretokenizeText('110110')).toEqual(['110', '110'])
    expect(pretokenizeText('12345')).toEqual(['123', '45'])
  })

  it('clusters punctuation and keeps a preceding space with it', () => {
    expect(pretokenizeText('done... (really)')).toEqual(['done', '...', ' (', 'really', ')'])
  })

  it('is lossless, so the tokens rebuild the source exactly', () => {
    const sources = [
      'GPT-2, 110/110 — cum laude.',
      "who is Cristian? He's an NLP engineer.",
      'trailing space ',
      '',
    ]
    sources.forEach((source) => expect(pretokenizeText(source).join('')).toBe(source))
  })
})
