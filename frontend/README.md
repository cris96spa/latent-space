# frontend

The latent-space web client: Vite + React + TypeScript, talking to the FastAPI backend
over a small HTTP boundary. At this stage it is a skeleton — one placeholder route that
fetches `/health` to prove the pipeline has a pulse. Design, the forward-pass hero, and the
scripted chat come later.

## Layout

- `src/lib/` — framework-independent helpers, including the typed API client (`api.ts`),
  the single place backend URLs and response types live.
- `src/pages/` — route-level components.
- `src/layouts/` — shared page shells mounted by the router.

Folders from the target structure (`components/`, `features/`, `styles/`) are created when
first needed, not up front.

## Backend contract

The client calls the backend under the `/api` prefix. In development the Vite server proxies
`/api/*` to `http://localhost:8000` and strips the prefix, so `/api/health` reaches the
backend's `/health`. Start the API with `make serve` from the repository root.

## Commands

Run these from the repository root (they wrap `npm` in `frontend/`):

- `make fe-install` — install dependencies.
- `make fe-dev` — start the Vite dev server (port 5173).
- `make fe-build` — build the production bundle into `frontend/dist`.
- `make fe-lint` — lint with oxlint.
