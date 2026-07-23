---
title: fyt - From YAML Training
summary: >-
  A configuration-driven ML library for tabular data, born from a deal: my girlfriend
  stops running her thesis experiments in R, and I build her the framework. Here it is -
  define, train, tune, and reuse full pipelines from one YAML file.
stack:
  - Python
  - Pydantic
  - Polars
  - scikit-learn
  - XGBoost
  - Optuna
  - MLflow
  - uv
tags:
  - tabular
  - pipelines
  - experiments
  - tooling
repository_url: https://github.com/cris96spa/fyt
demo_url: https://cris96spa.github.io/fyt/
published_at: 2025-10-05
draft: false
---

Some people write poems for their partner. I made a deal: my girlfriend was running her
thesis experiments in **R**, I hate R, and I told her - stop using that and I'll build you
the framework. Here it is. **fyt** ("From YAML Training") turns an experiment into a YAML
file: task, data, preprocessing, feature selection, model, metrics. Change the file,
rerun, compare. The whole scientific liturgy - models, imputation, cross-validation -
without a single line of R. Same pipelines from Python, if you'd rather `import fyt`.

Built on my python-repo-template skeleton, so it was born with lint, types, tests, Docker,
and CI already in place. Turns out the most romantic thing I know how to write is
leakage-safe cross-validation.
