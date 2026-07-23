---
question: Do hyperparameters actually matter?
category: training
attachment: ablation-sweep
order: 10
draft: false
---

Less than the hype implies, more than you'd like.

These are 18 simulated runs at GPT-2's 124M budget, one hue per knob, each swept from
well-tuned to visibly regretted. Detuning doesn't change *where* a run lands - the 2.41-nat
floor holds (nats, not nuts: loss in natural-log units) - only how many tokens you burn getting there. Learning rate is the one you
can't fumble; z-loss barely moves the needle.

Every curve is the Chinchilla fit with a per-run data penalty, so the fan is a prediction,
not a drawing. Drag to zoom, hover for the numbers.
