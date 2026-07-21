---
slug: image-distribution-drift-simulator
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
distribution, perturb it in controlled, parameterized ways, and hand your model exactly the
kind of drift it will eventually meet in the wild - except now you get to choose the dose.

Used as a robustness harness, it improved **model-robustness testing by 22%**. The premise
is boring and correct: a model's accuracy on the data you happened to collect tells you
almost nothing about the day the data quietly changes. Better to simulate that day on
purpose than to be surprised by it.
