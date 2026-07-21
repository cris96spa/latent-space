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
 * The suggested-prompt chips — the primary way into the chat. Each is a real button, so
 * it is keyboard-operable and focusable for free. Distinguished from the transcript by
 * shape (pills) and position, not colour, and the brand accent only appears on
 * hover/focus so a resting chip never reads as a link.
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
      <div className="flex flex-wrap gap-2">
        {entries.map((entry) => (
          <button
            key={entry.slug}
            type="button"
            onClick={() => onSelect(entry)}
            className={cn(
              'inline-flex items-center rounded-full border border-border bg-surface px-3 py-1.5',
              'text-left text-sm text-fg transition-colors',
              'hover:border-brand-400 hover:text-brand-700 dark:hover:text-brand-300',
            )}
          >
            {entry.question}
          </button>
        ))}
      </div>
    </div>
  )
}
