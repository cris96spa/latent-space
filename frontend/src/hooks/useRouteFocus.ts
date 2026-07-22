import { useEffect, useRef, type RefObject } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * On each pathname change after the first render, moves keyboard focus to the main landmark
 * and scrolls to the top, so an SPA navigation behaves like a full-page load for assistive
 * tech. The first render is skipped so focus is not stolen on initial paint.
 */
export function useRouteFocus(mainRef: RefObject<HTMLElement | null>): void {
  const { pathname } = useLocation()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    mainRef.current?.focus()
    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0 })
    }
  }, [pathname, mainRef])
}
