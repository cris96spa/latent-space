import { lazy, Suspense, useState } from 'react'

import { cn } from '../../lib/cn'
import { ENGINEERING_VIRTUES, QUIRKS_CAPTION, STRENGTHS_CAPTION, VIRTUE_SCALE_MAX } from './virtues'

// Lazily loaded so Plotly stays in its own chunk, off the main bundle. One instance renders at a
// time; switching the selector re-runs it with the other polarity.
const PolarityRadar = lazy(() => import('./PolarityRadar'))

type SelfEvalView = 'strengths' | 'quirks'

// Strengths on the left of the selector, quirks on the right.
const VIEWS: readonly { value: SelfEvalView; label: string }[] = [
  { value: 'strengths', label: 'strengths' },
  { value: 'quirks', label: 'quirks' },
]

function ViewToggle({ view, onChange }: { view: SelfEvalView; onChange: (next: SelfEvalView) => void }) {
  return (
    <fieldset className="inline-flex rounded-lg border border-border bg-surface p-1">
      <legend className="sr-only">Self-eval view</legend>
      {VIEWS.map((option) => {
        const selected = option.value === view
        return (
          <label
            key={option.value}
            className={cn(
              'cursor-pointer rounded-md px-3 py-1 font-mono text-xs motion-safe:transition-colors',
              'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-700',
              selected ? 'bg-brand-700 font-semibold text-white' : 'text-muted hover:text-fg',
            )}
          >
            <input
              type="radio"
              name="self-eval-view"
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        )
      })}
    </fieldset>
  )
}

function RadarFallback() {
  return (
    <div className="mt-2 flex h-[30rem] w-full items-center justify-center rounded-lg border border-border bg-background/60 font-mono text-xs text-muted">
      calibrating self-eval…
    </div>
  )
}

/**
 * The engineering-virtues self-eval, toggleable between a strengths radar and a quirks radar over
 * the same scores. Both are decorative (`aria-hidden`); the visually-hidden list here is the real
 * content assistive tech reads and is always present, so the numbers never depend on the rendering
 * or on which side is selected.
 */
export function SelfEvalSection() {
  const [view, setView] = useState<SelfEvalView>('strengths')

  return (
    <div className="mt-10 space-y-3">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">self-eval · n=1</p>

      <ViewToggle view={view} onChange={setView} />

      <Suspense fallback={<RadarFallback />}>
        <PolarityRadar polarity={view === 'strengths' ? 'positive' : 'negative'} />
      </Suspense>

      <p className="mx-auto max-w-2xl text-center font-mono text-xs text-muted">
        {view === 'strengths' ? STRENGTHS_CAPTION : QUIRKS_CAPTION}
      </p>

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
