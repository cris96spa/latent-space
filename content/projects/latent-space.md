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

Yes, this one. Part portfolio, part lab notebook, part applied-ML performance art. The
landing page runs *"Who is Cristian?"* through a real **GPT-2 124M** pipeline - tokenize,
one prefill pass to fill the KV cache, one decode pass per token - and streams the bio out,
scrubbable like a video. A PDF resume cannot do a forward pass. Most of this got built on
vacation, at night: dedication or diagnosis, undecided.

Under the hood: a **FastAPI** backend owns content loading, validation, and
Markdown-to-sanitized-HTML rendering (markdown-it-py with `html=False`, then an `nh3`
allowlist); a **Vite / React / TypeScript** frontend owns presentation and the animation.
Everything the diagram asserts is checkable - architecture numbers from the published model
config, token splits from the real GPT-2 pretokenizer regex. A site claiming to care about
why things work doesn't get to hand-wave its own.