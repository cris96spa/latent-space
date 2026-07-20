# latent-space

latent-space is Cristian Spagnuolo's personal site: part portfolio, part lab notebook,
part small piece of applied-ML performance art. It exists to answer "who is Cristian and
what does he build" in a way a PDF résumé cannot, and to do it in a voice that sounds like
Cristian, not like a template.

The application uses FastAPI and Python for the backend and React for the frontend. The
repository was initialized from a general-purpose Python template, so some files still
describe or demonstrate the template. Treat those as temporary scaffolding, not as product
requirements.

## Voice and tone

The product's personality is not decoration; it is the point of the exercise. Every
surface a visitor reads should sound **fresh, nerdy, and funny in the specific,
self-aware way engineers who love language models talk to each other** — never like
generic developer-portfolio copy ("results-driven professional passionate about
leveraging synergies"). Concretely:

- Reach for ML/LLM vocabulary as the site's native metaphor system, not as a gimmick
  bolted on top: tokens, embeddings, attention, context windows, temperature, inference,
  checkpoints, loss curves, overfitting, fine-tuning. Use them because they are the most
  precise and honest way to describe Cristian's world, and because the joke is that the
  metaphor is also literally true. "I want to look at training losses for the rest of my
  life" is the reference register.
- Be funny the way a good docstring or a good conference talk is funny: dry, technically
  grounded, one beat, then move on. Never explain the joke, never stack exclamation points
  to compensate for one that didn't land.
- "Fresh" means willing to break portfolio conventions (see Signature experiences below),
  not willing to be vague. Confidence and precision are part of the tone; buzzword soup is
  the opposite of it.
- Self-deprecation about training losses, overfitting, and hallucinations is on-brand.
  Self-deprecation about Cristian's actual competence is not — the humor undercuts the
  format, never the substance.
- This tone governs UI copy, error states, empty states, and microcopy, not just the hero
  section. A 404 page is a chance to be in-voice, not an exception to it.

When in doubt, prefer the sentence that sounds like it was written by someone who finds
this stuff genuinely fun over the one written to impress a recruiter.

## Source material

Do not invent biography, work history, project outcomes, or technical claims. Ground
content in:

- GitHub: <https://github.com/cris96spa> — real projects, activity, and pinned repos.
- Résumé: `src/static/Cristian_C_Spagnuolo_CV.pdf` — the canonical source for roles,
  dates, and credentials.
- LinkedIn: <https://www.linkedin.com/in/cristian-c-spagnuolo/> — background and activity.

Where source material is missing or ambiguous, use an explicit placeholder (for example
`TODO(content): ...`) rather than a plausible-sounding invented detail. A wrong fact is
worse than a visible gap.

## Signature experiences

Two interactions are the reason this site exists instead of a static page; treat them as
product requirements, not nice-to-haves.

**The forward-pass hero.** The landing page opens with an animated visualization in the
spirit of the [Transformer Explainer](https://poloclub.github.io/transformer-explainer/):
a prompt such as "who is Cristian?" enters as tokens, flows through a stylized embedding →
attention → MLP → logits pipeline, and streams out as the generated bio, token by token.
For the current milestone this is **entirely client-side and scripted** — deterministic
data, no model runs anywhere — but it must be built behind a small data-source abstraction
(for example a `TokenStream`/`ForwardPassFrame` interface) so a later milestone can swap
the scripted source for a real tiny in-browser model or a real streamed LLM response
without rewriting the animation layer. Do not bake the assumption that the data is fake
into the rendering components.

**The scripted chat.** Other parts of the site (for example "ask about my projects", "ask
about my stack") are explored through a chat-style UI backed by preset questions and
pre-written answers — no live LLM call, no backend inference cost, no hallucination risk.
Write the answers in voice. Structure the Q/A pairs as authored content, not inline
component data, so they can later be swapped for a retrieval-augmented, real-LLM-backed
mode without changing the UI shell.

Both features must degrade gracefully: keyboard-navigable, respecting
`prefers-reduced-motion`, and never gating core content (bio, projects, résumé link)
behind an animation finishing or JavaScript executing at all.

## Priorities

- Ship a thin, deployed FastAPI + React skeleton before layering design, animation, and
  content — validate the pipeline early rather than big-bang.
- Make the content easy to read, navigate, and share on desktop and mobile.
- Keep the design clean and distinctive, with accessibility and performance as defaults.
- Prefer simple, maintainable implementations over abstractions added for hypothetical
  future needs — except the explicit extensibility seams called out under Signature
  experiences, which are load-bearing product requirements, not speculative ones.
- Keep portfolio content separate from presentation and application infrastructure.

## Architecture

The backend and frontend are separate applications with a small, explicit HTTP boundary.
FastAPI owns content loading, validation, and API delivery. React owns routing,
presentation, and browser interactions. Do not put business or content-loading logic in
React components, and do not generate presentation markup in API handlers.

Prefer the following target layout as the repository grows:

```text
latent-space/
├── latent_space/           # Python package
│   ├── api/                # FastAPI routes and request dependencies
│   ├── core/               # Settings, logging, and application-wide concerns
│   ├── models/             # Pydantic API and content models
│   ├── services/           # Content loading and domain operations
│   ├── constants.py        # Shared application constants (see Python style)
│   └── app.py              # FastAPI application factory
├── frontend/               # React application
│   └── src/
│       ├── components/     # Reusable UI primitives
│       ├── features/       # Feature-specific UI and data access
│       ├── layouts/        # Shared page shells
│       ├── pages/          # Route-level components
│       ├── styles/         # Global styles and design tokens
│       └── lib/            # Small framework-independent helpers
├── content/
│   ├── posts/              # Blog source files and metadata
│   ├── projects/           # Portfolio project source files and metadata
│   └── chat/               # Scripted chat prompts/answers, authored as content
├── src/static/             # Static assets such as the downloadable CV
├── configs/                # YAML configuration
├── tests/                  # Python tests mirroring backend modules
├── docs/                   # Contributor and generated technical documentation
├── utils/                  # Repository tooling, not application/domain code
└── main.py                 # Temporary template entry point; keep thin
```

Create these directories only when the corresponding feature is implemented. Avoid empty
architecture scaffolding. As the FastAPI app takes shape, move application behavior out
of `main.py`; it should eventually contain only the development entry point, if one is
still needed. Expect `frontend/src/features/` to grow a `forward-pass-hero/` module and a
`chat/` module for the two signature experiences described above; keep each self-contained
behind the abstractions those sections require.

## Backend conventions

- Target Python 3.12 or later and manage dependencies with `uv` in `pyproject.toml`.
- Use FastAPI routers grouped by resource under `latent_space/api/`, one module per
  resource (for example `content.py`, `chat.py`, `monitoring.py`). Route handlers should
  validate input, delegate to a service, and translate the result into a response; keep
  them thin — no business logic, no content parsing in the handler body. This mirrors the
  router/service separation used in Cristian's other FastAPI templates, adapted to this
  repository's simpler dependencies: there is no `dependency_injector` container and no
  `artificonfig`-style config writer here, and neither should be introduced without a
  concrete need. Use plain FastAPI `Depends` and the settings pattern below instead.
- Include a `monitoring` router with a `/health` endpoint from the first skeleton commit,
  independent of content or chat readiness, so the deploy pipeline has something real to
  check.
- Use Pydantic models for structured data and API contracts. Do not pass ad-hoc dictionaries
  between layers when a stable schema exists.
- Use dependency injection for settings and external resources. Avoid mutable module-level
  state and work performed as an import side effect.
- Use `YamlBaseSettings` from `utils.configs` for singular process configuration that may
  be overridden by the environment. Use `YamlBaseModel` for explicitly loaded,
  repeatable YAML documents.
- Never expose secrets or private configuration to the frontend. Commit example values to
  `.env_template`, not credentials to `.env` or source files.
- Return predictable errors with appropriate HTTP status codes. Do not leak tracebacks or
  internal paths in API responses.
- Keep `utils/` limited to repository-wide infrastructure. Code that describes portfolio
  behavior belongs under `latent_space/`.

## Frontend conventions

- Use Vite + React + TypeScript for the frontend application (not Next.js). A lightweight
  SPA pairs cleanly with the separate FastAPI backend, keeps the build simple, and leaves
  full control over the custom hero animation.
- The frontend lives in `frontend/`, managed with **npm**, linted with **oxlint** (the
  create-vite default), and routed with **React Router** (`react-router-dom`). The
  production build outputs to `frontend/dist`.
- Prefer small function components, composition, and local state. Introduce shared state
  only when state genuinely spans unrelated parts of the component tree.
- Keep route-level components in `pages/`, reusable primitives in `components/`, and
  cohesive product behavior in `features/`.
- Centralize calls to the FastAPI backend in a typed API client (`frontend/src/lib/api.ts`).
  Components must not scatter raw URLs or duplicate request and response types. The client
  calls the backend under the `/api` prefix; the Vite dev server (and, later, the production
  edge) proxy `/api/*` to the backend and strip the prefix, so `/api/health` reaches the
  backend's unprefixed `/health`.
- Use semantic HTML and support keyboard navigation, visible focus, sufficient contrast,
  reduced-motion preferences, and useful alternative text.
- Build responsive layouts mobile-first. Avoid fixed dimensions that only work for one
  viewport.
- Establish a small set of design tokens for color, spacing, typography, radii, and motion
  before duplicating literal values across styles.
- Avoid unnecessary client-side JavaScript. Blog posts and core portfolio information
  should remain readable and linkable without interaction.

## Content conventions

- Treat posts and projects as authored content, not hard-coded component data.
- Each content item should have validated metadata with at least a stable slug, title,
  summary, publication date, and draft/published state. Add tags, canonical URL, cover
  image, or update date only when the product uses them.
- Slugs and published URLs are persistent identifiers. Do not change them casually; add a
  redirect when a published path must move.
- Draft content must not appear in production API responses or generated metadata.
- Render authored rich text through a controlled pipeline and sanitize any raw HTML.
- Store large binary assets in `src/static/` or the eventual asset pipeline, not inside
  content or Python modules.

## Python style

This is the part to get right: code is read far more often than it is written, and a
reader should not have to run it to understand what it does. These rules apply to every
new or modified Python file even where the current linter configuration cannot enforce
them automatically.

**Naming.** Names carry the meaning. A long, explicit name is better than a short, vague
name plus a comment explaining it: `published_blog_posts` over `posts`,
`content_source_path` over `path`, and `_require_unique_slug` over `_validate`. A function
name should say what the function does and, when the return is not obvious, what it
returns. Use domain vocabulary consistently across API routes, models, services, and
tests. Avoid abbreviations except established terms such as `api`, `url`, and `id`.

**Constants.** Do not hard-code the same literal string or value in more than one place, and
do not scatter bare magic values through the code. Application-wide constants — identity
values (the application and distribution name), fixed labels, default endpoints or origins,
and other shared literals — live in `latent_space/constants.py` as named, `UPPER_SNAKE_CASE`
values and are imported where needed, so each is defined once and changed in one place. Give
them explicit names that say what they are, and prefer two well-named constants over one
reused literal when the same string means two different things (for example the distribution
name looked up in package metadata versus the human-facing application name, even when they
currently share a value). Keep this for genuine constants only: a truly module-local,
single-use sentinel may stay in its module, and anything environment- or deployment-specific
belongs in configuration (`configs/` and `AppSettings`), never in `constants.py`. Test code
may assert against an inline literal instead of importing the production constant, so that a
wrong constant value is actually caught rather than silently confirmed against itself.

**Docstrings.** Use Google style (`ruff` pydocstyle `convention = "google"`, enforced by
pydoclint/Flake8-DOC). Give trivial public behavior a one-line summary. Add `Args`,
`Returns`, and `Raises` only when they communicate information that the signature and
names do not; do not document an obvious getter's return or a self-explanatory
`config: AppConfig` argument. Class docstrings describe the contract: invariants, lifecycle,
ownership, and what subclasses or callers must provide. They must not restate the class
name. In docstring source, use single-backtick inline code such as \`slug\`; never use RST
double backticks unless the literal itself requires them.

**No file/module-level docstrings.** Never add a top-of-file docstring. A module is
identified by its path, symbols, and behavior; a preamble that says "this module does X"
is duplicate documentation that will drift. This is stricter than the Ruff `D10` ignore,
which only means module docstrings are not required: they are actively disallowed here.

**Comments.** Default to none. Add a comment only when code cannot express the reason: a
non-obvious invariant, a security constraint, a subtle algorithmic step, or a deliberate
deviation from the natural implementation. Never add headings such as `# imports`, narrate
the next line with comments such as `# return result`, or preserve chat history, task
numbers, previous implementations, or review discussion in source. Change history belongs
in the commit message.

**Types and functions.** Type every function signature and every architectural boundary.
Avoid `Any`, untyped dictionaries, and broad unions when the domain can be represented by
a Pydantic model, dataclass, protocol, enum, or precise collection type. Each function
should perform one coherent job, keep side effects visible, and return at a consistent
level of abstraction. Do not use boolean flags to make one function perform unrelated
operations; split the behavior or model the choice explicitly.

**Errors and logging.** Raise the narrowest useful exception and include actionable
context without exposing secrets. Do not catch `Exception` merely to log and re-raise it,
and do not use exceptions for ordinary control flow. Use the repository's standard
`logging` setup instead of `print` in application code. Logging should record useful
events at the boundary where they occur, not duplicate the same failure through every
layer.

**Calculation-bearing code.** Any non-trivial calculation, ranking rule, date derivation,
reading-time estimate, or content transformation must explain its source or invariant in
the relevant function or class docstring. It must also have a test against a hand-computed
or closed-form result; shape checks and smoke tests alone are insufficient.

**Enforcement.** Ruff uses a 100-character line length, and pydoclint/Flake8-DOC checks
docstring structure. New and modified Python code must pass `make format-check`,
`make lint`, `make lint-doc`, and `make test` before it is complete. Do not add blanket
lint exclusions. A targeted `noqa` is acceptable only when the rule cannot be satisfied
without making the code less correct or less clear, and its reason must be evident at the
suppression site.

## Testing

- Every behavior change needs an appropriately scoped test.
- Mirror Python source modules with `tests/test_<module>.py`; organize larger suites into
  matching subdirectories as packages are introduced.
- Test API endpoints through FastAPI's test client and override dependencies instead of
  calling live services.
- Prefer assertions about observable behavior. Mock only external boundaries such as the
  filesystem, network, clock, or third-party services.
- Add frontend component tests for important interactions and end-to-end coverage for a
  small number of critical paths once the frontend test stack exists.
- Keep tests deterministic. Do not depend on the public internet, developer-specific
  paths, or shared mutable state.

Before considering a change complete, run the checks relevant to the touched area. For
the current Python application, the full validation set is formatting, linting,
docstring linting, and tests.

## Current commands

- `make dev` — install all Python dependency groups and pre-commit hooks.
- `make install` — install production Python dependencies.
- `make serve` — run the FastAPI app locally with Uvicorn autoreload (host `0.0.0.0`, port
  `8000` by default; override with `SERVE_HOST`/`SERVE_PORT`). The app is built through the
  `create_app` factory (`uvicorn latent_space.app:create_app --factory`), so no application
  object is constructed at import time. Endpoints: `GET /health`, `GET /version`, `GET /`.
- `make format` / `make format-check` — format Python or check formatting with Ruff.
- `make lint` / `make lint-doc` — run Python and docstring linters.
- `make test` — run pytest in parallel with coverage and doctest modules.
- `make pre-commit` — run every configured pre-commit hook.
- `make doc` — serve the ProperDocs/MkDocs documentation locally on port 8031 by default.
- `make help` — list available Make targets.

The React frontend lives in `frontend/` (Vite + React + TypeScript, npm). From a clean
checkout, run `make fe-install` once before the other targets:

- `make fe-install` — install frontend dependencies (`npm install` in `frontend/`).
- `make fe-dev` — run the Vite dev server (default port `5173`). It proxies `/api/*` to the
  backend on port `8000` with the `/api` prefix stripped, so `/api/health` reaches the
  backend's `/health`; run `make serve` in another shell for the API.
- `make fe-build` — build the production bundle into `frontend/dist`.
- `make fe-lint` — lint the frontend with oxlint.

There is no frontend test runner yet; it is introduced with the design and accessibility
work, not the skeleton. Document new frontend commands here only once they run from a clean
checkout.

The production topology is two containers behind a single origin: a FastAPI **backend**
(not published publicly) and an nginx **edge** that serves the built SPA and
reverse-proxies `/api/*` to the backend, stripping the prefix. They are wired by
`docker-compose.yml`:

- `docker compose build` — build the backend and edge images.
- `docker compose up` — run the stack locally. The edge is published on port `8080`
  (override with `EDGE_PORT`); `docker-compose.override.yml` also publishes the backend on
  `8000` for debugging. Open `http://localhost:8080` for the SPA and
  `http://localhost:8080/api/health` for the proxied API.
- `docker compose -f docker-compose.yml up` — run the production topology with the override
  excluded, so the backend is reachable only through the edge (single origin, no CORS).

The public host, custom domain, and TLS are not chosen yet, so the automated deploy step is
intentionally not wired; `/health` is the post-deploy smoke check once a host is selected.

## Change discipline

- Keep changes focused and preserve unrelated user work; this repository may have
  uncommitted template-customization changes.
- Update tests and documentation alongside behavior or architecture changes.
- Remove superseded template examples when their replacement is working, rather than
  maintaining parallel sample and production paths.
- Follow Conventional Commits, as enforced by the repository's pre-commit configuration.
- Do not add a dependency when the standard library or an existing dependency solves the
  problem clearly. Explain the role of every new dependency in the change that adds it.
- Do not silently alter public URLs, API response shapes, content metadata, or configuration
  precedence.
