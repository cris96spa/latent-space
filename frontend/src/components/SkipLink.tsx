/**
 * A "skip to content" anchor: visually hidden until focused, then the first thing a keyboard
 * user reaches. Targets the `#main-content` landmark in `RootLayout`.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only rounded-lg border border-border bg-surface px-4 py-2 text-sm text-fg focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
    >
      Skip to content
    </a>
  )
}
