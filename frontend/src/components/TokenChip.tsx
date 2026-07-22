import type { ReactNode } from 'react'

import { cn } from '../lib/cn'

export type TokenTone = 'brand' | 'neutral' | 'attention' | 'activation'

const TONE_CLASSES: Record<TokenTone, string> = {
  brand:
    'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-400/30 dark:bg-brand-400/10 dark:text-brand-200',
  neutral: 'border-border bg-surface text-muted',
  attention: 'border-attention-400 bg-attention-300/15 text-fg',
  activation: 'border-activation-400 bg-activation-300/15 text-fg',
}

interface TokenChipProps {
  children: ReactNode
  tone?: TokenTone
  className?: string
  title?: string
  'aria-label'?: string
}

/**
 * The recurring "token" motif: a monospace pill that carries the ML metaphor
 * visually across tags, tech stacks, and the forward-pass hero (task 07).
 */
export function TokenChip({
  children,
  tone = 'brand',
  className,
  title,
  'aria-label': ariaLabel,
}: TokenChipProps) {
  return (
    <span
      title={title}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-xs',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
