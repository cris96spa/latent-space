import type { ChatEntry } from '../../lib/api'
import { CHAT_COPY } from './content'
import { matchChatEntry } from './matchChatEntry'
import type { AnswerResolution, ChatResponder, ResponderInput } from './types'

/** How many prompts to offer alongside a no-match fallback. */
const FALLBACK_SUGGESTION_COUNT = 3

/** Resolves an input against the authored entries with no live model. */
function resolve(
  input: ResponderInput,
  entries: readonly ChatEntry[],
  bySlug: ReadonlyMap<string, ChatEntry>,
): AnswerResolution {
  const entry =
    input.kind === 'prompt'
      ? (bySlug.get(input.slug) ?? null)
      : matchChatEntry(input.text, entries)

  if (entry) {
    return { kind: 'answer', entry }
  }
  return {
    kind: 'fallback',
    message: CHAT_COPY.fallback,
    suggestions: entries.slice(0, FALLBACK_SUGGESTION_COUNT),
  }
}

/**
 * A `ChatResponder` with no live model: an exact lookup for a selected prompt, keyword
 * matching for typed text, and an in-voice fallback otherwise. It yields exactly one
 * resolution - the async-iterable shape exists only so a streaming `LlmChatResponder`
 * (task 15) can drop in without the chat shell changing.
 */
export function createScriptedResponder(entries: readonly ChatEntry[]): ChatResponder {
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]))

  return {
    async *respond(input: ResponderInput, signal?: AbortSignal) {
      if (signal?.aborted) {
        return
      }
      yield resolve(input, entries, bySlug)
    },
  }
}
