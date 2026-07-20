export const HERO_PROMPT = 'who is Cristian?'

/**
 * The string the hero streams token by token.
 *
 * It answers in Cristian's own voice, first person, because the page is his and a
 * third-person portfolio bio reads like a press release. It mirrors the canonical bio
 * in `content/_source-of-truth.md` verbatim — every clause is grounded in the vetted
 * facts, and it deliberately carries no employer metrics while
 * `TODO(content: needs-cristian)` on publishing those is open. Do not change its
 * meaning here without updating the source-of-truth file, and keep the `<noscript>`
 * copy in `index.html` in sync.
 */
export const CANONICAL_BIO =
  "Hi, I'm Cristian, and this is my latent space. I'm an NLP engineer at Artificialy in " +
  'Lugano, which mostly means I make large language models run faster, fit in less GPU ' +
  'memory, and stop confidently inventing things — efficient inference, fine-tuning (SFT, ' +
  'DPO, GRPO), and evals that catch the regression before the demo does. On my own time I ' +
  'rebuilt GPT-2 from scratch in PyTorch, for the same reason other people rebuild an engine ' +
  'in the garage: I wanted to know what every layer was actually doing. Politecnico di ' +
  'Milano, 110/110 cum laude — and that is the last sentence here that belongs on a résumé. ' +
  "I have one of those, it is one click away, and it is far less fun than this page. What I " +
  'actually want is to spend the rest of my life looking at training-loss curves.'
