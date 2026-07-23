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

The repository I clone when I'd rather write the interesting part than re-litigate tooling
for the hundredth time: **uv**, **Ruff**, **pytest**, a multi-stage **Docker** build,
**pre-commit** hooks, and a **GitHub Actions** pipeline that lints, tests, and publishes -
all live from commit zero.

The parts I actually care about: configuration split cleanly between `YamlBaseSettings`
(process settings the environment can override) and `YamlBaseModel` (documents you load
explicitly); `make doc` generating **MkDocs** API pages straight from the code, the same
auto-doc generator I built for the internal template at work; and an update script that
pulls later template fixes into projects scaffolded months ago, so they don't quietly rot.

Least glamorous repo I own, most load-bearing. The backend serving this site grew out of
exactly this skeleton.
