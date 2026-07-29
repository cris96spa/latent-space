import { Link, NavLink } from 'react-router-dom'

import { cn } from '../lib/cn'
import { EXTERNAL_LINKS } from '../lib/links'
import { LinkIcon } from './LinkIcon'
import { TextLink } from './TextLink'
import { ThemeToggle } from './ThemeToggle'

/** Active nav links reuse the hover brand tone — a lightness shift, not a new hue (CVD-safe). */
const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    'font-medium transition-colors hover:text-brand-700 dark:hover:text-brand-300',
    isActive ? 'text-brand-700 dark:text-brand-300' : 'text-fg',
  )

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      {/*
        The wordmark and the nav need 450px side by side, so on a phone the nav takes a line
        of its own rather than squeezing the wordmark into two lines (which is what it did)
        or pushing the whole page sideways. `whitespace-nowrap` keeps the wordmark on one
        line now that it has the room, and the shorter mobile padding pays for the extra row.
      */}
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:flex-nowrap sm:px-6 sm:py-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 whitespace-nowrap"
          aria-label="latent-space, home"
        >
          <img src="/favicon.png" alt="" aria-hidden="true" className="size-7" />
          <span className="font-mono text-sm text-brand-500" aria-hidden="true">
            {'>_'}
          </span>
          <span className="text-lg font-semibold tracking-tight">
            latent<span className="text-brand-700 dark:text-brand-400">-space</span>
          </span>
        </Link>
        <nav
          className="flex w-full items-center justify-between gap-4 text-sm sm:w-auto sm:justify-end"
          aria-label="Primary"
        >
          <NavLink
            to="/projects"
            className={navLinkClassName}
          >
            Projects
          </NavLink>
          <NavLink
            to="/writing"
            className={navLinkClassName}
          >
            Writing
          </NavLink>
          <NavLink
            to="/resume"
            className={navLinkClassName}
          >
            Resume
          </NavLink>
          <TextLink
            href={EXTERNAL_LINKS.github}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5"
            aria-label="GitHub"
          >
            <LinkIcon name="github" />
          </TextLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
