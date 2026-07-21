import { describe, expect, it } from 'vitest'

import type { ChatEntry } from '../../lib/api'
import { createScriptedResponder } from './scriptedResponder'
import type { AnswerResolution, ResponderInput } from './types'

const ENTRIES: readonly ChatEntry[] = [
  { slug: 'what-are-you-working-on', question: 'What are you working on these days?', category: 'now', answerHtml: '<p>Inference.</p>' },
  { slug: 'whats-your-stack', question: "What's your stack?", category: 'stack', answerHtml: '<p>Python first.</p>' },
  { slug: 'how-do-you-make-llms-cheaper', question: 'How do you make an LLM cheaper to run?', category: 'work', answerHtml: '<p>Quantize.</p>' },
  { slug: 'can-i-see-your-resume', question: 'Can I see your résumé?', category: 'meta', answerHtml: '<p>Here.</p>' },
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
    const resolution = await resolveOnce({ kind: 'prompt', slug: 'whats-your-stack' })
    expect(resolution.kind).toBe('answer')
    if (resolution.kind === 'answer') {
      expect(resolution.entry.slug).toBe('whats-your-stack')
      expect(resolution.entry.answerHtml).toContain('Python first')
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
    const resolution = await resolveOnce({ kind: 'freeText', text: 'pineapple pizza opinions' })
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
