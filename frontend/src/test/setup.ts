import '@testing-library/jest-dom/vitest'
import 'vitest-axe/extend-expect'

import * as axeMatchers from 'vitest-axe/matchers'
import { afterEach, expect } from 'vitest'

expect.extend(axeMatchers)

// DOM-only wiring, guarded so this shared setup stays inert for the node-env (*.test.ts)
// suites. Testing Library is imported dynamically only when a document exists.
if (typeof window !== 'undefined') {
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
