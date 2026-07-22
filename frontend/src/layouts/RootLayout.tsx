import { Suspense, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { SkipLink } from '../components/SkipLink'
import { useRouteFocus } from '../hooks/useRouteFocus'

/** In-voice fallback while a lazily-loaded route chunk (Task 9) resolves. */
function PageLoading() {
  return (
    <p role="status" className="text-muted">
      Loading the next layer&hellip;
    </p>
  )
}

export function RootLayout() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  useRouteFocus(mainRef)

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <Header />
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        key={location.pathname}
        className="flex-1 [animation:rise-in_0.3s_var(--ease-out-expo)] focus:outline-none"
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <Footer />
      <Analytics />
      <SpeedInsights />
    </div>
  )
}
