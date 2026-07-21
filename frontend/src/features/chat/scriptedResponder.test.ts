import { describe, expect, it } from 'vitest'

import type { ChatEntry } from '../../lib/api'
import { createScriptedResponder } from './scriptedResponder'
import type { AnswerResolution, ResponderInput } from './types'

const ENTRIES: readonly ChatEntry[] = [
  { slug: 'gpt2-from-scratch', question: 'What did rebuilding GPT-2 from scratch teach you?', category: 'build', answerHtml: '<p>Layer by layer.</p>' },
  { slug: 'cheaper-inference', question: 'How do you actually make a model cheaper to run?', category: 'inference', answerHtml: '<p>Quantize first.</p>' },
  { slug: 'most-overrated', question: 'What\'s the most overrated thing in ML right now?', category: 'opinion', answerHtml: '<p>Let us denoise.</p>' },
  { slug: 'can-i-see-your-resume', question: 'Can I see your résumé?', category: 'resume', answerHtml: '<p>Here it is.</p>' },
]

async function resolveOnce(input: ResponderInput): Promise<AnswerResolution> {
  const responder = createScriptedResponder(ENTRIES)
  const results: AnswerResolution[] = []
  for await (const resolution of responder.respond(input)) {
    results.push(resolution)
  }
  // The scripted responder yields exactly one resolution per input.
  expect(results).toHaveLength(1)
  return results[0]
}

describe('createScriptedResponder', () => {
  it('returns the authored answer for a selected prompt, by exact slug', async () => {
    const resolution = await resolveOnce({ kind: 'prompt', slug: 'cheaper-inference' })
    expect(resolution.kind).toBe('answer')
    if (resolution.kind === 'answer') {
      expect(resolution.entry.slug).toBe('cheaper-inference')
      expect(resolution.entry.answerHtml).toContain('Quantize')
    }
  })

  it('matches typed free text to an entry', async () => {
    const resolution = await resolveOnce({ kind: 'freeText', text: 'can I see your cv' })
    expect(resolution.kind).toBe('answer')
    if (resolution.kind === 'answer') {
      expect(resolution.entry.slug).toBe('can-i-see-your-resume')
    }
  })

  it('falls back with suggestions when free text matches nothing', async () => {
    const resolution = await resolveOnce({ kind: 'freeText', text: 'pineapple pizza please' })
    expect(resolution.kind).toBe('fallback')
    if (resolution.kind === 'fallback') {
      expect(resolution.suggestions.length).toBeGreaterThan(0)
      expect(resolution.message.length).toBeGreaterThan(0)
    }
  })

  it('falls back when a prompt slug is unknown rather than throwing', async () => {
    const resolution = await resolveOnce({ kind: 'prompt', slug: 'does-not-exist' })
    expect(resolution.kind).toBe('fallback')
  })
})
