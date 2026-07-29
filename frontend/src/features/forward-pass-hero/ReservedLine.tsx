import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'

interface ReservedLineProps {
  /** The widest value this line can ever hold, rendered invisibly to fix the height. */
  readonly sizer: string
  readonly children: ReactNode
  readonly className?: string
}

/**
 * A readout whose height is reserved by an invisible copy of its longest possible value.
 *
 * The hero's status readouts change text on every frame (`decode · mlp` becomes
 * `decode · attention`, `9 tokens` becomes `108 tokens`). On a narrow viewport that flips
 * whether the line wraps, and the resulting reflow shoves everything below it - including
 * the bio the visitor is reading - several times a second. Sizing against the worst case
 * makes the height a function of the viewport alone. The sizer wraps exactly as the live
 * value would, so this needs no per-breakpoint height constants.
 */
export function ReservedLine({ sizer, children, className }: ReservedLineProps) {
  return (
    <span className={cn('grid', className)}>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {sizer}
      </span>
      <span className="col-start-1 row-start-1">{children}</span>
    </span>
  )
}
