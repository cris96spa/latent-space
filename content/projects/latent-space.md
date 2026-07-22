---
title: latent-space (this site)
summary: >-
  The site rendering this sentence. A FastAPI + React portfolio that animates a GPT-2 forward
  pass and streams the bio token by token, because a PDF resume cannot do a forward pass.
stack:
  - Python
  - FastAPI
  - Pydantic
  - React
  - TypeScript
  - Vite
  - Tailwind CSS
  - Docker
tags:
  - portfolio
  - fastapi
  - react
  - typescript
repository_url: https://github.com/cris96spa/latent-space
published_at: 2026-07-20
draft: false
---

Yes, this one. **latent-space** is part portfolio, part lab notebook, part applied-ML
performance art - an answer to "who is Cristian and what does he build?" in a voice a resume
can't manage. The landing page animates the prompt *"Who is Cristian?"* through a real
**GPT-2 124M** pipeline - tokenize, one prefill pass that fills the KV cache, then a decode
pass per token - and streams the bio out one token at a time, scrubbable like a video. Most
of it got built on vacation, at night: dedication or diagnosis, undecided.

Under the hood it's a **FastAPI** backend that owns content loading, validation, and
Markdown-to-sanitized-HTML rendering (markdown-it-py with `html=False`, then an `nh3`
allowlist), and a **Vite / React / TypeScript** frontend that owns presentation and the
animation. Everything the diagram asserts is checkable: the architecture numbers come from
the published model config, the token splits from the real GPT-2 pretokenizer regex.