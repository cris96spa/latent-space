import type { ChatEntry } from '../../lib/api'
import { ChatMessage } from './ChatMessage'
import type { ChatTurn } from './types'

interface ChatTranscriptProps {
  turns: readonly ChatTurn[]
  activeTurnId: string | null
  shownWords: number
  onSuggestion: (entry: ChatEntry) => void
}

/**
 * The conversation so far. It is an `aria-live` region, so each new turn is announced
 * once as it is added - the answer text is in the DOM from the start, so a screen reader
 * hears the whole answer immediately while sighted users watch it type in.
 */
export function ChatTranscript({
  turns,
  activeTurnId,
  shownWords,
  onSuggestion,
}: ChatTranscriptProps) {
  if (turns.length === 0) {
    return null
  }

  return (
    <ol className="space-y-4" aria-live="polite" aria-relevant="additions">
      {turns.map((turn) => {
        const streaming = turn.role === 'assistant' && turn.id === activeTurnId
        const shown = turn.role === 'assistant' ? (streaming ? shownWords : turn.wordCount) : 0
        return (
          <ChatMessage
            key={turn.id}
            turn={turn}
            streaming={streaming}
            shown={shown}
            onSuggestion={onSuggestion}
          />
        )
      })}
    </ol>
  )
}
