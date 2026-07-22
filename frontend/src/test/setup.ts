import { afterEach, expect } from 'vitest'

// DOM-only wiring, guarded so this shared setup stays inert for the node-env (*.test.ts)
// suites. jest-dom's DOM matchers, axe, and Testing Library cleanup are only meaningful when a
// document exists, so they are registered dynamically inside the guard.
if (typeof window !== 'undefined') {
  await import('@testing-library/jest-dom/vitest')

  const axeMatchers = await import('vitest-axe/matchers')
  expect.extend(axeMatchers)

  const { cleanup } = await import('@testing-library/react')
  afterEach(cleanup)

  // jsdom does not implement matchMedia, which useMediaQuery/usePrefersReducedMotion call.
  // Default every query to "no match"; individual tests override window.matchMedia as needed.
  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList
  }
}
