export const HERO_PROMPT = 'Who is Cristian?'

/**
 * The string the hero streams token by token.
 *
 * It answers in Cristian's own voice, first person, because the page is his and a
 * third-person portfolio bio reads like a press release. It mirrors the canonical bio
 * in `content/_source-of-truth.md` verbatim - every clause is grounded in the vetted
 * facts, and it deliberately carries no employer metrics while
 * `TODO(content: needs-cristian)` on publishing those is open. Do not change its
 * meaning here without updating the source-of-truth file, and keep the `<noscript>`
 * copy in `index.html` in sync.
 */
export const CANONICAL_BIO =
  "Hi, I'm Cristian, and this is my latent space. I'm an NLP engineer at Artificialy in " +
  'Lugano, where I make large language models run faster, fit in less GPU memory, and stop ' +
  'confidently making things up. The part I care about is the one most people skip: not ' +
  'that something works, but why. So on weekends I rebuilt GPT-2 from scratch in ' +
  'PyTorch 🛠️. Credentials (Politecnico di Milano, cum laude, bla, bla, bla... 🥱) on the ' +
  "resume. I'm a nerd, I like it 🤓, and I'd " +
  'spend the rest of my life watching training-loss curves go down 📉.'
