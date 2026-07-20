import { cn } from '../lib/cn'

export type ButtonVariant = 'primary' | 'ghost'

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-brand-700 text-white shadow-sm hover:bg-brand-800 active:bg-brand-900',
  ghost:
    'border border-border bg-surface text-fg hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300',
}

export function buttonClassName(variant: ButtonVariant, className?: string): string {
  return cn(BASE_CLASSES, VARIANT_CLASSES[variant], className)
}
