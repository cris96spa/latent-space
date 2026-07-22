import { LinkIcon, type LinkIconName } from '../components/LinkIcon'
import { PageMeta } from '../components/PageMeta'
import { TextLink } from '../components/TextLink'
import { buttonClassName } from '../components/button-variants'
import { EXTERNAL_LINKS, RESUME_PDF } from '../lib/links'
import { PAGE_META } from '../lib/pageMeta'

interface ContactLink {
  readonly name: LinkIconName
  readonly label: string
  readonly href: string
  readonly external: boolean
}

const CONTACT_LINKS: readonly ContactLink[] = [
  { name: 'email', label: 'cristian.c.spagnuolo@gmail.com', href: EXTERNAL_LINKS.email, external: false },
  { name: 'github', label: 'cris96spa', href: EXTERNAL_LINKS.github, external: true },
  { name: 'linkedin', label: 'cristian-c-spagnuolo', href: EXTERNAL_LINKS.linkedin, external: true },
]

/**
 * The résumé & contact page (task 11): the CV embedded inline with download and
 * open-in-new-tab actions, plus the real, verified contact links. The PDF is a frontend
 * static asset served from a stable URL, so it stays reachable even when the API is down;
 * the fallback inside the `<object>` keeps the download working where inline preview does
 * not (often mobile). Direct links, no contact-form backend.
 */
export function ResumePage() {
  return (
    <div className="space-y-10">
      <PageMeta {...PAGE_META.resume} />
      <header className="max-w-2xl space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-700 dark:text-brand-300">
          the formal version
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Resume</h1>
        <p className="text-muted">
          Roles, dates, and grades... less fun than the rest of this site.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href={RESUME_PDF.path}
            download={RESUME_PDF.downloadName}
            className={buttonClassName('primary')}
          >
            <span aria-hidden="true">↓</span> Download PDF
          </a>
        </div>
      </header>

      <object
        data={`${RESUME_PDF.path}#view=FitH`}
        type="application/pdf"
        aria-label="Resume PDF preview"
        className="h-[75vh] min-h-96 w-full rounded-xl border border-border bg-surface"
      >
        <p className="p-6 text-sm text-muted">
          Your browser won&rsquo;t preview the PDF inline - the download link above still
          has you covered.
        </p>
      </object>

      <section aria-labelledby="contact-heading" className="max-w-2xl space-y-4">
        <h2 id="contact-heading" className="text-2xl font-semibold tracking-tight">
          Open an issue
        </h2>
        <p className="text-muted">
          A role, a collaboration, or just to say the loss curve looks nice. Based in Lugano,
          Switzerland.
        </p>
        <ul className="space-y-2.5">
          {CONTACT_LINKS.map((link) => (
            <li key={link.name}>
              <TextLink
                href={link.href}
                {...(link.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                className="inline-flex items-center gap-2 no-underline hover:underline"
              >
                <LinkIcon name={link.name} />
                {link.label}
              </TextLink>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
