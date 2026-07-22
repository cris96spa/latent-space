---
title: Python Repo Template
summary: >-
  My opinionated Python starter - uv, Ruff, pytest, Docker, CI/CD, and auto-generated docs -
  so a fresh project is boring in all the right places from the first commit.
stack:
  - Python
  - uv
  - Ruff
  - Pytest
  - Docker
  - GitHub Actions
  - MkDocs
  - Make
tags:
  - python
  - tooling
  - template
  - developer-experience
repository_url: https://github.com/cris96spa/python-repo-template
demo_url: https://cris96spa.github.io/python-repo-template/
published_at: 2025-02-10
draft: false
---

A fork I've beaten into my own shape: the repository I clone when I'd rather start writing
the interesting part than re-litigate tooling for the hundredth time. **uv** for packaging,
**Ruff** for lint and format, **pytest**, a multi-stage **Docker** build, **pre-commit**
hooks, and a **GitHub Actions** pipeline that lints, tests, and publishes - all wired up on
commit zero.

A few touches I keep coming back to. Configuration splits cleanly in two: `YamlBaseSettings`
for per-process settings the environment can override, and `YamlBaseModel` for plain config
documents you load explicitly, with a default path and a per-instance override so the common
case takes no arguments. `make doc` generates **MkDocs** API pages straight from the code -
the same auto-doc generator I built for our internal template at work - so documentation
stops being the thing everyone forgets. And an update script pulls the template's later fixes
into a project you already started, so a repo scaffolded months ago doesn't quietly rot.

It's the least glamorous repo I own and quietly the most load-bearing. The backend of the
site you're reading grew out of exactly this skeleton.
