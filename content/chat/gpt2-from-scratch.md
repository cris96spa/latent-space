---
question: What did rebuilding GPT-2 from scratch teach you?
category: build
order: 2
draft: false
---

Rebuilding GPT-2 from scratch is the most *me* thing I've done. I'd studied the architecture
and used `transformers` every day - but importing a thing and understanding it are different
sports, and most people never leave the first one. How does text actually become numbers?
How do you train a tokenizer, and what is BPE really doing? What silently breaks in your chat
template? None of that has produced a single token yet - it's just getting text *in*.

Then the real model: how attention works, how to write multi-head attention yourself, and -
since time travel isn't a feature - how causal masking stops a token from reading its own
future. You start training, the loss looks cursed, and it's because you forgot to zero the
gradients. Every layer teaches you something the one-line import was quietly deciding for
you.
