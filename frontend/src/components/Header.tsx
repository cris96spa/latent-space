import { Link } from 'react-router-dom'

import { EXTERNAL_LINKS } from '../lib/links'
import { LinkIcon } from './LinkIcon'
import { TextLink } from './TextLink'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="inline-flex items-baseline gap-2" aria-label="latent-space, home">
          <span className="font-mono text-sm text-brand-500" aria-hidden="true">
            {'>_'}
          </span>
          <span className="text-lg font-semibold tracking-tight">
            latent<span className="text-brand-600 dark:text-brand-400">-space</span>
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            to="/projects"
            className="font-medium text-fg transition-colors hover:text-brand-700 dark:hover:text-brand-300"
          >
            Projects
          </Link>
          <Link
            to="/resume"
            className="font-medium text-fg transition-colors hover:text-brand-700 dark:hover:text-brand-300"
          >
            Resume
          </Link>
          <TextLink
            href={EXTERNAL_LINKS.github}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5"
          >
            <LinkIcon name="github" />
            GitHub
          </TextLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
