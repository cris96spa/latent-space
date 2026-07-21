# Deploy — Vercel Services (task 03, re-platformed)

**Date:** 2026-07-21
**Task:** [03 — Deploy pipeline](../../../tasks/done/03-deploy-pipeline.md)
**Status:** Designed — awaiting implementation

## Summary

Task 03 decided a **two-container Docker Compose topology** (FastAPI backend + nginx edge)
and deferred the host, listing VPS / Fly / Render / Railway as candidates. Cristian is now
deploying on **Vercel**, which does not run that compose topology — Vercel runs a static
frontend plus serverless functions. So this supersedes the *deploy target* of task 03 (not
its acceptance goals): one public URL, deploy-on-push, `/health` reachable.

The vehicle is **[Vercel Services](https://vercel.com/docs/services)** (Beta): one Vercel
project running two services on one domain behind one public route table — a static Vite
frontend and the existing FastAPI app as a native Python function. This keeps the app's
single-origin `/api/*` contract intact (no CORS) and keeps a **live** backend, so the
future real-LLM chat (task 15) still has a seam to slot into.

The Docker/compose stack and the GHCR image workflow are **not** deleted — they remain
valid for local dev and for the alternate container-host path. They are simply not how
Vercel consumes the app.

## Decisions (confirmed with Cristian)

- **Platform:** Vercel Services, superseding the compose topology as the deploy target.
- **Repo layout:** Python stays at the repo root; backend service `root: "."`, frontend
  service `root: "frontend/"`. No relocation of the Python project. (The alternative — a
  `frontend/` + `backend/` monorepo — was declined as too much churn for this task.)
- **Backend dependencies:** `pyproject.toml` + `uv.lock`, read natively by Vercel. No
  `requirements.txt`, no `uv export`, no generated manifest to drift.
- **Not containers:** the frontend ships as static CDN output (`framework: vite`), the
  backend as a native Python function. Vercel container images are declined (permission-
  gated, Active-CPU billed, cold-start scale-to-zero) and are unnecessary now that uv is
  natively supported. Vercel also cannot consume the existing GHCR images by reference — it
  only builds a `Dockerfile.vercel` into its own registry — so reusing them is not an option
  regardless.

## How Vercel Services routing works (the two facts that shape the design)

Verified against [Services routing](https://vercel.com/docs/services/routing) and the
[Python runtime](https://vercel.com/docs/functions/runtimes/python) docs:

1. **The backend service receives the original path, including `/api`.** Vercel does *not*
   strip the prefix (unlike the Vite dev proxy and the nginx edge, which do). A request to
   `/api/health` reaches the service as `/api/health`, not `/health`.
2. **The Python runtime's working directory is the project base.** Relative paths like
   `content` and `configs/app.yaml` resolve against the repo root, so no path change is
   needed. (Kept as a fallback only: if content 404s on first deploy, anchor the paths.)

## Backend

The existing routers are unprefixed (`/health`, `/projects`, `/chat/entries`) and stay
**unchanged**. A thin ASGI entrypoint reconciles fact (1) above by mounting the app under
`/api`, which re-strips the prefix — preserving the exact contract the dev proxy provided.

### Entrypoint — `asgi.py` (repo root, new)

```python
from fastapi import FastAPI

from latent_space.app import create_app

# Vercel Services routes /api/* to this service without stripping the prefix (unlike the
# Vite dev proxy and the nginx edge, which strip it). Mounting the unprefixed application
# under /api re-strips it, so the existing routers keep serving /health, /projects, and
# /chat/entries unchanged, single-origin.
app = FastAPI()
app.mount("/api", create_app())
```

`create_app()` is reused verbatim; no router, model, or service changes. The outer app has
no routes of its own — it exists only to own the `/api` mount. This is a deploy adapter, the
same role the `Dockerfile` `CMD` plays for the container path, so constructing an app at
import here does not contradict the factory convention (which governs the library, not the
deploy shim).

### Dependency + entrypoint config — `pyproject.toml`

Add a single stanza so Vercel loads the wrapper without relying on filename autodetect
(autodetect would find the existing `main.py`, which has no `app` object, and fail):

```toml
[tool.vercel]
entrypoint = "asgi:app"
```

Dependencies come from the existing `[project.dependencies]` + `uv.lock`. The dev/test/
release groups are not default groups (`[tool.uv] default-groups = []`) and are not
installed.

## Frontend

No code change. The frontend already calls a relative `/api/*` (`frontend/src/lib/api.ts`,
`API_BASE_URL = '/api'`), so single-origin on Vercel needs nothing new. It is built by the
`vite` framework preset and served as static CDN output. A service-scoped rewrite provides
client-side-routing fallback; real static files are served before the rewrite, so JS/CSS
assets are not clobbered.

## `vercel.json` (repo root, new)

```json
{
  "services": {
    "frontend": {
      "root": "frontend/",
      "framework": "vite",
      "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
    },
    "backend": {
      "root": ".",
      "framework": "fastapi",
      "entrypoint": "asgi:app",
      "functions": {
        "asgi.py": {
          "excludeFiles": "{frontend/**,tests/**,docs/**,site/**,.venv/**,**/__pycache__/**}"
        }
      }
    }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": { "service": "backend" } },
    { "source": "/(.*)",     "destination": { "service": "frontend" } }
  ]
}
```

- **Top-level rewrites** are the public ingress; order matters (specific `/api/(.*)` before
  the catch-all). Everything not under `/api` goes to the static frontend.
- **`excludeFiles`** trims the backend function bundle. Python on Vercel bundles *all*
  reachable files by default (no tree-shaking), so `frontend/`, `tests/`, `docs/`, `site/`,
  `.venv/`, and `__pycache__` are excluded to keep the bundle small and the build fast.
  `content/` and `configs/` are deliberately *not* excluded — the function reads them at
  runtime. The glob is relative to the project root.
- The `entrypoint` is set both here and in `pyproject.toml`; the explicit service value is
  authoritative and also documents the shape in the routing file.
- `$schema` is intentionally omitted: the published schema at `openapi.vercel.sh/vercel.json`
  does not yet list the Beta `services` key, so including it would red-underline valid config.

## Deploy setup (Cristian's side — cannot be scripted here)

- Enable the **Services** and **Python runtime** permissions (both Beta, permission-gated)
  on the Vercel account/team.
- Import the repo; set the project framework setting to **Services**.
- Vercel's Git integration handles deploy-on-push and per-PR preview deployments. No new CI
  workflow is required; the existing `main-validate.yaml` keeps running validation.
- Optional: set `LATENT_SPACE_ALLOWED_ORIGINS=[]` as a production env var to make the
  no-CORS posture explicit. It is not required — same-origin requests never trigger CORS.

## Verification checkpoints (first deploy)

These are validated on the first deploy rather than assumed:

- **Root-`.` backend service is accepted** alongside the nested `frontend/` service. Every
  official example uses sibling subdirectories; if Vercel rejects an ancestor root or
  mis-bundles, the fallback is to relocate the Python app into `backend/` (the layout
  declined above).
- **`excludeFiles` / `functions` syntax** behaves as documented in Services mode, and
  `content/` + `configs/` are present in the deployed function.
- **Hatch wheel `packages` mismatch.** `pyproject.toml` has
  `[tool.hatch.build.targets.wheel] packages = ["latent-space"]` (hyphen) while the package
  directory is `latent_space` (underscore) — a template leftover. If Vercel builds the
  project wheel during install, this may fail; the fix is a one-line correction to
  `latent_space`. Flagged, not pre-emptively changed, to keep this change focused.
- **Content resolution:** `/api/projects` and `/api/chat/entries` return populated content
  (confirms CWD = project base and the bundled `content/` is found).

## Testing

- **Backend (new, deterministic):** a test over `asgi.app` via FastAPI's `TestClient`
  asserting `GET /api/health` → 200 `{"status": "ok"}`, `GET /api/projects` → 200 with the
  expected shape, and `GET /health` (unprefixed) → 404. The 404 is the load-bearing
  assertion: it proves the mount is at `/api` and the contract is honored.
- No frontend test: there is no frontend code change.
- `vercel.json` is configuration, not executed logic, and is validated by the first deploy
  rather than a unit test.

## Docs

- Update [tasks/done/03-deploy-pipeline.md](../../../tasks/done/03-deploy-pipeline.md):
  record that Vercel Services is the chosen deploy target, superseding the compose topology;
  note that the Docker/compose stack and GHCR workflow remain for local dev and the alternate
  container-host path; record the canonical `*.vercel.app` URL after the first deploy.
- Add a short **Deploy** section to `README.md` describing the Vercel Services setup and the
  two prerequisites (Services + Python runtime permissions).

## Out of scope

- Custom domain, TLS, and the canonical public host beyond the `*.vercel.app` URL Vercel
  issues (CLAUDE.md: do not invent a host).
- The real-LLM chat backend (task 15). This design preserves the live-backend seam for it
  but ships nothing toward it.
- Any change to router paths, API response shapes, content, or configuration precedence.
- Deleting or rewriting the Docker/compose stack or the GHCR image workflows.
- A Vercel-specific deploy CI workflow or a post-deploy smoke-check job (Vercel's own build
  gate + the existing validation workflow suffice for this cut).
