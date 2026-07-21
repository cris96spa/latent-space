import { useId, useState, type FormEvent } from 'react'

import { Button } from '../../components/Button'
import { CHAT_COPY } from './content'

interface ChatComposerProps {
  onSubmit: (text: string) => void
}

/**
 * The free-text input. Submitting maps the text to the closest preset (or the fallback)
 * through the responder. Focus stays in the field after sending so a visitor can keep
 * asking, and the field is a labeled `<input>` in a real `<form>`, so Enter submits and
 * assistive tech announces it.
 */
export function ChatComposer({ onSubmit }: ChatComposerProps) {
  const [value, setValue] = useState('')
  const inputId = useId()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return
    }
    onSubmit(trimmed)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor={inputId} className="sr-only">
        {CHAT_COPY.composerLabel}
      </label>
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={CHAT_COPY.composerPlaceholder}
        autoComplete="off"
        className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-fg placeholder:text-muted"
      />
      <Button type="submit" variant="primary">
        {CHAT_COPY.send}
      </Button>
    </form>
  )
}
