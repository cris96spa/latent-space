import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ChatEntry } from '../../lib/api'
import { useChat } from './useChat'
import type { ChatResponder } from './types'

const ENTRY: ChatEntry = {
  publicIdentifier: 'what-do-you-do',
  question: 'What do you actually do?',
  category: 'role',
  attachment: null,
  answerHtml: '<p>Alpha beta gamma.</p>',
}

// A responder that yields the authored answer once, like the scripted responder. The generator
// ignores its `input`/`signal` params, which structural typing permits.
const responder: ChatResponder = {
  async *respond() {
    yield { kind: 'answer', entry: ENTRY }
  },
}

describe('useChat under reduced motion', () => {
  it('reveals the whole answer immediately with no word-by-word streaming', async () => {
    const { result } = renderHook(() => useChat(responder, true))

    act(() => {
      result.current.askPrompt(ENTRY)
    })

    await waitFor(() => expect(result.current.turns).toHaveLength(2))

    const assistant = result.current.turns[1]
    expect(assistant.role).toBe('assistant')
    if (assistant.role === 'assistant') {
      // shownWords jumps to the full count at once; the reveal player never walks it up.
      expect(result.current.shownWords).toBe(assistant.wordCount)
      expect(assistant.plainText).toContain('Alpha beta gamma.')
    }
    // With nothing left to animate, the active (streaming) turn is cleared.
    await waitFor(() => expect(result.current.activeTurnId).toBeNull())
  })
})
