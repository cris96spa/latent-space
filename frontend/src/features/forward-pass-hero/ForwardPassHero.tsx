import { useMemo } from 'react'

import { ButtonLink } from '../../components/ButtonLink'
import { LinkIcon } from '../../components/LinkIcon'
import { TextLink } from '../../components/TextLink'
import { EXTERNAL_LINKS } from '../../lib/links'
import { TARGET_MODEL } from './architecture'
import { CANONICAL_BIO } from './content'
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
          · scripted · greedy decoding
        </p>
        <h1 id="hero-heading" className="text-4xl font-semibold tracking-tight sm:text-6xl">
          who is <span className="text-brand-600 dark:text-brand-400">Cristian</span>?
        </h1>
        <p className="max-w-2xl text-sm text-muted">
          The prompt is split by GPT-2's pretokenizer, prefilled in one pass, then decoded a chunk
          at a time. The answer is scripted; the transformer plumbing is not. Scrub it if you want
          to catch the model mid-thought.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface/60 shadow-glow">
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
            kv {frame.kvCacheLength}/{TARGET_MODEL.contextLength} · {TARGET_MODEL.blockCount} blocks
          </span>
        </div>

        <div className="p-3 sm:p-5">
          <PipelineDiagram frame={frame} layout={layout} />
        </div>

        <div className="space-y-2 border-t border-border bg-background/40 p-4 sm:p-6">
          <p className="font-mono text-[11px] text-muted" aria-hidden="true">
            detokenized output · one box, one pretoken chunk
          </p>
          <StreamingBio frame={frame} streaming={status === 'running'} />
        </div>

        <div className="border-t border-border p-4 sm:p-6">
          <PlaybackControls playback={playback} />
        </div>
      </div>

      <p className="sr-only">{CANONICAL_BIO}</p>

      <div className="flex flex-wrap gap-3">
        <ButtonLink href={EXTERNAL_LINKS.github} target="_blank" rel="noreferrer noopener">
          <LinkIcon name="github" />
          Read the source
        </ButtonLink>
        <ButtonLink
          variant="ghost"
          href={EXTERNAL_LINKS.linkedin}
          target="_blank"
          rel="noreferrer noopener"
        >
          <LinkIcon name="linkedin" />
          The formal narrative
        </ButtonLink>
      </div>
    </section>
  )
}
