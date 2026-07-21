import { lazy, Suspense } from 'react'

import { ENGINEERING_VIRTUES, RADAR_CAPTION, VIRTUE_SCALE_MAX } from './virtues'

// Lazily loaded so Plotly stays in its own chunk, off the main bundle - it only downloads
// once the home page's vocabulary section renders.
const SkillsRadar = lazy(() => import('./SkillsRadar'))

function RadarFallback() {
  return (
    <div className="mt-2 flex h-[26rem] w-full items-center justify-center rounded-lg border border-border bg-background/60 font-mono text-xs text-muted">
      calibrating self-eval…
    </div>
  )
}

/**
 * The engineering-virtues radar plus its accessible twin. The Plotly figure is decorative
 * (`aria-hidden` inside `SkillsRadar`); the visually-hidden list here is the real content
 * assistive tech reads, so the ratings never depend on the canvas rendering.
 */
export function SkillsRadarSection() {
  return (
    <div className="mt-10 space-y-3">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        self-eval · unreliable
      </p>

      <Suspense fallback={<RadarFallback />}>
        <SkillsRadar />
      </Suspense>

      <p className="max-w-2xl font-mono text-xs text-muted">{RADAR_CAPTION}</p>

      <ul className="sr-only">
        {ENGINEERING_VIRTUES.map((virtue) => (
          <li key={virtue.label}>
            {virtue.label}: {virtue.rating} out of {VIRTUE_SCALE_MAX}. {virtue.caption}
          </li>
        ))}
      </ul>
    </div>
  )
}
