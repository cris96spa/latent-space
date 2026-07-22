import { StrictMode, useRef } from 'react'

import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { useRouteFocus } from './useRouteFocus'

function Harness() {
  const mainRef = useRef<HTMLElement>(null)
  useRouteFocus(mainRef)
  const navigate = useNavigate()
  return (
    <main id="main-content" ref={mainRef} tabIndex={-1}>
      <button type="button" onClick={() => navigate('/projects')}>
        go
      </button>
      <Routes>
        <Route path="/" element={<p>home</p>} />
        <Route path="/projects" element={<p>projects</p>} />
      </Routes>
    </main>
  )
}

describe('useRouteFocus', () => {
  it('does not steal focus on the first render', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Harness />
      </MemoryRouter>,
    )
    expect(document.activeElement).toBe(document.body)
  })

  it('does not steal focus on first render even under StrictMode double-invocation', () => {
    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/']}>
          <Harness />
        </MemoryRouter>
      </StrictMode>,
    )
    expect(document.activeElement).toBe(document.body)
  })

  it('moves focus to the main landmark after a route change', async () => {
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/']}>
        <Harness />
      </MemoryRouter>,
    )
    getByRole('button', { name: 'go' }).click()
    // Focus moves on the effect that runs after the navigation commit; waitFor polls until then.
    await waitFor(() => expect(document.activeElement).toBe(getByRole('main')))
  })
})
