# frontend

The latent-space web client: Vite + React + TypeScript, talking to the FastAPI backend
over a small HTTP boundary. It has a visual identity (Tailwind CSS v4, a sky-blue design-token
system, light/dark themes, and an app shell), the forward-pass hero, and the ablation-sweep
loss curve on the home route. The scripted chat comes later.

## Layout

- `src/lib/` - framework-independent helpers: the typed API client (`api.ts`, the single
  place backend URLs and response types live), the `cn` class joiner, `theme.ts`, and
  external `links.ts`.
- `src/components/` - reusable UI primitives built on the tokens (`Button`, `ButtonLink`,
  `TextLink`, `Card`, `SectionHeading`, `TokenChip`) plus the shell (`Header`, `Footer`,
  `ThemeToggle`).
- `src/pages/` - route-level components.
- `src/layouts/` - shared page shells (header + main + footer) mounted by the router.
- `src/hooks/` - hooks more than one feature needs (`useMediaQuery`, and the
  reduced-motion and compact-viewport queries built on it).
- `src/features/forward-pass-hero/` - the hero. Pure logic (`architecture`, `tokenize`,
  `sampling`, `frames`, `scriptedSource`) is separated from playback (`useForwardPass`)
  and from the SVG panels in `diagram/`, and only the source knows the data is scripted.
- `src/features/loss-curve/` - the ablation sweep: `scalingLaw.ts` holds the Chinchilla
  fit and the run families, the components only draw them.
- `src/index.css` - the single design-token source (`@theme`), theme variables, and base
  styles.

`styles/` is created when first needed, not up front.

## Styling

Tailwind CSS v4 via `@tailwindcss/vite`. Design tokens live once in `src/index.css` under
`@theme`; light is the default theme and dark is a `.dark` class toggled by `ThemeToggle`
(pre-applied before paint by an inline script in `index.html`). Fonts are self-hosted through
`@fontsource-variable` (Inter + JetBrains Mono). Every text/background pair meets WCAG AA.

## Backend contract

The client calls the backend under the `/api` prefix. In development the Vite server proxies
`/api/*` to `http://localhost:8000` and strips the prefix, so `/api/health` reaches the
backend's `/health`. Start the API with `make serve` from the repository root.

## Commands

Run these from the repository root (they wrap `npm` in `frontend/`):

- `make fe-install` - install dependencies.
- `make fe-dev` - start the Vite dev server (port 5173).
- `make fe-build` - build the production bundle into `frontend/dist`.
- `make fe-lint` - lint with oxlint.
- `make fe-test` - run the unit tests with Vitest (pure logic only; no DOM).
