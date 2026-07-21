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
      <div className="flex flex-wrap gap-x-2.5 gap-y-2">
        {entries.map((entry) => (
          <button
            key={entry.publicIdentifier}
            type="button"
            onClick={() => onSelect(entry)}
            className={cn(
              'inline-flex items-center rounded-full border px-3 py-1.5 text-left text-sm transition-colors',
              'border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-400 hover:bg-brand-100',
              'dark:border-brand-400/30 dark:bg-brand-400/10 dark:text-brand-200',
              'dark:hover:border-brand-400/60 dark:hover:bg-brand-400/20',
            )}
          >
            {entry.question}
          </button>
        ))}
      </div>
    </div>
  )
}
