import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '../../components/Button'
import { getChatEntries, type ChatEntry } from '../../lib/api'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { ChatComposer } from './ChatComposer'
import { ChatTranscript } from './ChatTranscript'
import { ABLATION_SWEEP_SLUG, CHAT_COPY } from './content'
import { createScriptedResponder } from './scriptedResponder'
import { SuggestedPrompts } from './SuggestedPrompts'
import { useChat } from './useChat'

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly entries: readonly ChatEntry[] }
  | { readonly status: 'error' }

/** Stable empty reference so the responder memo does not churn before entries load. */
const EMPTY_ENTRIES: readonly ChatEntry[] = []

/**
 * The scripted-chat home-page section: fetches the authored entries, then lets a visitor
 * pick or type a question and watch the answer stream in. The answers are authored
 * content served by the API, never inline data; the streaming, matching, and reveal all
 * sit behind the `ChatResponder` seam so a real model (task 15) can replace the scripted
 * responder without touching this shell. Loading, error, and empty states are all in
 * voice, and the whole thing is keyboard-operable and reduced-motion aware.
 */
export function ChatSection() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    let active = true
    setLoad({ status: 'loading' })
    getChatEntries()
      .then((entries) => {
        if (active) {
          setLoad({ status: 'ready', entries })
        }
      })
      .catch(() => {
        if (active) {
          setLoad({ status: 'error' })
        }
      })
    return () => {
      active = false
    }
  }, [reloadToken])

  const entries = load.status === 'ready' ? load.entries : EMPTY_ENTRIES
  const responder = useMemo(() => createScriptedResponder(entries), [entries])
  const chat = useChat(responder, reducedMotion)

  // Pre-load the ablation sweep as the opening turn, once, so its interactive plot greets
  // the visitor where the old always-on section used to sit. It is still a chip to re-ask.
  const { askPrompt } = chat
  const preloadedRef = useRef(false)
  useEffect(() => {
    if (load.status !== 'ready' || preloadedRef.current) {
      return
    }
    const sweep = entries.find((entry) => entry.slug === ABLATION_SWEEP_SLUG)
    if (sweep) {
      preloadedRef.current = true
      askPrompt(sweep)
    }
  }, [load.status, entries, askPrompt])

  return (
    <section aria-labelledby="chat-heading" className="space-y-6">
      <div className="max-w-2xl space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {CHAT_COPY.eyebrow}
        </p>
        <h2
          id="chat-heading"
          className="text-4xl font-semibold tracking-tight sm:text-5xl"
        >
          {CHAT_COPY.title}
        </h2>
        <p className="text-sm text-muted">{CHAT_COPY.intro}</p>
      </div>

      {load.status === 'loading' && <p className="text-muted">{CHAT_COPY.loading}</p>}

      {load.status === 'error' && (
        <div className="space-y-3">
          <p className="text-muted">{CHAT_COPY.error}</p>
          <Button variant="ghost" onClick={() => setReloadToken((token) => token + 1)}>
            Retry
          </Button>
        </div>
      )}

      {load.status === 'ready' && entries.length === 0 && (
        <p className="text-muted">{CHAT_COPY.empty}</p>
      )}

      {load.status === 'ready' && entries.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface/60 shadow-glow">
          <div className="border-b border-border px-4 py-5 text-center sm:px-6">
            <p className="flex items-center justify-center gap-2.5 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              <span
                aria-hidden="true"
                className="inline-block size-2.5 rounded-full bg-brand-500 [animation:ls-pulse_1.6s_ease-in-out_infinite]"
              />
              {CHAT_COPY.name}
            </p>
            <p className="mt-1.5 font-mono text-[11px] text-muted">
              {entries.length} answers · no live model
            </p>
          </div>

          <div className="space-y-6 p-4 sm:p-6">
            <ChatTranscript
              turns={chat.turns}
              activeTurnId={chat.activeTurnId}
              shownWords={chat.shownWords}
              onSuggestion={chat.askPrompt}
            />
            <ChatComposer onSubmit={chat.askFreeText} />
            <SuggestedPrompts
              entries={entries}
              onSelect={chat.askPrompt}
              label="Try one of these"
            />
          </div>
        </div>
      )}
    </section>
  )
}
