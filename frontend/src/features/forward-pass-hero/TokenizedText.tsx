import { cn } from '../../lib/cn'
import { groupTokensByGrapheme } from './tokenGroups'
import { tokenChipClasses } from './tokenPalette'
import type { Token } from './types'

export type TokenView = 'text' | 'ids'

/** The just-emitted groups keep an outline as well as a stronger tint, so "new" is not colour alone. */
const FRESH_CHIP = 'outline-1 outline-token-edge'

interface TokenizedTextProps {
  readonly tokens: readonly Token[]
  readonly view: TokenView
  /** Trailing groups to mark as freshly emitted (streaming output); defaults to 0. */
  readonly freshCount?: number
  /** Whether to show a blinking cursor after the last token (streaming output). */
  readonly cursor?: boolean
  /**
   * Whether to tint each chip with its per-position `sweep` wash. Off drops the colour so
   * the run reads as plain prose; the fresh-token outline stays either way. Defaults on.
   */
  readonly highlight?: boolean
  readonly className?: string
}

/**
 * Renders tokens as an inline run of coloured chips: one per grapheme group, tinted by
 * position (see `tokenChipClasses`). In the text view the chips carry the token text
 * (leading space included, so boundaries read); in the ids view they carry the real
 * GPT-2 ids, and a multi-token group also shows a small count badge. The run is
 * `aria-hidden`: callers provide the readable string elsewhere so assistive tech is not
 * read one fragment at a time.
 */
export function TokenizedText({
  tokens,
  view,
  freshCount = 0,
  cursor = false,
  highlight = true,
  className,
}: TokenizedTextProps) {
  const groups = groupTokensByGrapheme(tokens)
  const freshFrom = groups.length - freshCount

  return (
    <span
      aria-hidden="true"
      // Text view flows inline so the tokens read as prose; ids view is a token list, so
      // it wraps as a flex grid where each chip is a whole unit (a grouped chip's ids never
      // break across the line edge the way inline whitespace-pre-wrap let them).
      className={cn(view === 'ids' ? 'flex flex-wrap gap-1' : 'leading-loose', className)}
    >
      {groups.map((group, position) => {
        const ids = group.tokens.map((token) => token.id).join(' ')
        const isFresh = freshCount > 0 && position >= freshFrom
        return (
          <span
            key={`${position}:${ids}`}
            className={cn(
              'rounded-[3px] text-fg',
              view === 'ids' ? 'whitespace-nowrap' : 'whitespace-pre-wrap',
              highlight && tokenChipClasses(position),
              isFresh && FRESH_CHIP,
            )}
          >
            {view === 'ids' ? (
              <span className="px-0.5 font-mono text-[0.85em]">{ids}</span>
            ) : (
              <>
                {group.text}
                {group.tokens.length > 1 && (
                  <span className="ml-0.5 font-mono text-[0.6em] text-muted">
                    {'×'}
                    {group.tokens.length}
                  </span>
                )}
              </>
            )}
          </span>
        )
      })}
      {cursor && (
        <span className="text-brand-600 dark:text-brand-400 [animation:ls-cursor_1s_step-end_infinite]">
          {'▍'}
        </span>
      )}
    </span>
  )
}
