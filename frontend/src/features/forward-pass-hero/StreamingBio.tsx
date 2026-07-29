import { useLayoutEffect, useRef } from 'react'

import { cn } from '../../lib/cn'
import { TokenizedText, type TokenView } from './TokenizedText'
import type { ForwardPassFrame } from './types'

/** How many trailing tokens keep the "just sampled" highlight. */
const FRESH_TOKEN_COUNT = 2

interface StreamingBioProps {
  readonly frame: ForwardPassFrame
  readonly streaming: boolean
  /** Optional so the hero compiles before Task 9 wires the shared toggle; defaults to text. */
  readonly view?: TokenView
  /** Whether to tint the tokens with their `sweep` washes; off reads as plain prose. Defaults on. */
  readonly highlight?: boolean
  /**
   * The full authored bio, rendered as an invisible sizer so the box reserves its final
   * height up front and never grows as tokens stream. Omitted, the box grows to fit.
   */
  readonly reserveText?: string
  readonly className?: string
}

/**
 * The visible, streamed answer, rendered as the real tokens it arrived as: one coloured
 * chip per token, so the boundaries the tokenizer chose are legible. It is `aria-hidden`
 * (via `TokenizedText`) because it animates; `ForwardPassHero` renders the full bio as
 * real prose alongside it for assistive tech and search engines.
 */
export function StreamingBio({
  frame,
  streaming,
  view = 'text',
  highlight = true,
  reserveText,
  className,
}: StreamingBioProps) {
  const scroller = useRef<HTMLSpanElement>(null)
  const emittedCount = frame.emittedTokens.length

  // The ids grid is the one view whose height cannot be reserved exactly: a streamed source
  // does not know its own tokenization in advance, so it scrolls inside the reserved box and
  // follows the newest chips instead. Assigning `scrollTop` jumps, so nothing animates here
  // and reduced-motion needs no special case.
  useLayoutEffect(() => {
    const box = scroller.current
    if (box) {
      box.scrollTop = box.scrollHeight
    }
  }, [emittedCount, view])

  const tokens = (
    <TokenizedText
      tokens={frame.emittedTokens}
      view={view}
      freshCount={FRESH_TOKEN_COUNT}
      cursor={streaming}
      highlight={highlight}
    />
  )

  if (!reserveText) {
    return (
      <p className={cn('min-h-40 text-base tracking-tight text-fg sm:text-lg', className)}>
        {tokens}
      </p>
    )
  }

  // The text view flows as prose, so a full-length invisible copy predicts its final height
  // exactly and it never needs to scroll. The ids view borrows that same height as a budget:
  // it is taken out of flow so the invisible copy alone decides the row height, because a
  // grid row otherwise grows to its tallest item's content even when that item can scroll.
  const scrolls = view === 'ids'
  return (
    <p
      className={cn(
        'relative grid min-h-40 text-base tracking-tight text-fg sm:text-lg',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="invisible col-start-1 row-start-1 leading-loose whitespace-pre-wrap"
      >
        {reserveText}
      </span>
      <span
        ref={scroller}
        aria-hidden="true"
        className={cn(
          'col-start-1 row-start-1',
          scrolls && 'absolute inset-0 overflow-y-auto overscroll-contain',
        )}
      >
        {tokens}
      </span>
    </p>
  )
}
