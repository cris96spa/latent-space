# Accessibility & performance pass (task 13)

**Date:** 2026-07-22
**Task:** [13 — Accessibility & performance pass](../../../tasks/13-accessibility-and-performance-pass.md) *(M5 — stretch/polish)*
**Status:** Designed — awaiting implementation

## Summary

A single deliberate, cross-cutting sweep that turns the per-feature accessibility and
performance *defaults* stated in CLAUDE.md into a *verified, measured baseline*, and adds
the shareability and test/CI machinery the site currently lacks. No new product features
and no new authored content beyond the microcopy this pass requires (a 404 page, per-page
meta descriptions, and Open Graph text).

The work is organised into five workstreams, landed as independent phases so each can be
reviewed and merged on its own:

1. Accessibility fixes + automated a11y checks
2. Performance: code-splitting, fonts, bundle budget, measured targets
3. SEO / shareability: per-page meta, Open Graph/Twitter cards, robots, sitemap
4. Frontend test setup (Vitest + Testing Library + axe) and Playwright e2e smoke tests
5. CI wiring

## Current state (audited)

- **App shape:** client-rendered Vite/React SPA on Vercel (`vercel.json` routes `/api/*`
  to FastAPI, everything else to the static frontend). The `pages.yml` workflow deploys
  *docs* to GitHub Pages — unrelated to the app.
- **Routes** (`App.tsx`): `/`, `/projects`, `/projects/:publicIdentifier`, `/resume`,
  `/writing`. **No catch-all / 404 route.**
- **Meta:** `index.html` has one static `<title>latent-space</title>` and one description.
  **No per-page titles, no Open Graph/Twitter cards, no `robots.txt`, no `sitemap.xml`.**
  A `<noscript>` block mirrors the canonical bio (home only).
- **Reduced motion:** genuinely handled — a global `@media (prefers-reduced-motion: reduce)`
  rule in `index.css` collapses all animation/transition durations, and `usePrefersReducedMotion`
  drives behavioural changes in the hero (`useForwardPass` parks on the final frame) and
  chat (`useChat` shows full text immediately). This pass *verifies and tests* it rather
  than re-implementing it.
- **A11y gaps confirmed by reading source:** no skip-to-content link; `<main>` in
  `RootLayout` has no `id` and no focus/scroll management on route change (a real
  screen-reader gap for an SPA); nav links carry no `aria-current`. Focus-visible outline
  and landmark elements (`header`/`main`/`footer`/`nav`) are already present.
- **Bundle (last `vite build`):** entry ~285 KB JS + ~36 KB CSS; a **~4.3 MB raw Plotly
  chunk** already code-split via `React.lazy` in `ChatMessage` and `SkillsRadarSection`, so
  it is off the critical path. Pages are **not** route-split (imported eagerly in `App.tsx`).
  Fonts are self-hosted, subset woff2 via `@fontsource-variable/*`.
- **Tests:** Vitest with the **Node** environment, pure-logic `*.test.ts` only. No Testing
  Library, no DOM, no axe, no e2e.
- **CI:** `main-validate.yaml` runs the Python validation composite action only. **The
  frontend has no CI coverage** (no lint/test/build/e2e).

## Decisions (confirmed with Cristian)

- **Shareability:** client-side per-page meta **+** static Open Graph/Twitter defaults in
  `index.html` **+** `robots.txt` + `sitemap.xml`. No SSR/prerender; the deploy model is
  unchanged.
- **Testing:** Vitest jsdom + Testing Library + `vitest-axe` for component/a11y/integration
  tests, **plus** Playwright for critical-path e2e smoke with the API stubbed via route
  interception (no backend needed in CI).
- **Analytics:** Vercel Web Analytics (`@vercel/analytics`) — first-party, cookieless, no
  consent banner.
- **Performance enforcement:** strong targets, Lighthouse **advisory** (non-blocking).
  Hard CI gates are lint, test, build, and a bundle-size budget.
- **404 page:** intentionally minimal — the logo and the error, in voice. Not an elaborate
  page.

## Judgment calls baked in

- **React 19 native metadata**, not `react-helmet`. React 19.2 hoists `<title>`/`<meta>`
  rendered anywhere in the tree into `<head>`, so per-page titles/descriptions need **no
  new dependency**. Static routes read their strings from a small `pageMeta` module; detail
  pages derive them from already-fetched `title`/`summary`.
- **Keep Plotly, keep it lazy.** The ~4.3 MB chunk is already off the critical path.
  Replacing it is a refactor with CVD-tuned theming risk and is out of scope; the cost is
  recorded and a lighter-library swap noted as a future option.
- **Static sitemap for the four top-level routes.** Detail pages are reachable via
  list-page links (Google renders JS). Enumerating per-post/-project URLs would couple the
  frontend build to backend content; deferred as a noted extension.
- **jsdom is opt-in per file.** `*.test.tsx` → jsdom via `environmentMatchGlobs`; existing
  `*.test.ts` stay on Node, honouring CLAUDE.md's "add DOM tooling only where the
  interaction needs it."
- **404 renders a friendly view, not a true HTTP 404 status.** A static SPA cannot set the
  response status without server involvement; acceptable and noted.

---

## Workstream 1 — Accessibility

### Fixes (each verified in a test or the running browser, never assumed)

- **Skip link** — a visually-hidden-until-focused "Skip to content" anchor as the first
  focusable element in `RootLayout`, targeting `#main-content`.
- **Main landmark + route focus** — give `<main id="main-content" tabIndex={-1}>`. Add a
  small `useRouteFocus` hook (or a `RouteFocus` effect in `RootLayout`) that, on
  `location.pathname` change, moves focus to `#main-content` and resets scroll to top —
  **suppressed under reduced motion for scroll behaviour, but focus still moves.** This is
  the SPA equivalent of a full-page load for assistive tech.
- **`aria-current="page"`** on the active nav link in `Header.tsx` (use `NavLink`).
- **404 route** — `path="*"` → a minimal `NotFound` page: the logo, an in-voice error
  heading/message, and a single link home (a 404 with no way out is an anti-pattern).
  Proper single `<h1>`. Copy in ML voice (e.g. an out-of-vocabulary / 404-token joke),
  kept to one beat.
- **Heading + landmark audit** — confirm exactly one `<h1>` per route (the hero owns the
  home `<h1>`; `/projects`, `/writing`, `/resume`, 404 each need one), logical `h2`/`h3`
  order, and that every page's primary region sits in `<main>`.
- **Contrast** — verify WCAG AA on text and interactive states in **both** themes; fix any
  failures by adjusting lightness (never hue alone — Cristian has red-green CVD).

### Automated checks

- `vitest-axe` assertions on rendered Home, Chat, Projects list, and 404 (jsdom).
- An axe scan in the Playwright suite against the live-rendered pages (catches issues that
  only appear with real CSS/layout).
- Lighthouse accessibility target **100** (advisory).

### Reduced-motion verification

- Explicit tests that reduced motion **disables** rather than dampens: the hero parks on
  the final frame and does not auto-play; chat renders the full authored answer immediately
  with no per-word reveal. Cover both the hooks (unit) and a rendered page (integration).

## Workstream 2 — Performance

- **Route-level code-splitting** in `App.tsx`: each page becomes `React.lazy` behind a
  `Suspense` boundary with an in-voice fallback, keeping the entry lean as content grows.
  Plotly stays lazy.
- **Fonts:** add `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the
  primary Inter latin subset to improve LCP; confirm `font-display: swap`. (The exact
  hashed asset path is resolved at build; preload the stable subset the hero renders first.)
- **Bundle-size budget** as a **hard** CI check: a small script over `dist/assets` (or
  `size-limit`) that fails if the entry JS chunk exceeds a threshold (initial line: ~200 KB
  gzipped for the entry; tune to the measured baseline + headroom). Plotly's lazy chunk is
  explicitly excluded from the entry budget.
- **Analytics:** mount `@vercel/analytics`'s `<Analytics />` once at the app root; it loads
  deferred and is inert in local dev.
- **Recorded targets** (mobile, mid-tier throttling), documented in this spec and the CI
  Lighthouse config: Lighthouse Performance ≥ 90, Accessibility = 100, Best-Practices ≥ 95,
  SEO ≥ 100; LCP < 2.5 s, CLS < 0.1, TBT < 200 ms. Lighthouse runs advisory in CI and as a
  documented manual step.
- **Animation smoothness:** confirm hero/chat animations use `transform`/`opacity` (GPU
  compositable) rather than layout-affecting properties; document a manual throttled-CPU
  check.

## Workstream 3 — SEO / shareability

- **Per-page `<title>` + `<meta name="description">`** via React 19 metadata:
  - `frontend/src/lib/pageMeta.ts` — a typed map of static-route meta (home, projects,
    resume, writing, 404) with in-voice titles/descriptions. Content stays out of
    components per CLAUDE.md.
  - A tiny `<PageMeta title description />` component (renders `<title>`/`<meta>`; React
    hoists them). Static pages pass literals from `pageMeta`; `ProjectDetailPage` passes the
    fetched project's `title`/`summary`.
- **Static Open Graph / Twitter cards** in `index.html`: `og:title`, `og:description`,
  `og:type`, `og:url`, `og:site_name`, `og:image`; `twitter:card=summary_large_image`,
  `twitter:title`, `twitter:description`, `twitter:image`. These are the site-identity
  defaults every shared link renders (non-JS card crawlers never see the client-set
  per-page tags).
- **OG image** — generate a 1200×630 branded card into `frontend/public/og-image.png`,
  consistent with the sky-blue brand and the `>_ latent-space` mark. Referenced by absolute
  URL in the OG/Twitter tags.
- **`frontend/public/robots.txt`** — allow all, reference the sitemap.
- **`frontend/public/sitemap.xml`** — the four stable top-level routes. Per-detail URLs are
  a noted future extension (would require a build-time generator reading backend content).

## Workstream 4 — Frontend test setup + e2e

### Unit/component/integration (Vitest)

- Dev deps: `@testing-library/react`, `@testing-library/jest-dom`,
  `@testing-library/user-event`, `jsdom`, `vitest-axe`.
- `vitest.config.ts`: keep `environment: 'node'` as default; add
  `environmentMatchGlobs: [['**/*.test.tsx', 'jsdom']]` and a `setupFiles` that registers
  `jest-dom` and `vitest-axe` matchers. A shared render helper wraps components in
  `MemoryRouter`, and a fetch/`api` stub supplies fixture content.
- Tests: home renders the canonical bio text; selecting a suggested prompt renders the
  authored chat answer (reduced-motion path, deterministic); projects list renders cards
  from a mocked API; axe-clean on Home/Chat/Projects/404; reduced-motion behaviour.

### End-to-end (Playwright)

- Dev dep `@playwright/test`; `playwright.config.ts` with `webServer` running
  `npm run preview` against the built `dist`, and **`page.route('**/api/**', …)`** returning
  JSON fixtures — no backend required.
- Smoke paths: home loads and the bio is present; a **JS-disabled** context asserts the
  `<noscript>` bio (the crawlability/graceful-degradation claim); projects list shows
  mocked items; a chat prompt yields its authored answer; the **CV/résumé link downloads**
  the PDF; a keyboard smoke (skip link reachable, hero playback controls operable); an axe
  scan on home + projects.
- Fixtures live under a test-support directory, not in `src/` shipped code.

## Workstream 5 — CI

- **New frontend job** (single Node job; no Python matrix), added to `main-validate.yaml`
  or a sibling `frontend-validate.yaml`, triggered on push/PR: `npm ci` in `frontend`, then
  `fe-lint`, `fe-test`, `fe-build`, the bundle-budget check, `npx playwright install
  --with-deps`, and the Playwright e2e suite. These are **hard gates**.
- **Lighthouse advisory** — a separate `continue-on-error: true` step running `@lhci/cli`
  (or `treosh/lighthouse-ci-action`) against the preview server with the recorded targets,
  uploading a report. Never blocks the build.
- **Makefile** — add `fe-e2e` (Playwright) and an aggregate `fe-check`
  (lint + test + build + budget); keep e2e out of the git pre-commit hook (too slow) while
  leaving `fe-lint`/`fe-test` eligible.

## Files touched (indicative, not exhaustive)

- **New:** `frontend/src/pages/NotFound.tsx`; `frontend/src/lib/pageMeta.ts`;
  `frontend/src/components/PageMeta.tsx`; `frontend/src/hooks/useRouteFocus.ts`;
  `frontend/public/{robots.txt,sitemap.xml,og-image.png}`; `frontend/playwright.config.ts`;
  `frontend/src/test/setup.ts` + fixtures; component/e2e test files; a bundle-budget script;
  a Lighthouse config; a CI job/workflow.
- **Edited:** `App.tsx` (lazy routes + 404), `RootLayout.tsx` (skip link, main id, route
  focus, `<Analytics />`), `Header.tsx` (`NavLink` + `aria-current`), `index.html`
  (OG/Twitter + font preload), `vitest.config.ts`, `package.json`, `Makefile`,
  `main-validate.yaml`.

## Out of scope

- No SSR or build-time prerendering; no replacement of Plotly; no per-detail sitemap
  generation; no new product features or authored posts/projects; no heavy
  observability/analytics beyond Vercel Web Analytics. Backend behaviour, API shapes, and
  public URLs are unchanged.

## Acceptance criteria (from the task, made concrete)

- Automated a11y checks (vitest-axe + Playwright axe) pass on every page; documented manual
  keyboard + screen-reader pass is clean; reduced motion fully disables hero/chat motion
  (tested); core bio content is present without JS (tested).
- Route-level code-splitting in place; entry bundle within budget (enforced in CI);
  measured Lighthouse/Core-Web-Vitals recorded against the agreed targets.
- Per-page `<title>`/description present; static OG/Twitter cards + OG image render an
  intentional card for shared links; `robots.txt` + `sitemap.xml` served.
- Critical-path Playwright smoke tests (home + bio, projects list, chat answer, CV
  download) exist and run in CI alongside `fe-lint`/`fe-test`/`fe-build` + bundle budget.
