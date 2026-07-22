import { useEffect, useState } from 'react'

import { TextLink } from '../../components/TextLink'
import { EXTERNAL_LINKS } from '../../lib/links'
import { TARGET_MODEL } from './architecture'
import { CANONICAL_BIO, HERO_PROMPT } from './content'
import { buildHeroForwardPass, idleHeroForwardPass, type HeroForwardPass } from './heroSource'
import { PipelineDiagram } from './PipelineDiagram'
import { PlaybackControls } from './PlaybackControls'
import { StreamingBio } from './StreamingBio'
import { TokenPromptPanel } from './TokenPromptPanel'
import type { TokenView } from './TokenizedText'
import { COMPACT_DIAGRAM_LAYOUT, FULL_DIAGRAM_LAYOUT } from './diagram/layout'
import { useForwardPass } from './useForwardPass'
import { usePrefersCompactDiagram, usePrefersReducedMotion } from '../../hooks/useMediaQuery'

/**
 * The landing-page hero. Fetches the real GPT-2 tokenization of the fixed prompt and bio
 * from the backend (falling back to the client pretokenizer if that call fails), plays it
 * through `useForwardPass`, and renders the decorative pipeline, the tokenized prompt
 * panel, and the streamed bio. The canonical bio is always present as real text (and in a
 * `<noscript>` block in `index.html`), so it never depends on the animation, JavaScript,
 * motion, or the network.
 */
export function ForwardPassHero() {
  const [hero, setHero] = useState<HeroForwardPass>(idleHeroForwardPass)
  const [view, setView] = useState<TokenView>('text')
  const reducedMotion = usePrefersReducedMotion()
  const compact = usePrefersCompactDiagram()
  const playback = useForwardPass(hero.source, { reducedMotion })
  const { frame, status } = playback
  const layout = compact ? COMPACT_DIAGRAM_LAYOUT : FULL_DIAGRAM_LAYOUT
  const effectiveView: TokenView = hero.idsAvailable ? view : 'text'

  useEffect(() => {
    let cancelled = false
    void buildHeroForwardPass().then((next) => {
      if (!cancelled) {
        setHero(next)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

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
          {'·'} greedy decoding
        </p>
        <h1 id="hero-heading" className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Who is <span className="text-brand-600 dark:text-brand-400">Cristian</span>?
        </h1>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface/60 shadow-glow">
        <div className="border-b border-border p-3 sm:p-4">
          <TokenPromptPanel
            tokens={hero.promptTokens}
            promptText={HERO_PROMPT}
            counts={hero.promptCounts}
            view={effectiveView}
            onViewChange={setView}
            idsAvailable={hero.idsAvailable}
          />
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
            kv cache {frame.kvCacheLength}/{TARGET_MODEL.contextLength} ctx {'·'}{' '}
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
          <div
            className="flex items-center justify-between gap-3 font-mono text-[11px] text-muted"
            aria-hidden="true"
          >
            <span>detokenized output</span>
            {hero.outputCounts && (
              <span>
                {`${hero.outputCounts.tokenCount} tokens · ${hero.outputCounts.wordCount} words · ${hero.outputCounts.charCount} chars`}
              </span>
            )}
          </div>
          <StreamingBio frame={frame} streaming={status === 'running'} view={effectiveView} />
        </div>
      </div>

      <p className="sr-only">{CANONICAL_BIO}</p>
    </section>
  )
}
