import { EXTERNAL_LINKS } from '../lib/links'
import { LinkIcon } from './LinkIcon'
import { TextLink } from './TextLink'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-mono text-xs">
          © {year} Cristian C. Spagnuolo ·{' '}
          <span className="text-brand-700 dark:text-brand-400">no weights were harmed</span>
        </p>
        <nav className="flex items-center gap-4" aria-label="Social">
          <TextLink
            href={EXTERNAL_LINKS.github}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5"
          >
            <LinkIcon name="github" />
          </TextLink>
          <TextLink
            href={EXTERNAL_LINKS.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5"
          >
            <LinkIcon name="linkedin" />
          </TextLink>
          <TextLink href={EXTERNAL_LINKS.email} className="inline-flex items-center gap-1.5">
            <LinkIcon name="email" />
          </TextLink>
        </nav>
      </div>
    </footer>
  )
}
