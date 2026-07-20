import { cn } from '../../lib/cn'
import type { ForwardPassFrame } from './types'

/**
 * Alternating tints marking token boundaries, in the amber `token-tint` rather than the
 * brand blue: see the note on those tokens in `index.css` for why the hue is off-brand
 * and why the two steps are far apart in lightness. One hue with two intensities says
 * "same kind of thing, and here is where they split"; several hues would invite the
 * reader to look for a meaning the colours do not carry. Alphas are lower in dark mode,
 * where the same wash over a near-black panel reads much hotter.
 */
const TOKEN_TINTS: readonly string[] = [
  'bg-token-tint/24 dark:bg-token-tint/20',
  'bg-token-tint/50 dark:bg-token-tint/40',
]

/**
 * The just-sampled tokens, marked by an outline as well as a stronger tint so the
 * "this one is new" cue does not rest on colour alone.
 */
const FRESH_TOKEN_TINT = 'bg-token-tint/65 outline-1 outline-token-edge dark:bg-token-tint/45'
/** How many trailing tokens keep the "just sampled" highlight. */
const FRESH_TOKEN_COUNT = 2

interface StreamingBioProps {
  frame: ForwardPassFrame
  streaming: boolean
  className?: string
}

/**
 * The visible, streamed answer, rendered as the tokens it actually arrived as: one
 * tinted box per token, leading space included, so the boundaries the tokenizer chose
 * are legible. It is `aria-hidden` because it animates and would be announced
 * piecemeal; ForwardPassHero renders the full bio as real prose alongside it for
 * assistive tech and search engines.
 */
export function StreamingBio({ frame, streaming, className }: StreamingBioProps) {
  const tokens = frame.emittedTokens
  const freshFrom = tokens.length - FRESH_TOKEN_COUNT

  return (
    <p
      aria-hidden="true"
      className={cn(
        'min-h-40 text-base leading-loose tracking-tight text-fg sm:text-lg',
        className,
      )}
    >
      {tokens.map((token, position) => (
        <span
          key={token.index}
          className={cn(
            'rounded-[3px] whitespace-pre-wrap',
            position >= freshFrom ? FRESH_TOKEN_TINT : TOKEN_TINTS[position % TOKEN_TINTS.length],
          )}
        >
          {token.text}
        </span>
      ))}
      {streaming && (
        <span className="text-brand-600 dark:text-brand-400 [animation:ls-cursor_1s_step-end_infinite]">
          ▍
        </span>
      )}
    </p>
  )
}
