/**
 * In-voice microcopy for the chat: its framing, the non-answer states (loading, error,
 * empty, no-match), and the short "thinking" status line shown before each answer. Kept
 * out of the components so the voice lives in one place. The substantive answers are
 * authored content served by the API; everything here is chrome.
 */
export const CHAT_COPY = {
  eyebrow: 'scripted · just my opinionated answers',
  /** The big section headline, mirroring the hero's `Who is Cristian?`. */
  title: 'Ask me things',
  /** The chat's name, emphasized on its in-component title bar. */
  name: 'Chat Cri-PT',
  composerLabel: 'Ask a question',
  composerPlaceholder: 'Ask something, or tap a prompt…',
  send: 'Send',
  loading: 'Warming up the context window…',
  error: 'That request fell out of my context window. Give it another second.',
  empty: 'The prompt vocabulary is empty - nothing published yet.',
  fallback:
    "That one's out of distribution. There's no live model back here - just answers I " +
    'actually wrote - so instead of bluffing, here is what I can actually talk about:',
  userLabel: 'User',
  assistantLabel: 'Cristian',
} as const

/**
 * A short, realistic status line streamed before each answer, keyed by entry public identifier - the
 * "thinking" beat. Each names a real step from that answer's topic (quantization,
 * softmax, the résumé compile), so it is nerdy but never fake. Chrome, not content, which
 * is why it lives here rather than in the authored files.
 */
export const THINKING_HOOKS: Readonly<Record<string, string>> = {
  'why-a-forward-pass': 'running the forward pass…',
  'gpt2-from-scratch': 'zeroing the gradients…',
  'attention-explained': 'softmax(QKᵀ/√dₖ)…',
  'cheaper-inference': 'quantizing weights → fp8…',
  'is-a-model-good': 'running the non-regression suite…',
  'teleport-mdp': 'truncating the horizon…',
  'most-overrated': 'denoising the hype…',
  'off-the-clock': 'unloading weights from VRAM…',
  'can-i-see-your-resume': 'rendering resume.tex → PDF…',
}

/** The status line for a no-match fallback, where there is no entry to key on. */
export const FALLBACK_HOOK = 'searching the context window…'

/**
 * The entry the chat pre-loads as its opening turn. Which widget its answer renders is
 * declared in the content frontmatter (`attachment`), not here; this public identifier only
 * picks the opener.
 */
export const ABLATION_SWEEP_PUBLIC_IDENTIFIER = 'ablation-sweep'
