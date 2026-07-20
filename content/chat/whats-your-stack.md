---
slug: whats-your-stack
question: What's your stack?
category: stack
order: 1
draft: false
---

Python first, and it's not close.

- **Modeling:** PyTorch, HuggingFace, vLLM and TensorRT for inference, MLflow so I don't lose
  track of which experiment was the good one.
- **Shipping it:** FastAPI, Docker, `uv`, and Ruff — the boring, load-bearing tooling that
  turns a notebook into something you can actually deploy.
- **Data:** Polars over pandas when I get to choose, plus the usual NumPy.
- **Clouds:** comfortable across GCP, AWS, and Azure.

Underneath all of it is a fairly stubborn software-engineering habit: clean code, real tests,
and CI/CD, even for the "it's just research" code.
