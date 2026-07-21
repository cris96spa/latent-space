import { useMemo } from 'react'

import { TextLink } from '../../components/TextLink'
import { EXTERNAL_LINKS } from '../../lib/links'
import { TARGET_MODEL } from './architecture'
import { CANONICAL_BIO, HERO_PROMPT } from './content'
import { PipelineDiagram } from './PipelineDiagram'
import { PlaybackControls } from './PlaybackControls'
import { StreamingBio } from './StreamingBio'
import { COMPACT_DIAGRAM_LAYOUT, FULL_DIAGRAM_LAYOUT } from './diagram/layout'
import { createHeroForwardPassSource } from './scriptedSource'
import { useForwardPass } from './useForwardPass'
import { usePrefersCompactDiagram, usePrefersReducedMotion } from '../../hooks/useMediaQuery'

/**
 * The landing-page hero. Instantiates the scripted forward-pass source, plays it
 * through `useForwardPass`, and renders the decorative pipeline plus the streamed
 * bio. The canonical bio is always present as real text (and in a `<noscript>` block
 * in `index.html`) so it never depends on the animation, JavaScript, or motion.
 */
export function ForwardPassHero() {
  const source = useMemo(() => createHeroForwardPassSource(), [])
  const reducedMotion = usePrefersReducedMotion()
  const compact = usePrefersCompactDiagram()
  const playback = useForwardPass(source, { reducedMotion })
  const { frame, status } = playback
  const layout = compact ? COMPACT_DIAGRAM_LAYOUT : FULL_DIAGRAM_LAYOUT

  return (
    <section aria-labelledby="hero-heading" className="space-y-8">
      <div className="space-y-4">
        <p className="font-mono text-xs tracking-widest text-muted uppercase">
          <TextLink
            href={EXTERNAL_LINKS.gpt2Model}
            target="_blank"
            rel="noreferrer noopener"
            className="font-mono"
          >
            {TARGET_MODEL.label}
          </TextLink>{' '}
          · greedy decoding
        </p>
        <h1 id="hero-heading" className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Who is <span className="text-brand-600 dark:text-brand-400">Cristian</span>?
        </h1>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface/60 shadow-glow">
        <div className="border-b border-border p-3 sm:p-4" aria-hidden="true">
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background/50 px-3 py-2">
            <span className="shrink-0 font-mono text-[11px] tracking-widest text-brand-700 uppercase dark:text-brand-400">
              prompt
            </span>
            <span className="truncate font-mono text-sm text-fg">{HERO_PROMPT}</span>
          </div>
        </div>

        <div
          className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 font-mono text-[11px] text-muted"
          aria-hidden="true"
        >
          <span className="flex items-center gap-2">
            <span
              className={
                status === 'running'
                  ? 'inline-block size-2 rounded-full bg-brand-500 [animation:ls-pulse_1s_ease-in-out_infinite]'
                  : 'inline-block size-2 rounded-full bg-border'
              }
            />
            {frame.phase}
            {frame.activeStage ? ` · ${frame.activeStage}` : ''}
          </span>
          <span>
            kv cache {frame.kvCacheLength}/{TARGET_MODEL.contextLength} ctx ·{' '}
            {TARGET_MODEL.blockCount} blocks
          </span>
        </div>

        <div className="p-3 sm:p-5">
          <PipelineDiagram frame={frame} layout={layout} />
        </div>

        <div className="border-t border-border p-4 sm:p-6">
          <PlaybackControls playback={playback} />
        </div>

        <div className="space-y-2 border-t border-border bg-background/40 p-4 sm:p-6">
          <p className="font-mono text-[11px] text-muted" aria-hidden="true">
            detokenized output
          </p>
          <StreamingBio frame={frame} streaming={status === 'running'} />
        </div>
      </div>

      <p className="sr-only">{CANONICAL_BIO}</p>
    </section>
  )
}
