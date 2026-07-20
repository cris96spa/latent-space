# Source of truth — Cristian C. Spagnuolo

> **Internal. Not a published page.** This file is the vetted fact base for every content
> task (hero bio, about page, projects, chat answers). Downstream content renders _from_
> here; it must not invent biography, dates, metrics, or technical claims that are not in
> this document. Every claim below is tagged with its source. Gaps and decisions that need
> Cristian are marked `TODO(content: ...)` — a visible gap beats a plausible lie (CLAUDE.md
> "Source material").
>
> **Sources.**
> - `[CV]` — `src/static/Cristian_C_Spagnuolo_CV.pdf` (canonical for roles, dates, metrics).
>   CV footer dates the document "June 26, 2026".
> - `[GH]` — <https://github.com/cris96spa> public profile + REST API (pulled 2026-07-20).
> - `[LI]` — <https://www.linkedin.com/in/cristian-c-spagnuolo/> (not machine-readable here;
>   items needing LinkedIn confirmation are marked `TODO(content)`).

## Identity

- Name: **Cristian C. Spagnuolo** `[CV]`
- Current title: **NLP Engineer** `[CV]`
- GitHub tagline: "NLP Engineer | AI & Deep Learning Specialist | MSc in Computer Science &
  Engineering" `[GH]`
- Email: `cristian.c.spagnuolo@gmail.com` `[CV, GH]` — already public (GitHub, git identity).
- GitHub: `cris96spa` `[CV, GH]` · LinkedIn: `cristian-c-spagnuolo` `[CV, LI]`
- Phone: on the CV `[CV]`. `TODO(content: needs-cristian)` — a phone number on a public
  portfolio is a spam magnet; default is to **not** publish it and route contact through
  email/LinkedIn/a form. Confirm.
- Location: works in **Lugano, Switzerland** (Artificialy) `[CV]`.
  `TODO(content: needs-cristian)` — publish city/country, or keep location vague?

## One-line summary (CV, verbatim intent)

> "NLP engineer focused on production LLMs — efficient inference, fine-tuning (SFT, DPO,
> GRPO), and reliable evaluation. Strong software-engineering foundation: clean,
> maintainable code, thorough testing, and CI/CD." `[CV]`

## Experience

### Artificialy SA — Lugano, Switzerland `[CV, GH]`
**NLP Engineer**, 05/2025 – Present `[CV]`

- Optimized on-premise LLM inference with quantization and TensorRT / vLLM runtimes:
  **4× less GPU memory, 1.8× faster**. `[CV]`
- Main contributor to the internal **fine-tuning framework** (SFT, DPO, GRPO), multi-GPU
  training, and MLflow tracking. `[CV]`
- Built an **LLM evaluation pipeline** (retrieval, metrics, artifacts, non-regression
  tests), cutting **eval effort by 66%**. `[CV]`
- Engineered a **tabular-data Q&A agent** with secure code generation, visualization, and
  forecasting; **>90% accuracy**. `[CV]`
- Authored an **automatic API-doc generator** for the internal Python template, producing
  MkDocs pages and removing manual upkeep. `[CV]` (This is the ProperDocs/MkDocs lineage the
  `make doc` target and the python-repo-template descend from.)

### MLcube — Milano, Italy `[CV]`
**AI/ML Engineer**, 09/2024 – 05/2025 `[CV]`

- Trained a **pricing agent with PPO** for hotel booking, increasing simulated revenue by
  **16%** over baseline strategies. `[CV]`
- Created an **LLM-powered SQL agent** for financial users, enabling natural-language
  queries with **91% accuracy**. `[CV]`
- Designed an **AI regulatory assistant on knowledge graphs**, improving analyst decision
  accuracy by **38%**. `[CV]`
- Enhanced the "MLcube Platform" with segmented monitoring for drift detection, raising
  **detection coverage by 35%**. `[CV]`
- Automated **document digitization** via a structured-data-extraction pipeline, achieving
  **87% OCR accuracy**. `[CV]`

## Education

- **Politecnico di Milano** — MSc, Computer Science and Engineering, **110/110 cum laude**,
  02/2020 – 07/2024. `[CV]`
- **Università degli Studi del Sannio** (Benevento) — BSc, Computer Science and Engineering,
  **110/110 cum laude**, 09/2015 – 10/2019. `[CV]`

## Achievements & certifications

- **2nd place, Hackapizza 2025** — IBM Studios, Milano. `[CV]` (Repo: `hackapizza` `[GH]`.)
- 2024 certifications: **Machine Learning (IBM)**, **Advanced Data Analytics (Google)**.
  `[CV]`

## Projects `[CV]` + repo mapping `[GH]`

Repos pulled 2026-07-20. Most repos have no GitHub `description` set; the framing below is
from the CV. `TODO(content: needs-cristian)` — set real GitHub descriptions on the featured
repos, or supply blurbs here so the projects page and chat don't guess.

- **LLMs from Scratch** — 07/2025 – 10/2025. Implemented **GPT-2 from scratch in PyTorch**:
  tokenization, embeddings, multi-head attention, training loop. Used LLM scaling insights
  to guide architecture/hyperparameters, cutting training time by **10%**. Stack: Python,
  PyTorch, NumPy, Pydantic, Uv, Ruff, MLflow. `[CV]` → repo `LLMs-from-scratch` (Python) `[GH]`.
- **Image Distribution Drift Simulator** — 10/2024 – 12/2024. Image drift simulator that
  reproduces synthetic distribution shift, improving model-robustness testing by **22%**.
  Stack: Python, Polars, Torch, Plotly, TorchVision, PIL. `[CV]` → repo `image_drift_generator`
  (Python) `[GH]`.
- **Master's thesis — Curriculum Learning for Reinforcement Learning** (PoliMi, advisor
  Prof. Marcello Restelli), 02/2023 – 07/2024. Novel Curriculum Learning framework for RL
  built on Policy Gradient Methods (PPO), deriving algorithms that progressively scale task
  difficulty to solve sparse-reward problems where standard RL fails. Stack: Python, PyTorch,
  NumPy, Gymnasium, PPO. `[CV]` → likely relates to repos `TMDP` (Jupyter) and/or
  `teleportMPD` (Python) `[GH]`. `TODO(content: needs-cristian)` — confirm which repo(s) back
  the thesis and whether to feature them.

Other public repos `[GH]` (not on the CV; here for completeness, not necessarily featured):
`python-repo-template` (fork, the Python template Cristian mirrors), `Evaluator` (fork —
"scalable, reproducible evaluation of AI models and benchmarks"), `LeetCode`, `portfolio`
(older CSS personal portfolio — the thing this site replaces), `ACT-Project`, `NodeCloud`.

`TODO(content: needs-cristian)` — **featured projects**: confirm the front-and-center set.
Proposed default: LLMs-from-scratch, Image Distribution Drift Simulator, the pricing/PPO and
SQL/regulatory agents from work (with employer permission), and the thesis.
`TODO(content: needs-cristian)` — are the **Artificialy / MLcube work items** OK to describe
publicly with their metrics, or should any be generalized / omitted for confidentiality?

## Skills `[CV]`

- **Programming:** Python, Java, C, C++, Assembly, SQL.
- **AI/ML:** Pandas, Torch, Polars, NumPy, TensorFlow, LangChain, LangGraph, HuggingFace,
  Ollama, DeepSeek, OpenAI, MLflow, scikit-learn, Matplotlib, Plotly, Gemini, Vertex AI,
  Gymnasium, Mistral, Qwen, vLLM, TensorRT.
- **Technologies:** GCP, AWS, Azure, Git, GitHub, Docker, Docker Compose, Traefik, MongoDB,
  FastAPI, Firebase, Django, Node-RED, Make, Uv, Neo4j.
- **Languages:** English, Italian. `[CV]`

## Canonical bio — DRAFT, needs sign-off

`TODO(content: needs-cristian)` — this is the single most-read string on the site (the hero
streams it token by token; the about page expands it). Confirm wording and how hard the
humor should push. Every clause below is grounded in the facts above.

**Primary draft (3 sentences):**

> Cristian is an NLP engineer at Artificialy in Lugano, where he makes large language models
> run faster, cost less GPU memory, and stop making things up — efficient inference,
> fine-tuning (SFT, DPO, GRPO), and evaluation pipelines that actually catch the regressions.
> He built GPT-2 from scratch in PyTorch for the same reason some people rebuild an engine in
> the garage: to understand every layer of the thing he works with all day. Politecnico di
> Milano, 110/110 cum laude, and a sincere intention to keep staring at training-loss curves
> for the rest of his life.

**Shorter hero lead (1 sentence), if the animation wants a tight opener:**

> An NLP engineer who makes production language models faster, cheaper, and less prone to
> confidently lying — and who, given a free weekend, reimplements GPT-2 from scratch for fun.

## Open review checklist for Cristian

- [ ] Publish phone number? (default: no)
- [ ] Publish exact location (Lugano)? (default: city-level ok)
- [ ] OK to state Artificialy/MLcube achievements with their metrics publicly?
- [ ] Featured-projects set confirmed?
- [ ] Canonical bio wording + humor level signed off?
- [ ] Set GitHub descriptions on featured repos (or provide blurbs here)?
