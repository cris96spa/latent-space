---
slug: attention-explained
question: Explain attention without the hand-waving.
category: concepts
order: 3
draft: false
---

You're good at this without noticing: reading a sentence, you fixate on the words that
matter and skim the rest. A neural network doesn't get that for free. Self-attention is how
we teach it to.

The idea: for every token, ask how relevant every other token is, then blend them by that
relevance. "Relevant" is a **dot product** - two vectors, one number telling you how
aligned they are. Run that across the whole sequence, softmax it, and you get weights that
sum to one: a soft, learned highlight over the context.

The refinement most explanations skip: each token wears three hats - a **query** ("what am
I looking for"), a **key** ("what do I offer"), and a **value** (the actual information).
Attention is the weighted sum of the values, weighted by query–key similarity:
`softmax(QKᵀ / √dₖ)·V`. The `√dₖ` is only there to stop the dot products from blowing up
before the softmax. That's the whole trick - everything else is scaling it up.
