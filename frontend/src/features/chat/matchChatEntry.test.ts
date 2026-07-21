import { describe, expect, it } from 'vitest'

import type { ChatEntry } from '../../lib/api'
import { matchChatEntry } from './matchChatEntry'

const ENTRIES: readonly ChatEntry[] = [
  { slug: 'what-are-you-working-on', question: 'What are you working on these days?', category: 'now', answerHtml: '<p>Inference.</p>' },
  { slug: 'whats-your-stack', question: "What's your stack?", category: 'stack', answerHtml: '<p>Python first.</p>' },
  { slug: 'what-should-i-look-at-first', question: 'What should I look at first?', category: 'projects', answerHtml: '<p>Start here.</p>' },
  { slug: 'how-do-you-make-llms-cheaper', question: 'How do you make an LLM cheaper to run?', category: 'work', answerHtml: '<p>Quantize.</p>' },
  { slug: 'whats-your-background', question: "What's your background?", category: 'background', answerHtml: '<p>PoliMi.</p>' },
  { slug: 'can-i-see-your-resume', question: 'Can I see your résumé?', category: 'meta', answerHtml: '<p>Here.</p>' },
]

function matchSlug(input: string): string | null {
  return matchChatEntry(input, ENTRIES)?.slug ?? null
}

describe('matchChatEntry', () => {
  it('matches a question typed almost verbatim', () => {
    expect(matchSlug("what's your stack?")).toBe('whats-your-stack')
  })

  it('reaches an entry through a category synonym not in the question', () => {
    expect(matchSlug('cv')).toBe('can-i-see-your-resume')
    expect(matchSlug('what tools do you use')).toBe('whats-your-stack')
  })

  it('routes an intent phrased in the visitors own words', () => {
    expect(matchSlug('how do you make an llm cheaper')).toBe('how-do-you-make-llms-cheaper')
    expect(matchSlug('what should I look at first')).toBe('what-should-i-look-at-first')
    expect(matchSlug('tell me about your background')).toBe('whats-your-background')
  })

  it('is case- and diacritic-insensitive', () => {
    expect(matchSlug('TOOLS')).toBe('whats-your-stack')
    // "resume" must reach the résumé entry whose question carries the accent.
    expect(matchSlug('resume')).toBe('can-i-see-your-resume')
  })

  it('returns null when nothing meaningful overlaps, so the caller can fall back', () => {
    expect(matchSlug('do you like pineapple on pizza')).toBeNull()
    expect(matchSlug('')).toBeNull()
    expect(matchSlug('   ')).toBeNull()
  })

  it('returns null for input that is only stopwords', () => {
    expect(matchSlug('what is your')).toBeNull()
  })
})
