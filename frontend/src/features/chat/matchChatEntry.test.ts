import { describe, expect, it } from 'vitest'

import type { ChatEntry } from '../../lib/api'
import { matchChatEntry } from './matchChatEntry'

const ENTRIES: readonly ChatEntry[] = [
  { publicIdentifier: 'why-a-forward-pass', question: 'Why is this a forward pass and not a normal portfolio?', category: 'meta', answerHtml: '<p>...</p>' },
  { publicIdentifier: 'gpt2-from-scratch', question: 'What did rebuilding GPT-2 from scratch teach you?', category: 'build', answerHtml: '<p>...</p>' },
  { publicIdentifier: 'attention-explained', question: 'Explain attention without the hand-waving.', category: 'concepts', answerHtml: '<p>...</p>' },
  { publicIdentifier: 'cheaper-inference', question: 'How do you actually make a model cheaper to run?', category: 'inference', answerHtml: '<p>...</p>' },
  { publicIdentifier: 'is-a-model-good', question: 'How do you know a model is actually good?', category: 'evals', answerHtml: '<p>...</p>' },
  { publicIdentifier: 'teleport-mdp', question: 'What\'s the "Teleport MDP" (your thesis) about?', category: 'research', answerHtml: '<p>...</p>' },
  { publicIdentifier: 'most-overrated', question: 'What\'s the most overrated thing in ML right now?', category: 'opinion', answerHtml: '<p>...</p>' },
  { publicIdentifier: 'off-the-clock', question: "What do you do when you're not staring at loss curves?", category: 'human', answerHtml: '<p>...</p>' },
  { publicIdentifier: 'can-i-see-your-resume', question: 'Can I see your résumé?', category: 'resume', answerHtml: '<p>...</p>' },
]

function matchPublicIdentifier(input: string): string | null {
  return matchChatEntry(input, ENTRIES)?.publicIdentifier ?? null
}

describe('matchChatEntry', () => {
  it('matches a question typed in the visitors own words', () => {
    expect(matchPublicIdentifier('how do you make a model cheaper')).toBe('cheaper-inference')
    expect(matchPublicIdentifier('explain attention to me')).toBe('attention-explained')
    expect(matchPublicIdentifier('what is the most overrated thing')).toBe('most-overrated')
  })

  it('reaches an entry through a category synonym not in the question', () => {
    expect(matchPublicIdentifier('cv')).toBe('can-i-see-your-resume')
    expect(matchPublicIdentifier('quantization')).toBe('cheaper-inference')
    expect(matchPublicIdentifier('what do you do for fun')).toBe('off-the-clock')
    expect(matchPublicIdentifier('tell me about the teleport mdp')).toBe('teleport-mdp')
  })

  it('is case- and diacritic-insensitive', () => {
    expect(matchPublicIdentifier('QUANTIZATION')).toBe('cheaper-inference')
    // "resume" must reach the résumé entry whose question carries the accent.
    expect(matchPublicIdentifier('résumé')).toBe('can-i-see-your-resume')
  })

  it('returns null when nothing meaningful overlaps, so the caller can fall back', () => {
    expect(matchPublicIdentifier('do you like pineapple on pizza')).toBeNull()
    expect(matchPublicIdentifier('')).toBeNull()
    expect(matchPublicIdentifier('   ')).toBeNull()
  })

  it('returns null for input that is only stopwords', () => {
    expect(matchPublicIdentifier('what is your')).toBeNull()
  })
})
