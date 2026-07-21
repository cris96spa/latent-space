import { useCallback, useSyncExternalStore } from 'react'

import type { Theme } from '../lib/theme'

/**
 * The active theme, tracked by observing the `dark` class the theme toggle writes to
 * `<html>`. Unlike `usePrefersReducedMotion`, this follows the user's explicit choice
 * (persisted in `ls-theme`), not the OS media query, so canvas-based visuals that cannot
 * read CSS variables reactively - the Plotly sweep - can re-theme when it flips.
 */
export function useTheme(): Theme {
  const subscribe = useCallback((onChange: () => void) => {
    if (typeof document === 'undefined') {
      return () => {}
    }
    const observer = new MutationObserver(onChange)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const getSnapshot = useCallback((): Theme => {
    if (typeof document === 'undefined') {
      return 'light'
    }
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  }, [])

  return useSyncExternalStore(subscribe, getSnapshot, () => 'light')
}
