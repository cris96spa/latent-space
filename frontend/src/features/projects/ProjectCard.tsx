import { Link } from 'react-router-dom'

import { Card } from '../../components/Card'
import { LinkIcon } from '../../components/LinkIcon'
import { TextLink } from '../../components/TextLink'
import { TokenChip } from '../../components/TokenChip'
import type { Project } from '../../lib/api'

/**
 * One project on the index grid: title (linking to the detail route), summary, its
 * stack as token chips, and an out-link to the repository. The repo link is pushed to
 * the bottom with `mt-auto` so cards keep a common baseline in the grid.
 */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="flex h-full flex-col gap-4 transition-colors hover:border-brand-300">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">
          <Link
            to={`/projects/${project.publicIdentifier}`}
            className="text-fg transition-colors hover:text-brand-700 dark:hover:text-brand-300"
          >
            {project.title}
          </Link>
        </h2>
        <p className="text-sm text-muted">{project.summary}</p>
      </div>

      {project.stack.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Stack">
          {project.stack.map((tech) => (
            <li key={tech}>
              <TokenChip tone="neutral">{tech}</TokenChip>
            </li>
          ))}
        </ul>
      )}

      {project.repositoryUrl && (
        <div className="mt-auto pt-1">
          <TextLink
            href={project.repositoryUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-sm no-underline hover:underline"
          >
            <LinkIcon name="github" />
            Repository
          </TextLink>
        </div>
      )}
    </Card>
  )
}
