import type { ReactNode } from 'react'

import { cn } from '../lib/cn'

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  className?: string
  children?: ReactNode
}

export function SectionHeading({ eyebrow, title, className, children }: SectionHeadingProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {eyebrow && (
        <p className="font-mono text-xs uppercase tracking-widest text-brand-700 dark:text-brand-300">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {children && <p className="max-w-2xl text-muted">{children}</p>}
    </div>
  )
}
