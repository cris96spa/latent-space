import type { ChatEntry } from '../../lib/api'

/** What the user asked, as the responder sees it: a chip is exact, typed text is matched. */
export type ResponderInput =
  | { readonly kind: 'prompt'; readonly slug: string }
  | { readonly kind: 'freeText'; readonly text: string }

/** The responder's answer to one input: a matched entry, or the no-match fallback. */
export type AnswerResolution =
  | { readonly kind: 'answer'; readonly entry: ChatEntry }
  | {
      readonly kind: 'fallback'
      readonly message: string
      readonly suggestions: readonly ChatEntry[]
    }

/**
 * Turns an input into a stream of answer resolutions. `ScriptedChatResponder` yields
 * once; a future `LlmChatResponder` (task 15) yields deltas. The chat shell consumes
 * the iterable identically, so swapping responders needs no UI-shell change.
 */
export interface ChatResponder {
  respond(input: ResponderInput, signal?: AbortSignal): AsyncIterable<AnswerResolution>
}

/** A question the visitor asked, shown as their turn in the transcript. */
export interface UserTurn {
  readonly id: string
  readonly role: 'user'
  readonly text: string
}

/** An authored answer (or fallback) shown as the assistant's turn. */
export interface AnswerTurn {
  readonly id: string
  readonly role: 'assistant'
  readonly variant: 'answer' | 'fallback'
  /** Word-wrapped HTML the reveal walks through; a wrapped plain message for a fallback. */
  readonly revealHtml: string
  /** How many word spans `revealHtml` holds; the reveal player's upper bound. */
  readonly wordCount: number
  /** Tag-free text a screen reader announces once, independent of the animation. */
  readonly plainText: string
  /** Prompts to offer beneath a fallback; empty for a real answer. */
  readonly suggestions: readonly ChatEntry[]
  /** A rich attachment rendered beneath the answer text, e.g. the résumé viewer. */
  readonly attachment?: AnswerAttachment
  /** The realistic "thinking" status line shown above the answer as it streams. */
  readonly hook?: string
}

/** A non-text payload an answer can carry. Only the résumé exists today. */
export type AnswerAttachment = 'resume'

export type ChatTurn = UserTurn | AnswerTurn
