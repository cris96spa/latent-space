export const CHAT_COPY = {
  eyebrow: 'my answers · temperature 0',
  title: 'Ask me things',
  name: 'Chat Cri-PT',
  composerLabel: 'Ask a question',
  composerPlaceholder: 'Ask something, or tap a prompt…',
  send: 'Send',
  loading: 'Warming up the context window…',
  error: 'That request fell out of my context window. Give it another second.',
  empty: 'The prompt vocabulary is empty - nothing published yet.',
  fallback:
    "That one's out of distribution. There's no live model back here - just answers I " +
    "actually wrote - so instead of bluffing, here's what I can talk about:",
  userLabel: 'You',
  assistantLabel: 'Cristian',
} as const

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

export const FALLBACK_HOOK = 'searching the context window…'

export const ABLATION_SWEEP_PUBLIC_IDENTIFIER = 'ablation-sweep'
