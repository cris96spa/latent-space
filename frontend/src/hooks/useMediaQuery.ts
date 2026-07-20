import { useCallback, useSyncExternalStore } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
/** Below Tailwind's `md` breakpoint, wide diagrams' labels stop being readable. */
const COMPACT_VIEWPORT_QUERY = '(max-width: 767px)'

/** Tracks a media query, updating when it changes. Server snapshots report `false`. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return () => {}
      }
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false
    }
    return window.matchMedia(query).matches
  }, [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION_QUERY)
}

/** True when the viewport is too narrow for a wide, label-heavy diagram. */
export function usePrefersCompactDiagram(): boolean {
  return useMediaQuery(COMPACT_VIEWPORT_QUERY)
}
