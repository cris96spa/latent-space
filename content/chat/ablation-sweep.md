---
slug: ablation-sweep
question: How much do hyperparameters actually matter?
category: training
order: 10
draft: false
---

Less than the hype implies, more than you'd like — here's the sweep.

These are 18 simulated runs at GPT-2's 124M-parameter budget, one hue per knob, each swept
from well-tuned to visibly regretted. The punchline: detuning does not change *where* a run
lands — the 2.41-nat finite-model floor is not negotiable — it changes how many tokens you
burn getting there.

Learning rate is the knob you can't fumble (top band, and that's not an accident);
auxiliary regularizers like z-loss barely move the needle. Every curve is the Chinchilla fit
with a per-run data penalty, so the fan is a prediction, not a drawing. Drag to zoom, hover
for the numbers — and yes, I could look at these for the rest of my life.
