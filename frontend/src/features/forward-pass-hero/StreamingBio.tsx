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
   * The full authored bio, used only as an invisible sizer in the text view so the box
   * reserves its final height up front and never grows as tokens stream. Omitted (or in
   * the ids view) the box just grows to fit.
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
  const tokens = (
    <TokenizedText
      tokens={frame.emittedTokens}
      view={view}
      freshCount={FRESH_TOKEN_COUNT}
      cursor={streaming}
      highlight={highlight}
    />
  )

  // Only the inline text view flows as prose whose height a full-length copy can predict;
  // the ids view is a token grid that has to size to its own wrapped chips.
  if (view === 'text' && reserveText) {
    return (
      <p className={cn('grid min-h-40 text-base tracking-tight text-fg sm:text-lg', className)}>
        <span
          aria-hidden="true"
          className="invisible col-start-1 row-start-1 leading-loose whitespace-pre-wrap"
        >
          {reserveText}
        </span>
        <span className="col-start-1 row-start-1">{tokens}</span>
      </p>
    )
  }

  return (
    <p className={cn('min-h-40 text-base tracking-tight text-fg sm:text-lg', className)}>{tokens}</p>
  )
}
