---
slug: is-a-model-good
question: How do you know a model is actually good?
category: evals
order: 5
draft: false
---

Keep calm and eval. One of my first jobs at Artificialy was building the evaluation
library, for a simple reason: you can't say one model is better than another without
measuring it, and you can't claim "I didn't break anything" in an agentic system without
non-regression tests.

"Good" is many numbers, not one. Pretraining loss, sure - but also **perplexity** for a
read on the model's uncertainty, and downstream performance for the thing you actually care
about. Underperforming? Nine times out of ten it's the data, not the architecture. And once
the model is one component in a bigger system, you test each part in isolation and then
together, because an update that helps one piece can quietly wreck the whole.

The trap is wanting a single number that says *fine / not fine*. There isn't one. Picking
the right metric is most of the work - evaluation isn't the boring part, it's the part that
tells you the truth.
