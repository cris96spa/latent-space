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
  readonly className?: string
}

/**
 * The visible, streamed answer, rendered as the real tokens it arrived as: one coloured
 * chip per token, so the boundaries the tokenizer chose are legible. It is `aria-hidden`
 * (via `TokenizedText`) because it animates; `ForwardPassHero` renders the full bio as
 * real prose alongside it for assistive tech and search engines.
 */
export function StreamingBio({ frame, streaming, view = 'text', className }: StreamingBioProps) {
  return (
    <p className={cn('min-h-40 text-base tracking-tight text-fg sm:text-lg', className)}>
      <TokenizedText
        tokens={frame.emittedTokens}
        view={view}
        freshCount={FRESH_TOKEN_COUNT}
        cursor={streaming}
      />
    </p>
  )
}
