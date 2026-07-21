# latent-space

latent-space is Cristian Spagnuolo's personal site: part portfolio, part lab notebook,
part applied-ML performance art. It should answer "who is Cristian and what does he
build?" in a voice that a PDF resume cannot.

The product is a FastAPI backend and a Vite/React/TypeScript frontend. Some repository
files still come from the original Python template; treat them as scaffolding, not product
requirements.

## Product voice

Every visitor-facing surface should sound fresh, nerdy, precise, and dryly funny in the
way engineers who genuinely enjoy language models talk to one another.

- Use ML vocabulary as the site's native metaphor system: tokens, embeddings, attention,
  context windows, inference, checkpoints, loss curves, overfitting, and fine-tuning.
- Make jokes like a good docstring or conference talk: technically grounded, one beat,
  then move on. Do not explain them or use generic portfolio buzzwords.
- Self-deprecation may target training losses, overfitting, or hallucinations, but never
  Cristian's actual competence.
- Apply the voice to microcopy, errors, empty states, and 404s as well as headline copy.

Prefer the sentence written by someone who finds this work genuinely fun over the one
written to impress a recruiter.

## Factual sources

Do not invent biography, roles, dates, outcomes, or technical claims. Use:

- the resume at `src/static/Cristian_C_Spagnuolo_CV.pdf` for roles, dates, and credentials;
- <https://github.com/cris96spa> for projects and activity;
- <https://www.linkedin.com/in/cristian-c-spagnuolo/> for background and activity.

If the sources are missing or ambiguous, write `TODO(content): ...`. A visible gap is
better than a plausible hallucination.

## Signature experiences

These are product requirements, not optional decoration.

### Forward-pass hero

The landing page animates a prompt such as "who is Cristian?" through the pipeline of a
named real architecture (GPT-2 124M, in `features/forward-pass-hero/architecture.ts`) and
streams the bio token by token. Phases follow real inference: tokenize, one parallel
prefill pass that fills the KV cache, then one decode pass per token. Playback is
scrubbable - play/pause, single-step, and a slider over the frames that have streamed.

The current source is deterministic and client-side, but rendering must consume a small
data-source interface so a real browser model or streamed response can replace it without
rewriting the animation. Rendering components must not depend on the source being fake:
`useForwardPass` buffers whatever the source yields and never asks it for a frame out of
order, and only `frames()` may pace itself.

Anything the diagram asserts must be checkable. Architecture numbers come from the
published model config, token splits from the real GPT-2 pretokenizer regex, and the
loss curves in `features/loss-curve/` from the Chinchilla fit. Where a shape is a
modelling choice rather than a published result, say so in the docstring.

### Scripted chat

Project and stack exploration uses preset questions and authored answers, with no live LLM
call. Keep the content outside components so a later retrieval/LLM mode can reuse the UI
shell.

Both experiences must be keyboard-accessible, respect `prefers-reduced-motion`, and never
gate the bio, projects, or resume behind JavaScript or animation completion.

## Architecture

- FastAPI owns content loading, validation, sanitization, and API delivery. React owns
  routing, presentation, and browser interactions.
- Keep API handlers thin: validate input, delegate to a service, and translate the result.
  Put portfolio behavior under `latent_space/`; reserve `utils/` for repository-wide
  infrastructure.
- Use Pydantic models at stable boundaries and FastAPI `Depends` for settings or external
  resources. Avoid mutable module state and import-time work.
- Use `YamlBaseSettings` for process configuration with environment overrides and
  `YamlBaseModel` for explicitly loaded YAML documents.
- Keep authored content separate from presentation and infrastructure. Create new
  directories only when implementing the corresponding feature.
- Prefer simple, maintainable code. The data-source seams required by the hero and chat
  are deliberate exceptions, not invitations to add speculative abstractions elsewhere.

### Backend

- Target Python 3.12+ and manage Python dependencies with `uv` in `pyproject.toml`.
- Group FastAPI routers by resource under `latent_space/api/`. Do not parse content or
  implement domain behavior in route handlers.
- Keep `/health` independent of content readiness so deployments have a reliable probe.
- Never expose secrets, tracebacks, internal paths, or private configuration. Commit only
  example values to `.env_template`.
- Return predictable errors with appropriate HTTP status codes.

### Frontend

- Use Vite, React, TypeScript, npm, oxlint, and React Router. Keep route components in
  `pages/`, primitives in `components/`, cohesive behavior in `features/`, hooks shared by
  more than one feature in `hooks/`, and small framework-independent helpers in `lib/`.
- Centralize backend calls and response types in `frontend/src/lib/api.ts`. Browser calls
  use `/api/*`; development and production proxies strip `/api` before forwarding to the
  backend.
- Prefer small function components, composition, and local state. Add shared state only
  when it genuinely spans unrelated branches.
- Build mobile-first semantic HTML with keyboard navigation, visible focus, WCAG AA
  contrast, useful alternative text, and reduced-motion support.
- Use Tailwind CSS v4 tokens defined in `frontend/src/index.css`. Preserve the established
  sky-blue brand palette, visualization accents, the `sweep-*` chart series hues, the
  off-brand `token-*` tokenizer highlight, semantic theme colors, self-hosted Inter and
  JetBrains Mono fonts, and `ls-theme` contract between `index.html` and `src/lib/theme.ts`.
- Check both themes before calling visual work done. A low-alpha wash of a mid-tone over a
  light panel disappears entirely over a dark one, so tints need a `dark:` variant rather
  than one opacity that "should" work for both.
- Cristian has a red-green colour-vision deficiency. Never encode a distinction in hue
  alone: separate states by lightness, shape, or an outline as well, and keep two tints
  that must be told apart out of the same narrow hue band.
- Reuse the primitives in `frontend/src/components/`; `TokenChip` is the recurring token
  motif. Use `brand-700` for CTA/body accents; `brand-600` is large-text-only.
- Core portfolio content must remain readable and linkable without interaction.

## Authored content

- Posts, projects, and chat answers are authored content, never inline component data.
- Content metadata has a stable unique slug, title, summary, publication date, and
  draft/published state. Published slugs and URLs are persistent; use a redirect if one
  must move. Never expose drafts in production responses.
- Markdown with frontmatter lives under `content/` and is loaded by
  `latent_space/services/content.py`. The frontmatter slug is authoritative and unique
  within its directory.
- Render rich text only in `latent_space/services/markdown.py` with `markdown-it-py`
  configured with `html=False`, followed by the `nh3` allowlist. The API returns sanitized
  HTML; React neither renders Markdown nor sanitizes source content.
- Keep large binaries in `src/static/` or the asset pipeline.

## Python style

These rules apply to every new or modified Python file, even when lint configuration
cannot enforce them.

- Choose explicit domain names over abbreviations or comments. Type every function
  signature and architectural boundary; prefer models, dataclasses, protocols, enums, and
  precise collections over `Any`, untyped dictionaries, or broad unions.
- Each function does one coherent job with visible side effects and a consistent return
  abstraction. Split unrelated modes instead of controlling them with boolean flags.
- Put genuine application-wide literals in `latent_space/constants.py` as descriptive
  `UPPER_SNAKE_CASE` names. Configuration belongs in settings, and a single-use local
  sentinel may stay local. Tests may assert literal values rather than importing the
  constant they intend to verify.
- Use concise Google-style docstrings. Document contracts and non-obvious behavior, not
  information already clear from names and types. Use single backticks for inline code.
- Do not add module-level docstrings. Comments should explain only non-obvious invariants,
  security constraints, algorithmic choices, or deliberate deviations; never narrate the
  code or preserve change history.
- Raise narrow, actionable exceptions without secrets. Do not catch `Exception` only to
  log and re-raise. Use standard logging at the boundary where an event occurs; never
  `print` from application code.
- Explain every non-trivial calculation or transformation and test it against a
  hand-computed or closed-form result.
- Ruff uses a 100-character line length. Do not add blanket lint exclusions; use a local
  `noqa` only when satisfying the rule would make the code less clear or correct.

## Tests and validation

- Every behavior change needs an appropriately scoped deterministic test.
- Mirror backend modules under `tests/`. Test endpoints through FastAPI's test client and
  dependency overrides; mock only external boundaries.
- Co-locate pure frontend logic tests as `*.test.ts` and run them with Vitest. The current
  runner uses a Node environment; add DOM/component or end-to-end tooling only when the
  interaction being tested requires it.
- Run checks relevant to the touched area. Python changes must pass `make format-check`,
  `make lint`, `make lint-doc`, and `make test`. Frontend changes normally require
  `make fe-lint`, `make fe-test`, and `make fe-build`.
- Use `make help` as the canonical command reference. Do not duplicate the full Makefile
  target list here.

## Change discipline

- Keep changes focused and preserve unrelated work in the working tree.
- Update tests and documentation with behavior or architecture changes.
- Remove superseded template examples after their replacement works.
- Follow Conventional Commits.
- Prefer the standard library and existing dependencies. Explain the purpose of each new
  dependency.
- Do not silently change public URLs, API response shapes, metadata, or configuration
  precedence.
- The public host, custom domain, TLS, and automated deployment remain undecided; do not
  invent them.
