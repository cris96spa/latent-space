[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue?style=flat-square&logo=github)](https://cris96spa.github.io/latent-space/)

# latent-space

Cristian Spagnuolo's personal site: part portfolio, part lab notebook, part applied-ML
performance art. It answers "Who is Cristian and what does he build?" in a voice a PDF
resume cannot.

The product is a **FastAPI** backend that loads, validates, sanitizes, and serves authored
content, and a **Vite / React / TypeScript** frontend that owns routing and presentation.
Two signature experiences carry the site: a forward-pass hero that streams the bio through a
GPT-2 pipeline, and a scripted chat over preset questions and authored answers.

See [`CLAUDE.md`](CLAUDE.md) for the architecture, content, and voice conventions.

## Layout

```
latent_space/      FastAPI app: api routers, models, services (content loading + markdown)
content/           Authored Markdown-with-frontmatter (projects, chat answers)
frontend/          Vite/React SPA (features/, components/, pages/, lib/)
utils/             Repository-wide infrastructure (settings base classes, release, docs)
tests/             Backend tests, mirroring latent_space/
```

## Getting started

The backend uses [uv](https://docs.astral.sh/uv/) as package manager and
[Make](https://www.gnu.org/software/make/) as command runner; the frontend uses npm. Run
`make help` for the full target list.

```bash
make dev          # backend venv + all dev deps + pre-commit hooks
make fe-install   # frontend dependencies
```

### Running locally

```bash
make serve        # FastAPI with autoreload on :8000
make fe-dev       # Vite dev server on :5173, proxying /api to the backend
```

The frontend calls `/api/*`; the dev proxy strips `/api` before forwarding to the backend.

### Checks

```bash
make format-check lint lint-doc test   # backend
make fe-lint fe-test fe-build          # frontend
```

### Docker

`docker compose up --build` builds the backend image and an nginx edge that serves the
built frontend and proxies `/api` to the backend.

## Configuration

Process settings use `YamlBaseSettings` (`utils/configs.py`), layered over the environment
so `LATENT_SPACE_`-prefixed variables override the YAML file in `configs/app.yaml`. For
YAML documents loaded explicitly by path, `YamlBaseModel` is the base class.
