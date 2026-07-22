import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { LinkIcon } from '../components/LinkIcon'
import { PageMeta } from '../components/PageMeta'
import { TextLink } from '../components/TextLink'
import { TokenChip } from '../components/TokenChip'
import { getProject, type ProjectDetail } from '../lib/api'

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly project: ProjectDetail }
  | { readonly status: 'notfound' }

/**
 * A single project at its persistent public-identifier URL. The body is the API's
 * server-sanitized HTML, rendered as-is (React never renders Markdown or sanitizes -
 * CLAUDE.md). Any fetch failure, including a 404 for an unknown or draft public
 * identifier, lands on the in-voice not-found state with a way back to the index.
 */
export function ProjectDetailPage() {
  const { publicIdentifier } = useParams<{ publicIdentifier: string }>()
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    if (!publicIdentifier) {
      return
    }
    let active = true
    setLoad({ status: 'loading' })
    getProject(publicIdentifier)
      .then((project) => {
        if (active) {
          setLoad({ status: 'ready', project })
        }
      })
      .catch(() => {
        if (active) {
          setLoad({ status: 'notfound' })
        }
      })
    return () => {
      active = false
    }
  }, [publicIdentifier])

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <span aria-hidden="true">&larr;</span> All projects
      </Link>

      {load.status === 'loading' && <p className="text-muted">Loading the project&hellip;</p>}

      {load.status === 'notfound' && (
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Out of distribution</h1>
          <p className="text-muted">
            Nothing published answers to &ldquo;{publicIdentifier}&rdquo; - it may have moved, or never
            existed. Head <Link to="/projects" className="text-brand-700 underline dark:text-brand-300">back to the ones that do</Link>.
          </p>
        </div>
      )}

      {load.status === 'ready' && <ProjectBody project={load.project} />}
    </article>
  )
}

function ProjectBody({ project }: { project: ProjectDetail }) {
  return (
    <div className="space-y-6">
      <PageMeta title={`${project.title} - latent-space`} description={project.summary} />
      <header className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{project.title}</h1>
        <p className="text-lg text-muted">{project.summary}</p>

        {project.stack.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Stack">
            {project.stack.map((tech) => (
              <li key={tech}>
                <TokenChip tone="neutral">{tech}</TokenChip>
              </li>
            ))}
          </ul>
        )}

        {(project.repositoryUrl || project.demoUrl) && (
          <div className="flex flex-wrap items-center gap-4 pt-1">
            {project.repositoryUrl && (
              <TextLink
                href={project.repositoryUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 no-underline hover:underline"
              >
                <LinkIcon name="github" />
                Repository
              </TextLink>
            )}
            {project.demoUrl && (
              <TextLink href={project.demoUrl} target="_blank" rel="noreferrer noopener">
                Live demo <span aria-hidden="true">&#8599;</span>
              </TextLink>
            )}
          </div>
        )}
      </header>

      {project.coverImage && (
        <img
          src={project.coverImage}
          alt={`${project.title} cover`}
          className="w-full rounded-xl border border-border"
        />
      )}

      {/* Server-sanitized HTML (markdown-it-py with html=False, then the nh3 allowlist). */}
      <div
        className="ls-prose text-fg"
        dangerouslySetInnerHTML={{ __html: project.bodyHtml }}
      />
    </div>
  )
}
