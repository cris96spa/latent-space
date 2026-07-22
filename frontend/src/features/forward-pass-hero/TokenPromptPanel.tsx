import { cn } from '../../lib/cn'
import type { TokenCounts } from './heroSource'
import { TokenizedText, type TokenView } from './TokenizedText'
import type { Token } from './types'

const VIEWS: readonly { value: TokenView; label: string }[] = [
  { value: 'text', label: 'text' },
  { value: 'ids', label: 'ids' },
]

function ViewToggle({
  view,
  onViewChange,
}: {
  view: TokenView
  onViewChange: (next: TokenView) => void
}) {
  return (
    <fieldset className="inline-flex rounded-lg border border-border bg-surface p-0.5">
      <legend className="sr-only">Prompt token view</legend>
      {VIEWS.map((option) => {
        const selected = option.value === view
        return (
          <label
            key={option.value}
            className={cn(
              'cursor-pointer rounded-md px-2.5 py-0.5 font-mono text-[11px] motion-safe:transition-colors',
              'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-700',
              selected ? 'bg-brand-700 font-semibold text-white' : 'text-muted hover:text-fg',
            )}
          >
            <input
              type="radio"
              name="prompt-token-view"
              value={option.value}
              checked={selected}
              onChange={() => onViewChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        )
      })}
    </fieldset>
  )
}

interface TokenPromptPanelProps {
  readonly tokens: readonly Token[]
  readonly promptText: string
  readonly counts: TokenCounts | null
  readonly view: TokenView
  readonly onViewChange: (next: TokenView) => void
  readonly idsAvailable: boolean
}

/**
 * The hero's prompt strip: the prompt as real GPT-2 token chips, its token/word/char
 * counts, and a text/ids toggle. Before tokenization resolves (no tokens) it shows the
 * plain prompt text; in the pretokenizer fallback (`idsAvailable` false) the toggle and
 * counts are hidden because there are no real ids or counts to show.
 */
export function TokenPromptPanel({
  tokens,
  promptText,
  counts,
  view,
  onViewChange,
  idsAvailable,
}: TokenPromptPanelProps) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-background/50 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="shrink-0 font-mono text-[11px] tracking-widest text-brand-700 uppercase dark:text-brand-400">
          prompt
        </span>
        {idsAvailable && <ViewToggle view={view} onViewChange={onViewChange} />}
      </div>

      {tokens.length > 0 ? (
        <TokenizedText tokens={tokens} view={view} className="block font-mono text-sm" />
      ) : (
        <span className="block font-mono text-sm text-fg">{promptText}</span>
      )}

      {counts && (
        <p className="font-mono text-[11px] text-muted">
          {`${counts.tokenCount} tokens · ${counts.wordCount} words · ${counts.charCount} chars`}
        </p>
      )}
    </div>
  )
}
