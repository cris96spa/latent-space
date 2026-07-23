---
question: How do you know a model is actually good?
category: evals
order: 5
draft: false
---

Keep calm and eval. One of my first jobs at Artificialy was building the evaluation
library - without one you can't call a model better, and in an agentic system you can't
even claim "I didn't break it" without non-regression tests. You just believe it, which is
worse.

"Good" is many numbers, not one: perplexity for the model's uncertainty, downstream
performance for the thing you actually care about. Underperforming? Nine times out of ten
it's the data, not the architecture. People want a single number that says "it's fine";
picking the right metric is most of the work. Attention is cute, but evaluation is all you
need.
