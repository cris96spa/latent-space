import { useEffect, type RefObject } from 'react'

import { WORD_CLASS } from './revealHtml'

/**
 * Reveals the first `shown` word spans inside the container and hides the rest, so an
 * answer types in a word at a time. Timing lives in `useChat`; this hook only reflects
 * the current count onto the DOM. It is a no-op unless the container also carries the
 * `is-revealing` class, so completed and static answers stay fully visible.
 */
export function useTypedReveal(containerRef: RefObject<HTMLElement | null>, shown: number): void {
  useEffect(() => {
    const container = containerRef.current
    if (container === null) {
      return
    }
    const words = container.querySelectorAll<HTMLElement>(`.${WORD_CLASS}`)
    words.forEach((word, index) => {
      word.classList.toggle('is-shown', index < shown)
      // The most-recently revealed word carries the blinking write-head cursor.
      word.classList.toggle('is-head', index === shown - 1)
    })
  }, [containerRef, shown])
}
