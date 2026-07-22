---
question: How do you know a model is actually good?
category: evals
order: 5
draft: false
---

Keep calm and eval. One of my first jobs at Artificialy was building the evaluation
library - you can't call one model better, or swear you didn't break the agent, without
measuring it.

"Good" is many numbers, not one: perplexity for the model's uncertainty, downstream
performance for the thing you care about. Underperforming? Nine times out of ten it's the
data, not the architecture. Picking the right metric is most of the work - evaluation isn't
the boring part, it's the part that tells you the truth.
