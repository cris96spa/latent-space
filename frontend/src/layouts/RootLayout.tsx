import { Outlet } from 'react-router-dom'

export function RootLayout() {
  return (
    <main>
      <Outlet />
    </main>
  )
}
