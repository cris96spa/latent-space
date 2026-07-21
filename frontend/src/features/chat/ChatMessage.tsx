import { useEffect, useRef } from 'react'

import type { ChatEntry } from '../../lib/api'
import { cn } from '../../lib/cn'
import { CHAT_COPY } from './content'
import { ResumeCard } from './ResumeCard'
import { SuggestedPrompts } from './SuggestedPrompts'
import type { ChatTurn } from './types'
import { useTypedReveal } from './useTypedReveal'

interface ChatMessageProps {
  turn: ChatTurn
  /** True while this turn's words are still revealing. */
  streaming: boolean
  /** How many words to reveal; the full count for a settled turn. */
  shown: number
  onSuggestion: (entry: ChatEntry) => void
}

/**
 * One transcript turn. The visitor's question and Cristian's answer are told apart by
 * side, label, and bubble shape - never by hue alone - so the distinction survives
 * red-green colour-vision deficiency and both themes. The answer is the API's sanitized
 * HTML, revealed a word at a time; it is the real, readable content (not a decorative
 * copy), so a screen reader announces the whole thing via the transcript's live region.
 */
export function ChatMessage({ turn, streaming, shown, onSuggestion }: ChatMessageProps) {
  if (turn.role === 'user') {
    return (
      <li className="flex justify-end">
        <div className="max-w-[85%] space-y-1">
          <p className="text-right font-mono text-[11px] uppercase tracking-widest text-muted">
            {CHAT_COPY.userLabel}
          </p>
          <div className="rounded-2xl rounded-tr-sm border border-border bg-surface px-4 py-2 text-fg">
            {turn.text}
          </div>
        </div>
      </li>
    )
  }

  return (
    <li className="flex justify-start">
      <div className="max-w-[85%] space-y-1">
        <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-brand-700 dark:text-brand-300">
          <span aria-hidden="true">▍</span>
          {CHAT_COPY.assistantLabel}
        </p>
        <div className="rounded-2xl rounded-tl-sm border border-brand-200 bg-brand-50/60 px-4 py-3 text-fg dark:border-brand-400/25 dark:bg-brand-400/10">
          {turn.hook && (
            <p
              className="mb-2 flex items-center gap-2 font-mono text-[11px] text-muted"
              aria-hidden="true"
            >
              <span
                className={cn(
                  'inline-block size-1.5 rounded-full',
                  streaming
                    ? 'bg-brand-500 [animation:ls-pulse_1s_ease-in-out_infinite]'
                    : 'bg-border',
                )}
              />
              {turn.hook}
            </p>
          )}
          <AnswerBody html={turn.revealHtml} streaming={streaming} shown={shown} />
          {turn.attachment === 'resume' && <ResumeCard />}
          {turn.variant === 'fallback' && turn.suggestions.length > 0 && (
            <SuggestedPrompts
              className="mt-3"
              entries={turn.suggestions}
              onSelect={onSuggestion}
              label="Suggested prompts"
              hideLabel
            />
          )}
        </div>
      </div>
    </li>
  )
}

interface AnswerBodyProps {
  html: string
  streaming: boolean
  shown: number
}

/** The revealed answer HTML. `is-revealing` gates word visibility; without it, words show. */
function AnswerBody({ html, streaming, shown }: AnswerBodyProps) {
  const ref = useRef<HTMLDivElement>(null)

  // The HTML is sanitized by the backend (nh3 allowlist). It is written once via a ref
  // rather than `dangerouslySetInnerHTML` so React never re-manages these nodes - a
  // re-render must not wipe the per-word `is-shown` classes the reveal sets by hand.
  useEffect(() => {
    if (ref.current !== null) {
      ref.current.innerHTML = html
    }
  }, [html])

  useTypedReveal(ref, shown)

  return <div ref={ref} className={cn('ls-answer', streaming && 'is-revealing')} />
}
