import { useEffect, useRef, type RefObject } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * On each pathname change after the first render, moves keyboard focus to the main landmark
 * and scrolls to the top, so an SPA navigation behaves like a full-page load for assistive
 * tech. The first render is skipped so focus is not stolen on initial paint.
 */
export function useRouteFocus(mainRef: RefObject<HTMLElement | null>): void {
  const { pathname } = useLocation()
  const previousPathname = useRef<string | null>(null)

  useEffect(() => {
    // Skip the initial render (previousPathname is null) and any StrictMode replay where the
    // pathname is unchanged; only a real navigation moves focus + scrolls.
    if (previousPathname.current !== null && previousPathname.current !== pathname) {
      mainRef.current?.focus()
      if (typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0 })
      }
    }
    previousPathname.current = pathname
  }, [pathname, mainRef])
}
