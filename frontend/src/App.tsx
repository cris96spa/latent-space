import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'

import { RootLayout } from './layouts/RootLayout'

// Each page is its own chunk, loaded on navigation, so the entry bundle stays lean as content
// grows. Pages are named exports, hence the `.then` default mapping. Plotly stays lazy inside
// the feature components it belongs to.
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })))
const ProjectsPage = lazy(() =>
  import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })),
)
const ProjectDetailPage = lazy(() =>
  import('./pages/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })),
)
const ResumePage = lazy(() => import('./pages/ResumePage').then((m) => ({ default: m.ResumePage })))
const WritingPage = lazy(() =>
  import('./pages/WritingPage').then((m) => ({ default: m.WritingPage })),
)
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:publicIdentifier" element={<ProjectDetailPage />} />
        <Route path="resume" element={<ResumePage />} />
        <Route path="writing" element={<WritingPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
