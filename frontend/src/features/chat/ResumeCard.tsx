import { RESUME_PDF } from '../../lib/links'

/**
 * The résumé shown inline in a chat answer: an embedded PDF preview with a download
 * button and an open-in-new-tab link. The `<object>` renders the PDF where the browser
 * supports it; where it does not (often mobile), the fallback content inside it appears,
 * and the buttons below work regardless - so the résumé is always reachable.
 */
export function ResumeCard() {
  return (
    <div className="mt-3 space-y-3 rounded-lg border border-border bg-background/60 p-3">
      <object
        data={`${RESUME_PDF.path}#view=FitH`}
        type="application/pdf"
        aria-label="Resume PDF preview"
        className="h-[70vh] min-h-[24rem] w-full rounded-md border border-border bg-surface"
      >
        <p className="p-4 text-sm text-muted">
          Your browser won't preview the PDF inline - the button below still has you
          covered.
        </p>
      </object>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={RESUME_PDF.path}
          download={RESUME_PDF.downloadName}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800"
        >
          <span aria-hidden="true">↓</span>
          Download PDF
        </a>
      </div>
    </div>
  )
}
