---
slug: llms-from-scratch
title: LLMs from Scratch
summary: >-
  GPT-2 rebuilt from the tensor up in PyTorch - tokenizer, embeddings, attention,
  training loop - because you don't really understand an architecture until you've
  hand-wired the backward pass.
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

A full **GPT-2 implementation in PyTorch**, written from scratch: byte-pair tokenization,
learned embeddings, multi-head self-attention, and the training loop that ties them
together. No `transformers` import doing the interesting part for me - the point was to
build every layer by hand and watch the loss actually come down.

Along the way I leaned on published **LLM scaling insights** to pick the architecture and
hyperparameters rather than guessing, which cut training time by about **10%**. It's the
kind of project that turns "attention is all you need" from a sentence you can quote into a
shape you can debug at 1 a.m.
