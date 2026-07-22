# Source of truth - Cristian C. Spagnuolo

> **Internal. Not a published page.** This file is the vetted fact base for every content
> task (hero bio, about page, projects, chat answers). Downstream content renders _from_
> here; it must not invent biography, dates, metrics, or technical claims that are not in
> this document. Every claim below is tagged with its source. Gaps and decisions that need
> Cristian are marked `TODO(content: ...)` - a visible gap beats a plausible lie (CLAUDE.md
> "Source material").
>
> **Sources.**
> - `[CV]` - `frontend/public/Cristian_C_Spagnuolo_CV.pdf` (canonical for roles, dates, metrics).
>   CV footer dates the document "June 26, 2026".
> - `[GH]` - <https://github.com/cris96spa> public profile + REST API (pulled 2026-07-20).
> - `[LI]` - <https://www.linkedin.com/in/cristian-c-spagnuolo/> (not machine-readable here;
>   items needing LinkedIn confirmation are marked `TODO(content)`).

## Identity

- Name: **Cristian C. Spagnuolo** `[CV]`
- Current title: **NLP Engineer** `[CV]`
- GitHub tagline: "NLP Engineer | AI & Deep Learning Specialist | MSc in Computer Science &
  Engineering" `[GH]`
- Email: `cristian.c.spagnuolo@gmail.com` `[CV, GH]` - already public (GitHub, git identity).
- GitHub: `cris96spa` `[CV, GH]` · LinkedIn: `cristian-c-spagnuolo` `[CV, LI]`
- Phone: on the CV `[CV]`. `TODO(content: needs-cristian)` - a phone number on a public
  portfolio is a spam magnet; default is to **not** publish it and route contact through
  email/LinkedIn/a form. Confirm.
- Location: works in **Lugano, Switzerland** (Artificialy) `[CV]`.
  `TODO(content: needs-cristian)` - publish city/country, or keep location vague?

## One-line summary (CV, verbatim intent)

> "NLP engineer focused on production LLMs - efficient inference, fine-tuning (SFT, DPO,
> GRPO), and reliable evaluation. Strong software-engineering foundation: clean,
> maintainable code, thorough testing, and CI/CD." `[CV]`

## Experience

### Artificialy SA - Lugano, Switzerland `[CV, GH]`
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

### MLcube - Milano, Italy `[CV]`
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

- **Politecnico di Milano** - MSc, Computer Science and Engineering, **110/110 cum laude**,
  02/2020 – 07/2024. `[CV]`
- **Università degli Studi del Sannio** (Benevento) - BSc, Computer Science and Engineering,
  **110/110 cum laude**, 09/2015 – 10/2019. `[CV]`

## Achievements & certifications

- **2nd place, Hackapizza 2025** - IBM Studios, Milano. `[CV]` (Repo: `hackapizza` `[GH]`.)
- 2024 certifications: **Machine Learning (IBM)**, **Advanced Data Analytics (Google)**.
  `[CV]`

## Projects `[CV]` + repo mapping `[GH]`

Repos pulled 2026-07-20. Most repos have no GitHub `description` set; the framing below is
from the CV. `TODO(content: needs-cristian)` - set real GitHub descriptions on the featured
repos, or supply blurbs here so the projects page and chat don't guess.

- **LLMs from Scratch** - 07/2025 – 10/2025. Implemented **GPT-2 from scratch in PyTorch**:
  tokenization, embeddings, multi-head attention, training loop. Used LLM scaling insights
  to guide architecture/hyperparameters, cutting training time by **10%**. Stack: Python,
  PyTorch, NumPy, Pydantic, Uv, Ruff, MLflow. `[CV]` → repo `LLMs-from-scratch` (Python) `[GH]`.
- **Image Distribution Drift Simulator** - 10/2024 – 12/2024. Image drift simulator that
  reproduces synthetic distribution shift, improving model-robustness testing by **22%**.
  Stack: Python, Polars, Torch, Plotly, TorchVision, PIL. `[CV]` → repo `image_drift_generator`
  (Python) `[GH]`.
- **Master's thesis - Teleport MDPs / Curriculum Learning for RL** (PoliMi, advisor
  Prof. Marcello Restelli; with Dr. Alberto Maria Metelli and Dr. Luca Sabbioni), 02/2023 –
  07/2024. Curriculum Learning framework for RL built on Policy Gradient Methods (PPO): the
  **Teleport MDP** formalism adds a teleport mechanism (rate τ, distribution ξ,
  `P_τ = (1−τ)P + τξ`) that truncates the horizon; annealing τ→0 is the curriculum. Exact
  algorithm TMPI (impractical) plus Static/Dynamic teleport schedules; beat vanilla on Frozen
  Lake and River Swim. Stack: Python, PyTorch, NumPy, Gymnasium, PPO. `[CV]` → **backed by
  repo `teleportMPD` (Python)** `[GH]`, README + docs at
  <https://cris96spa.github.io/teleportMPD/> (confirmed by Cristian 2026-07-21). Featured as
  project `teleport-mdp` (was `curriculum-learning-rl`).

Other public repos `[GH]`: `Evaluator` (fork - "scalable, reproducible evaluation of AI
models and benchmarks"), `portfolio` (older CSS personal portfolio - the thing this site
replaces), `ACT-Project`, `NodeCloud`.

**Featured project set** (confirmed by Cristian 2026-07-21 - "add these to the list"):
LLMs-from-scratch, Image Distribution Drift Simulator, `teleport-mdp` (thesis), plus four
added from their public repos/READMEs:
- **latent-space** - this site. FastAPI + React portfolio. Repo `latent-space` `[GH]`. No
  live demo URL yet (host/domain undecided, CLAUDE.md).
- **python-repo-template** - fork Cristian maintains; uv/Ruff/pytest/Docker/CI + MkDocs
  auto-docs (the API-doc-generator lineage from work `[CV]`). Repo `python-repo-template`
  `[GH]`, docs <https://cris96spa.github.io/python-repo-template/>.
- **LeetCode** - Python solutions, self-updating NeetCode-250 progress table. Repo `LeetCode`
  `[GH]`, docs <https://cris96spa.github.io/LeetCode/>. Exact solved-count is script-generated
  and drifts, so content says "north of a hundred" rather than a brittle number.
- **hackapizza** - fork of the challenge repo; the solution (RAG + LangGraph + Neo4j
  knowledge graph + LLM-generated Cypher) is Cristian's. **2nd place, Hackapizza 2025, IBM
  Studios Milano** `[CV]`. Repo `hackapizza` `[GH]`.
Still available if wanted: the pricing/PPO and SQL/regulatory agents from work (need employer
permission, confidentiality `TODO` below).
`TODO(content: needs-cristian)` - are the **Artificialy / MLcube work items** OK to describe
publicly with their metrics, or should any be generalized / omitted for confidentiality?

## Skills `[CV]`

- **Programming:** Python, Java, C, C++, Assembly, SQL.
- **AI/ML:** Pandas, Torch, Polars, NumPy, TensorFlow, LangChain, LangGraph, HuggingFace,
  Ollama, DeepSeek, OpenAI, MLflow, scikit-learn, Matplotlib, Plotly, Gemini, Vertex AI,
  Gymnasium, Mistral, Qwen, vLLM, TensorRT.
- **Technologies:** GCP, AWS, Azure, Git, GitHub, Docker, Docker Compose, Traefik, MongoDB,
  FastAPI, Firebase, Django, Node-RED, Make, Uv, Neo4j.
- **Languages:** English, Italian. `[CV]`

## Canonical bio - signed off (2026-07-22)

This is the single most-read string on the site (the hero streams it token by token; the
about page expands it). Every clause below is grounded in the facts above, and it carries
no employer metrics while the confidentiality `TODO` above is open.

**Direction given by Cristian (2026-07-21):** answer in **first person**, opening on the
"Hi, I'm Cristian, and this is my latent space…" beat; push the funny/nerdy register
harder; send people to the résumé for the parts that belong on a résumé.
Signed off by Cristian 2026-07-22. Wording is drawn from `_voice-interview.md` (his own
phrasing), with facts from the sections above - this source-of-truth is the CV fact base,
not the voice. `frontend/src/features/forward-pass-hero/content.ts` and the `<noscript>`
block in `frontend/index.html` mirror the text below verbatim; keep all three in sync.

**Final (live):**

> Hi, I'm Cristian, and this is my latent space. I'm an NLP engineer at Artificialy in
> Lugano, where I make large language models run faster, fit in less GPU memory, and stop
> confidently making things up. The part I care about is the one most people skip: not that
> something works, but why. So on weekends I rebuilt GPT-2 from scratch in PyTorch 🛠️.
> Credentials (Politecnico di Milano, cum laude, bla, bla, bla... 🥱) on the resume. I'm a
> nerd, I like it 🤓, and I'd spend the rest of
> my life watching training-loss curves go down 📉.

**Shorter hero lead (1 sentence), if the animation wants a tight opener:**

> An NLP engineer who makes language models faster, lighter, and less likely to confidently
> make things up - and who rebuilds GPT-2 from scratch on weekends because knowing why beats
> knowing that.

## Open review checklist for Cristian

- [ ] Publish phone number? (default: no)
- [ ] Publish exact location (Lugano)? (default: city-level ok)
- [ ] OK to state Artificialy/MLcube achievements with their metrics publicly?
- [x] Featured-projects set confirmed? (2026-07-21: 7 projects - see Projects section)
- [x] Canonical bio wording + humor level signed off? (2026-07-22)
- [ ] Set GitHub descriptions on featured repos (or provide blurbs here)?
