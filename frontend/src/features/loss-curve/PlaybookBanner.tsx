import { useRef, useState, type MouseEvent } from 'react'

import { cn } from '../../lib/cn'
import { EXTERNAL_LINKS } from '../../lib/links'
import { BANNER_CATEGORIES, BANNER_RUNS, BANNER_VIEW } from './banner.data'

/** A hovered run, keyed by category + run because short run names repeat across families. */
interface HoveredRun {
  readonly category: string
  readonly run: string
  readonly x: number
  readonly y: number
}

/**
 * One evenly spaced hue per category, replicating the original banner's generated
 * rainbow. Literals rather than theme tokens because the piece renders on its own fixed
 * near-black canvas in both themes, exactly like the artwork it reproduces.
 */
function categoryColor(index: number): string {
  return `hsl(${25 + index * 35}, 70%, 60%)`
}

/**
 * A faithful rebuild of the Smol Training Playbook's hero banner (CC-BY 4.0): 29 of the
 * team's real ablation loss curves in log-log space, aligned and waterfall-offset like
 * the original, drawn as plain SVG from `banner.data.ts`. The canvas stays near-black in
 * both themes - it is a reproduction of a dark artwork, not themed chrome. Categories are
 * separated by more than hue: the waterfall is spatially grouped per category in legend
 * order, and hovering or focusing a legend chip isolates its runs, so the grouping
 * survives colour-vision deficiency. Individual curves carry a cursor-following tooltip
 * via fat invisible hit strokes, like the original; the screen-reader description carries
 * the same facts the visual asserts.
 */
export function PlaybookBanner() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [hovered, setHovered] = useState<HoveredRun | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const moveTooltip = (category: string, run: string) => (event: MouseEvent<SVGElement>) => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return
    }
    const bounds = canvas.getBoundingClientRect()
    setHovered({
      category,
      run,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    })
  }

  const hoveredLabel =
    hovered === null
      ? null
      : (BANNER_CATEGORIES.find((category) => category.key === hovered.category)?.label ??
        hovered.category)

  return (
    <figure className="mt-3 space-y-3">
      <div
        ref={canvasRef}
        className="relative overflow-hidden rounded-lg border border-border bg-[#0b0b0f] p-4 sm:p-5"
      >
        <svg
          viewBox={`0 0 ${BANNER_VIEW.width} ${BANNER_VIEW.height}`}
          className="h-auto w-full"
          role="img"
          aria-label="29 real ablation training-loss curves from the Smol Training Playbook, one colour per hyperparameter family, cascading down and to the right as every run's loss falls."
        >
          {BANNER_RUNS.map((run) => {
            const categoryIndex = BANNER_CATEGORIES.findIndex(
              (category) => category.key === run.category,
            )
            const isHovered =
              hovered !== null && hovered.category === run.category && hovered.run === run.run
            const ghosted =
              (activeCategory !== null && activeCategory !== run.category) ||
              (hovered !== null && !isHovered)
            return (
              <polyline
                key={`${run.category}-${run.run}`}
                points={run.points}
                fill="none"
                stroke={categoryColor(categoryIndex)}
                strokeWidth={isHovered ? 3 : 2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className={cn('motion-safe:transition-opacity', ghosted && 'opacity-15')}
              />
            )
          })}
          {/* Fat invisible strokes over each curve, so a 2px line has an honest hit target.
              Drawn after every visible line to keep hover capture above the artwork. */}
          {BANNER_RUNS.map((run) => (
            <polyline
              key={`hit-${run.category}-${run.run}`}
              points={run.points}
              fill="none"
              stroke="transparent"
              strokeWidth={12}
              vectorEffect="non-scaling-stroke"
              style={{ pointerEvents: 'stroke' }}
              onMouseEnter={moveTooltip(run.category, run.run)}
              onMouseMove={moveTooltip(run.category, run.run)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>

        {hovered !== null && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-10 rounded-md border border-white/15 bg-[#15151c] px-2.5 py-1.5 shadow-lg"
            style={{
              left: Math.min(hovered.x + 14, (canvasRef.current?.clientWidth ?? 0) - 190),
              top: Math.max(hovered.y - 44, 8),
            }}
          >
            <p className="flex items-center gap-1.5 font-mono text-[11px] text-white/90">
              <span
                className="inline-block size-2 rounded-[2px]"
                style={{
                  backgroundColor: categoryColor(
                    BANNER_CATEGORIES.findIndex((category) => category.key === hovered.category),
                  ),
                }}
              />
              {hovered.run}
            </p>
            <p className="font-mono text-[10px] text-white/55">{hoveredLabel}</p>
          </div>
        )}

        <div className="mt-4 space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">
            run types
          </p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1.5" aria-label="Highlight runs by hyperparameter family">
            {BANNER_CATEGORIES.map((category, index) => (
              <li key={category.key}>
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-1.5 font-mono text-[11px] text-white/80 motion-safe:transition-opacity',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400',
                    activeCategory !== null && activeCategory !== category.key && 'opacity-40',
                  )}
                  onMouseEnter={() => setActiveCategory(category.key)}
                  onMouseLeave={() => setActiveCategory(null)}
                  onFocus={() => setActiveCategory(category.key)}
                  onBlur={() => setActiveCategory(null)}
                >
                  <span
                    aria-hidden="true"
                    className="inline-block size-2.5 rounded-[3px]"
                    style={{ backgroundColor: categoryColor(index) }}
                  />
                  {category.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figcaption className="font-mono text-[11px] text-muted">
        Real ablation runs from the{' '}
        <a
          href={EXTERNAL_LINKS.smolPlaybook}
          target="_blank"
          rel="noreferrer noopener"
          className="underline decoration-border underline-offset-2 hover:text-fg"
        >
          Smol Training Playbook
        </a>{' '}
        (Hugging Face, CC-BY 4.0) - replotted, not simulated.
      </figcaption>
    </figure>
  )
}
