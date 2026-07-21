import type { AnchorHTMLAttributes } from 'react'

import { cn } from '../lib/cn'

export function TextLink({ className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cn(
        'font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 transition-colors hover:text-brand-600 hover:decoration-brand-500 dark:text-brand-300 dark:hover:text-brand-200',
        className,
      )}
      {...props}
    />
  )
}
