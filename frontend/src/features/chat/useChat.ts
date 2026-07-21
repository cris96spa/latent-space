import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ChatEntry } from '../../lib/api'
import { RESUME_PDF } from '../../lib/links'
import { htmlToPlainText, wrapWordsInHtml } from './revealHtml'
import type {
  AnswerResolution,
  AnswerTurn,
  ChatResponder,
  ChatTurn,
  ResponderInput,
  UserTurn,
} from './types'

/** Milliseconds each word waits before the next appears while an answer streams. */
const WORD_REVEAL_MS = 24

export interface ChatController {
  readonly turns: readonly ChatTurn[]
  /** The assistant turn currently revealing, or `null` when nothing is streaming. */
  readonly activeTurnId: string | null
  /** How many words of the active turn are revealed so far. */
  readonly shownWords: number
  readonly askPrompt: (entry: ChatEntry) => void
  readonly askFreeText: (text: string) => void
}

/** Escapes the three characters that would otherwise be read as markup. */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Builds the assistant turn for a resolution, pre-wrapping its words for the reveal. */
function buildAnswerTurn(id: string, resolution: AnswerResolution): AnswerTurn {
  if (resolution.kind === 'answer') {
    const wrapped = wrapWordsInHtml(resolution.entry.answerHtml)
    // The résumé viewer attaches to whichever answer links the résumé PDF, so the cue
    // follows the content rather than a hardcoded slug.
    const linksResume = resolution.entry.answerHtml.includes(RESUME_PDF.path)
    return {
      id,
      role: 'assistant',
      variant: 'answer',
      revealHtml: wrapped.html,
      wordCount: wrapped.wordCount,
      plainText: htmlToPlainText(resolution.entry.answerHtml),
      suggestions: [],
      ...(linksResume ? { attachment: 'resume' as const } : {}),
    }
  }
  // The fallback message is plain text; wrap it in a paragraph so it reveals the same way.
  const wrapped = wrapWordsInHtml(`<p>${escapeHtml(resolution.message)}</p>`)
  return {
    id,
    role: 'assistant',
    variant: 'fallback',
    revealHtml: wrapped.html,
    wordCount: wrapped.wordCount,
    plainText: resolution.message,
    suggestions: resolution.suggestions,
  }
}

/**
 * Owns the transcript and the reveal player. `ask` appends the user's turn, consumes the
 * responder's stream, and appends the assistant turn; a player then walks `shownWords`
 * up to that turn's `wordCount`. The responder is consumed as an async iterable and the
 * reveal never runs ahead of what has arrived, mirroring the hero — so a streaming
 * `LlmChatResponder` (task 15) works through the same path. Under reduced motion the
 * answer is fully revealed at once and nothing animates.
 */
export function useChat(responder: ChatResponder, reducedMotion: boolean): ChatController {
  const [turns, setTurns] = useState<readonly ChatTurn[]>([])
  const [activeTurnId, setActiveTurnId] = useState<string | null>(null)
  const [shownWords, setShownWords] = useState(0)
  const idCounter = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const nextId = useCallback(() => `turn-${idCounter.current++}`, [])

  const ask = useCallback(
    (input: ResponderInput, userText: string) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const { signal } = controller

      const userTurn: UserTurn = { id: nextId(), role: 'user', text: userText }
      setTurns((previous) => [...previous, userTurn])

      let assistantId: string | null = null
      void (async () => {
        for await (const resolution of responder.respond(input, signal)) {
          if (signal.aborted) {
            return
          }
          const turn = buildAnswerTurn(assistantId ?? nextId(), resolution)
          if (assistantId === null) {
            assistantId = turn.id
            setTurns((previous) => [...previous, turn])
            setActiveTurnId(turn.id)
            setShownWords(reducedMotion ? turn.wordCount : 0)
          } else {
            setTurns((previous) => previous.map((existing) =>
              existing.id === assistantId ? turn : existing,
            ))
          }
        }
      })()
    },
    [responder, reducedMotion, nextId],
  )

  const askPrompt = useCallback(
    (entry: ChatEntry) => ask({ kind: 'prompt', slug: entry.slug }, entry.question),
    [ask],
  )

  const askFreeText = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (trimmed.length > 0) {
        ask({ kind: 'freeText', text: trimmed }, trimmed)
      }
    },
    [ask],
  )

  const activeTurn = turns.find((turn) => turn.id === activeTurnId)
  const activeWordCount = activeTurn?.role === 'assistant' ? activeTurn.wordCount : 0

  useEffect(() => {
    if (activeTurnId === null) {
      return
    }
    if (reducedMotion || shownWords >= activeWordCount) {
      setShownWords(activeWordCount)
      setActiveTurnId(null)
      return
    }
    const timeout = setTimeout(() => setShownWords((count) => count + 1), WORD_REVEAL_MS)
    return () => clearTimeout(timeout)
  }, [activeTurnId, shownWords, activeWordCount, reducedMotion])

  useEffect(() => () => abortRef.current?.abort(), [])

  return useMemo(
    () => ({ turns, activeTurnId, shownWords, askPrompt, askFreeText }),
    [turns, activeTurnId, shownWords, askPrompt, askFreeText],
  )
}
