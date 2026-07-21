/**
 * In-voice microcopy for the chat: its framing and every non-answer state (loading,
 * error, empty, no-match). Kept out of the components so the voice lives in one place
 * and a later mode can reuse it. The authored answers themselves come from the API.
 */
export const CHAT_COPY = {
  eyebrow: 'scripted responder · no live model',
  title: 'Ask the model about me',
  intro:
    "Same trick as the hero, fewer moving parts: pick a prompt and I stream a pre-written " +
    "answer. The model is just me with a lookup table, so it can't improvise — which also " +
    "means it can't hallucinate a job I never had.",
  composerLabel: 'Ask a question',
  composerPlaceholder: 'Ask something, or tap a prompt…',
  send: 'Send',
  loading: 'Warming up the context window…',
  error: 'That request fell out of my context window. Give it another second.',
  empty: 'The prompt vocabulary is empty — nothing published yet.',
  fallback:
    "That one's outside my context window — I only ship with a handful of pre-computed " +
    'answers. Try one of these:',
  userLabel: 'You',
  assistantLabel: 'Cristian',
} as const
