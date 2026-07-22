import { Link } from 'react-router-dom'

import { buttonClassName } from '../components/button-variants'

/**
 * The catch-all 404. Deliberately minimal (Cristian's request): the logo, the error, and one
 * way back. A static SPA cannot set a real 404 HTTP status without server involvement, so this
 * is a friendly rendered 404, not a status code.
 */
export function NotFound() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <img src="/favicon.png" alt="latent-space" className="size-14" />
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-700 dark:text-brand-300">
          404 · token not in vocabulary
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">This route never trained</h1>
        <p className="text-muted">
          Nothing here answers to that URL &mdash; it may have moved, or only ever existed in a
          hallucination. Everything real is one hop back.
        </p>
      </div>
      <Link to="/" className={buttonClassName('primary')}>
        Back to the input layer
      </Link>
    </section>
  )
}
