import type { ChatEntry } from '../../lib/api'
import { cn } from '../../lib/cn'

interface SuggestedPromptsProps {
  entries: readonly ChatEntry[]
  onSelect: (entry: ChatEntry) => void
  /** Accessible name for the group; also shown unless `hideLabel` is set. */
  label: string
  hideLabel?: boolean
  className?: string
}

/**
 * The suggested-prompt chips - the primary way into the chat. Each is a real button, so
 * it is keyboard-operable and focusable for free. At rest they are quiet chrome: neutral
 * border, no fill, ink slightly dimmed - ten questions reading as text, not ten tinted
 * buttons shouting over the transcript. The brand accent appears only on hover and
 * focus, which also keeps a resting chip from reading as a link.
 */
export function SuggestedPrompts({
  entries,
  onSelect,
  label,
  hideLabel,
  className,
}: SuggestedPromptsProps) {
  return (
    <div className={cn('space-y-2', className)} role="group" aria-label={label}>
      {!hideLabel && (
        <p className="font-mono text-xs uppercase tracking-widest text-muted">{label}</p>
      )}
      <div className="flex flex-wrap gap-x-2.5 gap-y-2">
        {entries.map((entry) => (
          <button
            key={entry.publicIdentifier}
            type="button"
            onClick={() => onSelect(entry)}
            className={cn(
              'inline-flex items-center rounded-full border px-3 py-1 text-left text-sm transition-colors',
              'border-border bg-transparent text-fg/80',
              'hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700',
              'dark:hover:border-brand-400/60 dark:hover:bg-brand-400/10 dark:hover:text-brand-200',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700',
            )}
          >
            {entry.question}
          </button>
        ))}
      </div>
    </div>
  )
}
