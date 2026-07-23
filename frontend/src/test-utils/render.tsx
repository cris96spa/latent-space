import type { ReactElement, ReactNode } from 'react'

import { render, type RenderResult } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

interface RenderInAppOptions {
  /** Initial router entry; defaults to the home route. */
  route?: string
}

/**
 * Renders `ui` inside a router and a `<main>` landmark, so route-aware components work and
 * axe's region/landmark rules see a realistic page shell (avoiding false "region" violations
 * on section-level fragments).
 */
export function renderInApp(ui: ReactElement, { route = '/' }: RenderInAppOptions = {}): RenderResult {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <main>{children}</main>
      </MemoryRouter>
    )
  }
  return render(ui, { wrapper: Wrapper })
}
