import { Outlet, useLocation } from 'react-router-dom'

import { Footer } from '../components/Footer'
import { Header } from '../components/Header'

export function RootLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main key={location.pathname} className="flex-1 [animation:rise-in_0.3s_var(--ease-out-expo)]">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}
