---
title: LLMs from Scratch
summary: >-
  GPT-2 rebuilt from the tensor up in PyTorch - tokenizer, embeddings, attention,
  training loop - because you don't really understand an architecture until you've
  built every layer of it yourself.
stack:
  - Python
  - PyTorch
  - NumPy
  - Pydantic
  - uv
  - Ruff
  - MLflow
tags:
  - llm
  - pytorch
  - from-scratch
repository_url: https://github.com/cris96spa/LLMs-from-scratch
published_at: 2025-10-01
draft: false
---

**GPT-2, rebuilt from the tensor up in PyTorch**: BPE tokenization, learned embeddings,
multi-head self-attention with the causal mask written by hand, and the training loop that
ties it all together. No `transformers` import doing the interesting part for me.

I used the library daily and kept hitting questions it was quietly answering on my behalf.
How does text actually become numbers? Who decides the vocabulary? Time travel does not
exist, so what exactly is the causal mask doing in there? The only honest way to close
those gaps was to build every layer myself and watch the loss come down - or not, the day
I forgot to zero the gradients.

Published **scaling-law insights** picked the architecture and hyperparameters instead of
guesswork, cutting training time by about **10%**. Knowing that something works is a demo.
Knowing why is the whole point of this repo.
