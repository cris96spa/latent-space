import { useState } from 'react'

import { TokenChip } from '../../components/TokenChip'
import { cn } from '../../lib/cn'
import { SkillsRadarSection } from '../skills-radar'
import { VOCABULARY_TOKENS } from './tokens'

type TokenView = 'humans' | 'llms'

const VIEWS: readonly { value: TokenView; label: string }[] = [
  { value: 'humans', label: 'For Humans' },
  { value: 'llms', label: 'For LLMs' },
]

function ViewToggle({ view, onChange }: { view: TokenView; onChange: (next: TokenView) => void }) {
  return (
    <fieldset className="inline-flex rounded-lg border border-border bg-surface p-1">
      <legend className="sr-only">Token view</legend>
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
              name="token-view"
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

export function VocabularySection() {
  const [view, setView] = useState<TokenView>('humans')

  return (
    <section aria-labelledby="vocabulary-heading" className="space-y-6">
      <div className="max-w-2xl space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">vocabulary</p>
        <h2 id="vocabulary-heading" className="text-4xl font-semibold tracking-tight sm:text-5xl">
          The tokens in my vocabulary
        </h2>
      </div>

      <ViewToggle view={view} onChange={setView} />

      <ul className="flex flex-wrap gap-2" aria-label="Skills and tooling">
        {VOCABULARY_TOKENS.map((token) => {
          const ids = token.ids.join(' ')
          const showingIds = view === 'llms'
          // The tooltip reveals the *other* representation, labelled the way a tokenizer
          // names them: `input_ids` for the integer vector, `text` for the decoded string.
          const tooltipLabel = showingIds ? 'text' : 'input_ids'
          const tooltipValue = showingIds ? token.label : ids
          return (
            <li key={token.label} className="group relative">
              <TokenChip
                tone="neutral"
                aria-label={`${token.label} — GPT-2 token IDs ${ids}`}
              >
                {showingIds ? ids : token.label}
              </TokenChip>
              {/* Mouse-only cross-reference. Each chip's aria-label already carries both
                  representations, so this is decorative for assistive tech. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-fg px-2 py-1 text-background opacity-0 shadow-md group-hover:opacity-100 motion-safe:transition-opacity"
              >
                <span className="block font-mono text-[10px] uppercase tracking-wider text-background/70">
                  {tooltipLabel}
                </span>
                <span className="block font-mono text-xs">{tooltipValue}</span>
              </span>
            </li>
          )
        })}
      </ul>

      <SkillsRadarSection />
    </section>
  )
}
