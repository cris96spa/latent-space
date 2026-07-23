---
title: Image Distribution Drift Simulator
summary: >-
  A generator for synthetic distribution shift on image data, so a model's robustness gets
  tested against drift you can dial in - instead of drift you find out about in production.
stack:
  - Python
  - Polars
  - Torch
  - Plotly
  - TorchVision
  - PIL
tags:
  - drift
  - computer-vision
  - robustness
  - testing
repository_url: https://github.com/cris96spa/image_drift_generator
published_at: 2024-12-01
draft: false
---

A tool that manufactures **synthetic distribution shift** on image datasets: take a clean
distribution, perturb it in controlled, parameterized ways, and hand your model the drift
it will eventually meet in production - except you choose the dose, the axis, and the
timing.

The premise is boring and correct, my favorite combination: accuracy on the data you
happened to collect says almost nothing about the day the data quietly changes. Used as a
robustness harness it improved **model-robustness testing by 22%**. Simulate the bad day
on purpose, before it schedules itself.
