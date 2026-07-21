import { useEffect, useState } from 'react'

import { Button } from '../components/Button'
import { ProjectCard } from '../features/projects/ProjectCard'
import { getProjects, type Project } from '../lib/api'

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly projects: readonly Project[] }
  | { readonly status: 'error' }

/**
 * The projects index: the authored projects from the content API rendered as a card
 * grid. No hard-coded project data (CLAUDE.md) - the list, order, and drafts filtering
 * all come from the backend. Loading, error, and empty states are in voice.
 */
export function ProjectsPage() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let active = true
    setLoad({ status: 'loading' })
    getProjects()
      .then((projects) => {
        if (active) {
          setLoad({ status: 'ready', projects })
        }
      })
      .catch(() => {
        if (active) {
          setLoad({ status: 'error' })
        }
      })
    return () => {
      active = false
    }
  }, [reloadToken])

  return (
    <section className="space-y-8">
      <header className="max-w-2xl space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-700 dark:text-brand-300">
          checkpoints
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Projects</h1>
        <p className="text-muted">
          The things I build to actually understand them &mdash; usually by rebuilding them from
          scratch. Weights not included; the code is.
        </p>
      </header>

      {load.status === 'loading' && <p className="text-muted">Loading the checkpoints&hellip;</p>}

      {load.status === 'error' && (
        <div className="space-y-3">
          <p className="text-muted">
            The projects didn&rsquo;t load &mdash; the content service might still be warming up.
          </p>
          <Button variant="ghost" onClick={() => setReloadToken((token) => token + 1)}>
            Retry
          </Button>
        </div>
      )}

      {load.status === 'ready' && load.projects.length === 0 && (
        <p className="text-muted">No published projects yet &mdash; they&rsquo;re still training.</p>
      )}

      {load.status === 'ready' && load.projects.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {load.projects.map((project) => (
            <li key={project.publicIdentifier}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
