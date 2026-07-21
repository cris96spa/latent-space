# Vercel Services Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy latent-space on Vercel as one project with two Services — a static Vite frontend and the existing FastAPI app as a native Python function — preserving the single-origin `/api/*` contract.

**Architecture:** A thin root-level `asgi.py` mounts the unchanged `create_app()` under `/api` (Vercel does not strip the prefix, so the mount re-strips it). A root `vercel.json` declares the two services and the top-level rewrites that route `/api/*` to the backend and everything else to the static frontend. Dependencies come from the existing `pyproject.toml` + `uv.lock` (Vercel reads uv natively); no `requirements.txt`.

**Tech Stack:** Vercel Services (Beta), Vercel Python runtime, FastAPI, Vite, `uv`, pytest.

## Global Constraints

- **Design source:** [docs/superpowers/specs/2026-07-21-vercel-services-deploy-design.md](../specs/2026-07-21-vercel-services-deploy-design.md). If plan and spec disagree, the spec wins.
- **No router/API changes:** existing routers stay unprefixed (`/health`, `/projects`, `/chat/entries`). Do not change router paths, response shapes, content, or config precedence.
- **No `requirements.txt`:** dependencies are `pyproject.toml` + `uv.lock` only.
- **Python:** 3.12+, Ruff 100-char line length, Google-style docstrings, no module-level docstrings (CLAUDE.md Python style).
- **Git is Cristian-managed.** Commit steps are written out, but only run them if Cristian is driving execution or has said to commit; otherwise stop at `git add` and report. Use Conventional Commits. When an agent commits, end the message with the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.
- **Content root is `content/`; config is `configs/app.yaml`** — resolved relative to the project base (Vercel's Python runtime sets CWD to the project base). Do not add a path-hardening change unless the first deploy shows content 404s.

---

### Task 1: Backend ASGI entrypoint for Vercel

Creates the deploy adapter that lets Vercel serve the FastAPI app under `/api`, plus the `pyproject.toml` entrypoint declaration. The load-bearing behavior is the `/api` mount: `/api/health` must work and bare `/health` must 404.

**Files:**
- Create: `asgi.py`
- Create: `tests/test_asgi.py`
- Modify: `pyproject.toml` (add a `[tool.vercel]` table)

**Interfaces:**
- Consumes: `latent_space.app.create_app() -> fastapi.FastAPI` (existing, unchanged).
- Produces: top-level module `asgi` exposing `app: fastapi.FastAPI`, where `create_app()` is mounted at `/api`. Vercel's entrypoint reference is `asgi:app`.

- [ ] **Step 1: Write the failing test**

Create `tests/test_asgi.py`:

```python
import pytest
from fastapi.testclient import TestClient

from asgi import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_health_is_served_under_api_prefix(client: TestClient):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_version_is_served_under_api_prefix(client: TestClient):
    response = client.get("/api/version")

    assert response.status_code == 200
    assert isinstance(response.json()["version"], str)


def test_content_router_is_reachable_under_api_prefix(client: TestClient):
    # Proves the whole app (not just monitoring) is mounted, without asserting on
    # specific authored content: an empty content dir still yields 200 + a list.
    response = client.get("/api/projects")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_unprefixed_path_is_not_served(client: TestClient):
    # The mount is at /api; the outer app has no bare /health. A 404 here is what
    # proves Vercel's non-stripped /api/* path lands on the app's /health.
    response = client.get("/health")

    assert response.status_code == 404
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest tests/test_asgi.py -v`
Expected: FAIL at collection/import with `ModuleNotFoundError: No module named 'asgi'`.

- [ ] **Step 3: Create the entrypoint**

Create `asgi.py` at the repo root:

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

- [ ] **Step 4: Run test to verify it passes**

Run: `uv run pytest tests/test_asgi.py -v`
Expected: PASS (4 passed).

- [ ] **Step 5: Declare the Vercel entrypoint in `pyproject.toml`**

Add this table to `pyproject.toml` (place it immediately after the `[tool.pyright]` block, before `[tool.hatch.build.targets.wheel]`):

```toml
[tool.vercel]
entrypoint = "asgi:app"
```

This tells Vercel's Python runtime to load `app` from `asgi.py` instead of autodetecting a filename — autodetect would otherwise find the existing `main.py`, which has no `app` object, and fail. `[tool.vercel]` is ignored by `uv` and `hatch`.

- [ ] **Step 6: Run the full backend check suite**

Run: `make format-check && make lint && make lint-doc && make test`
Expected: all pass, including the new `tests/test_asgi.py`. (`make test` runs `pytest -n auto --doctest-modules --cov=latent_space tests`; `asgi.py` at root is imported by the test via pytest's prepend import mode, which puts the repo root on `sys.path` because `tests/` is a package.)

- [ ] **Step 7: Commit** (see Global Constraints on git)

```bash
git add asgi.py tests/test_asgi.py pyproject.toml
git commit -m "feat(deploy): mount FastAPI under /api for Vercel Services"
```

---

### Task 2: `vercel.json` Services configuration

Declares the two services and the public route table. This is deploy configuration, verified by the first deploy rather than a unit test; the step-level check is JSON validity and a shape review against the spec.

**Files:**
- Create: `vercel.json`

**Interfaces:**
- Consumes: the `asgi:app` entrypoint from Task 1; the frontend build in `frontend/` (`framework: vite`).
- Produces: the deployed routing contract — `/api/*` → backend service, everything else → static frontend with SPA fallback.

- [ ] **Step 1: Create `vercel.json`**

Create `vercel.json` at the repo root:

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
    { "source": "/(.*)", "destination": { "service": "frontend" } }
  ]
}
```

Notes for the reviewer (do not paste into the file):
- Top-level rewrite order matters — the specific `/api/(.*)` must precede the `/(.*)` catch-all.
- `excludeFiles` trims the backend function bundle (Python on Vercel bundles all reachable files by default). `content/` and `configs/` are intentionally *not* excluded — the function reads them at runtime.
- `$schema` is intentionally omitted: the published schema does not yet list the Beta `services` key.

- [ ] **Step 2: Verify the JSON is valid**

Run: `python -m json.tool vercel.json > /dev/null && echo OK`
Expected: `OK` (no parse error).

- [ ] **Step 3: Confirm the frontend still builds**

Run: `make fe-build`
Expected: Vite build succeeds and writes `frontend/dist/` (sanity check that the frontend service's build target is intact; no frontend source changed).

- [ ] **Step 4: Commit** (see Global Constraints on git)

```bash
git add vercel.json
git commit -m "feat(deploy): declare Vercel Services frontend and backend"
```

---

### Task 3: Documentation — task 03 and README

Records the platform decision and the setup steps. No code; the deliverable is accurate docs a fresh reader can follow.

**Files:**
- Modify: `tasks/done/03-deploy-pipeline.md` (status + a Vercel note)
- Modify: `README.md` (add a Deploy section)

**Interfaces:**
- Consumes: the artifacts from Tasks 1–2 (`asgi.py`, `vercel.json`).
- Produces: none (documentation only).

- [ ] **Step 1: Update `tasks/done/03-deploy-pipeline.md`**

Change the `**Status:**` line (currently begins "In progress — local container stack done and verified; deploy-to-host blocked on platform choice") to record that the deploy target is now Vercel Services, linking the spec, and noting the compose topology is retained for local dev / an alternate container host.

Then add a `> **Platform update (2026-07-21).**` blockquote note immediately after the existing `> **Progress note.**` block (do not delete the compose progress note — it stays accurate for the container-host path). The note states: production deploy target is Vercel Services; one project runs a static Vite frontend service and the FastAPI app as a native Python function (`asgi.py` mounts `create_app()` under `/api`); routing lives in `vercel.json`; dependencies come from `pyproject.toml` + `uv.lock` (no `requirements.txt`); the Docker/compose stack and GHCR workflows are kept for local dev / an alternate container host and Vercel does not consume the GHCR images; record the canonical `*.vercel.app` URL after the first deploy; requires the Vercel Services and Python runtime permissions (both Beta).

- [ ] **Step 2: Add a Deploy section to `README.md`**

Append a `## Deploy` section (after the Docker subsection, before `## Configuration`) describing: the site deploys on Vercel as one project using Vercel Services — a static Vite frontend service (`frontend/`) and the FastAPI app as a native Python function (`asgi.py` mounts `create_app()` under `/api`, so the browser keeps calling the relative `/api/*` and routers stay unprefixed; deps install from `pyproject.toml` + `uv.lock`, no `requirements.txt`); routing lives in `vercel.json` (`/api/*` → backend, everything else → static frontend with client-side-routing fallback); one-time setup enables the Services and Python runtime permissions (both Beta), imports the repo, and sets the framework to Services; Vercel's Git integration deploys on push with per-PR previews; the Docker/compose stack and GHCR workflow remain for local dev / an alternate container host and are not used by the Vercel deploy.

- [ ] **Step 3: Verify links resolve**

Run: `python -m json.tool vercel.json > /dev/null && echo "config still valid"`
Run: `test -f docs/superpowers/specs/2026-07-21-vercel-services-deploy-design.md && echo "spec link OK"`
Expected: `config still valid` and `spec link OK`.

- [ ] **Step 4: Commit** (see Global Constraints on git)

```bash
git add tasks/done/03-deploy-pipeline.md README.md
git commit -m "docs(deploy): record Vercel Services as the deploy target"
```

---

### Task 4: First deploy verification checkpoints

Not code — the checklist to run against the first Vercel deployment, and the fallbacks if a checkpoint fails. Execute after Cristian has connected the repo and enabled the Beta permissions.

**Files:** none.

- [ ] **Step 1: Trigger a deploy** (Cristian's side)

Push the branch / open a PR so Vercel builds a preview, or run `vercel` locally if the CLI is set up. Confirm both services build (frontend Vite build + backend Python function).

- [ ] **Step 2: Verify routing and content**

Against the deployment URL:
- `GET /api/health` → `{"status": "ok"}`.
- `GET /api/projects` and `GET /api/chat/entries` → 200 with populated content (proves `content/` is bundled and CWD resolution works).
- Load `/` and a deep link (e.g. `/writing`) → the SPA renders (proves the frontend SPA fallback).
- The résumé PDF and fonts load.

- [ ] **Step 3: Resolve any checkpoint failures**

- If Vercel **rejects the root-`.` backend service** or mis-bundles `frontend/` into the function: fall back to relocating the Python app into a `backend/` directory (the sibling-dir layout every official example uses) and set the backend service `root: "backend/"`. This is a larger, separate change — write it as its own plan.
- If **content 404s** (`/api/projects` empty or erroring): confirm `content/` was not caught by `excludeFiles`; if CWD is not the project base, anchor `content_root` and the settings `yaml_file` to a `__file__`-derived project root in `latent_space/core/settings.py` and add a test that constructs `AppSettings()` from an unrelated CWD and asserts the resolved paths exist.
- If the **Python build fails on the hatch wheel target**: `pyproject.toml` has `[tool.hatch.build.targets.wheel] packages = ["latent-space"]` (hyphen) while the package dir is `latent_space` (underscore); correct it to `latent_space`.

- [ ] **Step 4: Record the canonical URL**

Once green, write the production `*.vercel.app` URL into `tasks/done/03-deploy-pipeline.md` (and `README.md` if desired), then commit (see Global Constraints on git).

---

## Self-Review

**Spec coverage:**
- Entrypoint (`asgi.py` mounting at `/api`) → Task 1. ✓
- `pyproject.toml` `[tool.vercel] entrypoint` → Task 1, Step 5. ✓
- `vercel.json` services + rewrites + `excludeFiles` → Task 2. ✓
- Frontend static, no code change → Task 2 (`framework: vite`, `fe-build` sanity). ✓
- No `requirements.txt`, no settings change → enforced in Global Constraints; settings change only as a Task 4 fallback. ✓
- Deterministic backend test (`/api/health` 200, `/health` 404) → Task 1, Step 1. ✓
- Docs: task 03 supersession + README Deploy section → Task 3. ✓
- First-deploy checkpoints (root-`.` acceptance, `excludeFiles`, hatch `packages` mismatch, content resolution) → Task 4. ✓
- Out of scope (custom domain/TLS, real-LLM chat, deleting compose/GHCR, deploy CI) → not planned. ✓

**Placeholder scan:** No TBD/TODO or "handle edge cases" steps; every code and config step shows full content. The only conditional content is Task 4's fallbacks, which are deliberately conditional on deploy outcomes and each specify the exact change.

**Type consistency:** `asgi.app` is a `FastAPI` instance across Task 1 (definition), the test, and Task 2's `entrypoint: "asgi:app"`. Endpoint paths (`/api/health`, `/api/projects`, `/api/chat/entries`, bare `/health`) are consistent between the test, `vercel.json` rewrites, and the docs.
