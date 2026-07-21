import { Route, Routes } from 'react-router-dom'

import { RootLayout } from './layouts/RootLayout'
import { HomePage } from './pages/HomePage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { ProjectsPage } from './pages/ProjectsPage'

function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:slug" element={<ProjectDetailPage />} />
      </Route>
    </Routes>
  )
}

export default App
