import type { SVGProps } from 'react'

import { cn } from '../lib/cn'

export type LinkIconName = 'email' | 'github' | 'linkedin'

interface LinkIconProps extends SVGProps<SVGSVGElement> {
  readonly name: LinkIconName
}

/** Compact, decorative marks for contact links whose visible text supplies the label. */
export function LinkIcon({ name, className, ...props }: LinkIconProps) {
  const commonProps = {
    'aria-hidden': true,
    className: cn('size-4 shrink-0', className),
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
    ...props,
  }

  if (name === 'github') {
    return (
      <svg {...commonProps}>
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.4 4 5 5 0 0 0 19.3.5S18.2.1 15 1.8a13.4 13.4 0 0 0-7 0C4.8.1 3.7.5 3.7.5A5 5 0 0 0 3.6 4a5.4 5.4 0 0 0-1.4 3.5c0 5.4 3.5 6.6 6.8 7A4.8 4.8 0 0 0 8 18v4" />
        <path d="M8 19c-3 .9-3-1.5-4.2-2" />
      </svg>
    )
  }

  if (name === 'linkedin') {
    return (
      <svg {...commonProps}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z" />
        <path d="M2 9h4v12H2z" />
        <path d="M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.9 1.9 0 0 1-2.06 0L2 7" />
    </svg>
  )
}
