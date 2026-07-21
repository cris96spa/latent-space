import { useEffect, useMemo, useState } from 'react'

import { Button } from '../../components/Button'
import { SectionHeading } from '../../components/SectionHeading'
import { getChatEntries, type ChatEntry } from '../../lib/api'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { ChatComposer } from './ChatComposer'
import { ChatTranscript } from './ChatTranscript'
import { CHAT_COPY } from './content'
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

  return (
    <section aria-label={CHAT_COPY.title} className="space-y-6">
      <SectionHeading eyebrow={CHAT_COPY.eyebrow} title={CHAT_COPY.title}>
        {CHAT_COPY.intro}
      </SectionHeading>

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
        <div className="space-y-6 rounded-xl border border-border bg-surface/60 p-4 shadow-glow sm:p-6">
          <SuggestedPrompts
            entries={entries}
            onSelect={chat.askPrompt}
            label="Suggested prompts"
          />
          <ChatTranscript
            turns={chat.turns}
            activeTurnId={chat.activeTurnId}
            shownWords={chat.shownWords}
            onSuggestion={chat.askPrompt}
          />
          <ChatComposer onSubmit={chat.askFreeText} />
        </div>
      )}
    </section>
  )
}
