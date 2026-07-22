# Accessibility & Performance Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn latent-space's accessibility, performance, and shareability defaults into a verified, measured, CI-guarded baseline, and add the frontend test/e2e machinery the repo currently lacks.

**Architecture:** The app is a client-rendered Vite/React/TS SPA on Vercel. We keep that model: per-page `<title>`/`<meta>` come from React 19's native metadata hoisting, static Open Graph/Twitter defaults live in `index.html`, and a friendly 404 route, skip link, and SPA route-focus close the a11y gaps. Route-level code-splitting and a gzip bundle budget keep the entry lean; the ~4.3 MB Plotly chunk stays lazy. Vitest gains an opt-in jsdom + Testing Library + `vitest-axe` layer, Playwright provides API-stubbed e2e smoke tests, and a new CI job runs all of it (Lighthouse advisory-only).

**Tech Stack:** React 19.2, React Router 7, Vite 8, Tailwind v4, Vitest 3, `@testing-library/react` 16, `vitest-axe`, jsdom, Playwright, `@axe-core/playwright`, `@vercel/analytics`, GitHub Actions.

## Global Constraints

- **No new runtime metadata dependency.** Per-page titles/descriptions use React 19 native `<title>`/`<meta>` hoisting — do **not** add `react-helmet`.
- **Keep Plotly lazy.** Do not import Plotly into any eagerly-loaded module; it must stay in its own `React.lazy` chunk. Do not replace Plotly.
- **Vitest default environment stays `node`.** jsdom is opt-in per file via `environmentMatchGlobs` for `**/*.test.tsx`. Import test globals explicitly from `vitest` (no `globals: true`), matching existing `*.test.ts` files.
- **Tailwind v4 tokens only** (defined in `frontend/src/index.css`). Preserve the sky-blue brand palette. No new palette entries.
- **Red-green CVD:** never encode a distinction in hue alone; separate by lightness/shape/outline. Check **both** light and dark themes before calling visual work done.
- **Do not invent the public host.** The custom domain/TLS are undecided (CLAUDE.md). `og:url`, absolute `og:image`, and absolute sitemap `<loc>`s are left as `TODO(deploy)` and ship relative for now.
- **Commit per task on feature branch `refactor/accessibility-and-seo`.** Stage only the files this task changed — exactly the paths in its Commit step — and never `git add -A`/`git add .`. Do NOT touch or stage unrelated working-tree changes: the hero-diagram WIP (`frontend/src/features/forward-pass-hero/diagram/LogitsPanel.tsx`, `MlpPanel.tsx`, `layout.ts`) and the docs files. Never `git push`. Cristian controls the merge to main.
- **Commands run from `frontend/`** unless stated. `make` targets run from the repo root.
- Frontend changes must keep `make fe-lint`, `make fe-test`, and `make fe-build` green.

---

## Phase 1 — Test harness

### Task 1: Vitest jsdom + Testing Library + axe harness

**Files:**
- Modify: `frontend/package.json` (devDependencies + scripts)
- Modify: `frontend/vitest.config.ts`
- Modify: `frontend/tsconfig.app.json:26` (exclude `.test.tsx` + test support from the app build)
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/test/render.tsx`
- Test: `frontend/src/components/TokenChip.test.tsx`

**Interfaces:**
- Produces: `renderInApp(ui, { route })` from `src/test/render.tsx` — renders `ui` inside `<MemoryRouter>` + a `<main>` landmark; returns Testing Library's `RenderResult`. Later tasks reuse it.
- Produces: a global test setup registering `@testing-library/jest-dom` and `vitest-axe` matchers, cleanup after each test, and a `window.matchMedia` shim (jsdom lacks it; `useMediaQuery` needs it).

- [ ] **Step 1: Install dev dependencies**

Run (from `frontend/`):
```bash
npm install -D @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14 jsdom@^25 vitest-axe@^0.1.0
```
Expected: `package.json` devDependencies gain those five packages; `npm` exits 0.

- [ ] **Step 2: Configure Vitest for opt-in jsdom + setup**

Replace `frontend/vitest.config.ts` with:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Pure-logic suites stay in the fast Node env; component suites (*.test.tsx) opt into
    // jsdom. Keeping Node the default honours CLAUDE.md ("add DOM tooling only where the
    // interaction needs it").
    environment: 'node',
    environmentMatchGlobs: [['**/*.test.tsx', 'jsdom']],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 3: Write the shared test setup**

Create `frontend/src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'

import * as axeMatchers from 'vitest-axe/matchers'
import { afterEach, expect } from 'vitest'

expect.extend(axeMatchers)

// DOM-only wiring, guarded so this shared setup stays inert for the node-env (*.test.ts)
// suites. Testing Library is imported dynamically only when a document exists.
if (typeof window !== 'undefined') {
  const { cleanup } = await import('@testing-library/react')
  afterEach(cleanup)

  // jsdom does not implement matchMedia, which useMediaQuery/usePrefersReducedMotion call.
  // Default every query to "no match"; individual tests override window.matchMedia as needed.
  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList
  }
}
```

- [ ] **Step 4: Write the render helper**

Create `frontend/src/test/render.tsx`:
```tsx
import type { ReactElement, ReactNode } from 'react'

import { render, type RenderResult } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

interface RenderInAppOptions {
  /** Initial router entry; defaults to the home route. */
  route?: string
}

/**
 * Renders `ui` inside a router and a `<main>` landmark, so route-aware components work and
 * axe's region/landmark rules see a realistic page shell (avoiding false "region" violations
 * on section-level fragments).
 */
export function renderInApp(ui: ReactElement, { route = '/' }: RenderInAppOptions = {}): RenderResult {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <main>{children}</main>
      </MemoryRouter>
    )
  }
  return render(ui, { wrapper: Wrapper })
}
```

- [ ] **Step 5: Keep test files out of the production TS build**

In `frontend/tsconfig.app.json`, replace the `exclude` line:
```json
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/test"]
```

- [ ] **Step 6: Write the harness smoke test**

Create `frontend/src/components/TokenChip.test.tsx`:
```tsx
import { screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it } from 'vitest'

import { TokenChip } from './TokenChip'
import { renderInApp } from '../test/render'

describe('TokenChip', () => {
  it('renders its children', () => {
    renderInApp(<TokenChip tone="neutral">PyTorch</TokenChip>)
    expect(screen.getByText('PyTorch')).toBeInTheDocument()
  })

  it('has no automatically-detectable accessibility violations', async () => {
    const { container } = renderInApp(<TokenChip tone="neutral">PyTorch</TokenChip>)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 7: Run the suite (Node + jsdom together)**

Run: `npm run test`
Expected: PASS — existing `*.test.ts` suites still pass in Node; `TokenChip.test.tsx` passes in jsdom.

- [ ] **Step 8: Confirm lint and build still pass**

Run: `npm run lint && npm run build`
Expected: both exit 0 (test files excluded from the app build).

- [ ] **Step 9: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts \
  frontend/tsconfig.app.json frontend/src/test frontend/src/components/TokenChip.test.tsx
git commit -m "test(frontend): add jsdom + Testing Library + axe harness"
```

---

## Phase 2 — Accessibility

### Task 2: 404 route

**Files:**
- Create: `frontend/src/pages/NotFound.tsx`
- Modify: `frontend/src/App.tsx` (add catch-all route)
- Test: `frontend/src/pages/NotFound.test.tsx`

**Interfaces:**
- Produces: `NotFound` (named export) — a minimal in-voice 404 view (logo + error + one link home). Task 9 later converts it to a lazy route.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/pages/NotFound.test.tsx`:
```tsx
import { screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it } from 'vitest'

import { NotFound } from './NotFound'
import { renderInApp } from '../test/render'

describe('NotFound', () => {
  it('shows the error and a single link back home', () => {
    renderInApp(<NotFound />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /input layer/i })).toHaveAttribute('href', '/')
  })

  it('shows the logo with a text alternative', () => {
    renderInApp(<NotFound />)
    expect(screen.getByAltText('latent-space')).toBeInTheDocument()
  })

  it('has no automatically-detectable accessibility violations', async () => {
    const { container } = renderInApp(<NotFound />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test -- NotFound`
Expected: FAIL — cannot resolve `./NotFound`.

- [ ] **Step 3: Write the 404 page**

Create `frontend/src/pages/NotFound.tsx`:
```tsx
import { Link } from 'react-router-dom'

import { buttonClassName } from '../components/button-variants'

/**
 * The catch-all 404. Deliberately minimal (Cristian's request): the logo, the error, and one
 * way back. A static SPA cannot set a real 404 HTTP status without server involvement, so this
 * is a friendly rendered 404, not a status code.
 */
export function NotFound() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <img src="/favicon.png" alt="latent-space" className="size-14" />
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-700 dark:text-brand-300">
          404 · token not in vocabulary
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">This route never trained</h1>
        <p className="text-muted">
          Nothing here answers to that URL - it may have moved, or only ever existed in a
          hallucination. Everything real is one hop back.
        </p>
      </div>
      <Link to="/" className={buttonClassName('primary')}>
        Back to the input layer
      </Link>
    </section>
  )
}
```

- [ ] **Step 4: Wire the catch-all route**

In `frontend/src/App.tsx`, add the import and the last route inside the `RootLayout` route:
```tsx
import { NotFound } from './pages/NotFound'
```
```tsx
        <Route path="writing" element={<WritingPage />} />
        <Route path="*" element={<NotFound />} />
```

- [ ] **Step 5: Run the tests**

Run: `npm run test -- NotFound`
Expected: PASS (all three).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/NotFound.tsx frontend/src/pages/NotFound.test.tsx frontend/src/App.tsx
git commit -m "feat(frontend): add in-voice 404 page and catch-all route"
```

---

### Task 3: Skip link, main landmark, and SPA route focus

**Files:**
- Create: `frontend/src/components/SkipLink.tsx`
- Create: `frontend/src/hooks/useRouteFocus.ts`
- Modify: `frontend/src/layouts/RootLayout.tsx`
- Test: `frontend/src/hooks/useRouteFocus.test.tsx`

**Interfaces:**
- Produces: `SkipLink` — a visually-hidden-until-focused anchor to `#main-content`.
- Produces: `useRouteFocus(mainRef)` — moves focus to `mainRef` and scrolls to top on each pathname change after the first render.
- Produces: `<main id="main-content" tabIndex={-1}>` wrapping a `<Suspense>` boundary (relied on by Task 9's lazy routes).

- [ ] **Step 1: Write the failing test for route focus**

Create `frontend/src/hooks/useRouteFocus.test.tsx`:
```tsx
import { useRef } from 'react'

import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { useRouteFocus } from './useRouteFocus'

function Harness() {
  const mainRef = useRef<HTMLElement>(null)
  useRouteFocus(mainRef)
  const navigate = useNavigate()
  return (
    <main id="main-content" ref={mainRef} tabIndex={-1}>
      <button type="button" onClick={() => navigate('/projects')}>
        go
      </button>
      <Routes>
        <Route path="/" element={<p>home</p>} />
        <Route path="/projects" element={<p>projects</p>} />
      </Routes>
    </main>
  )
}

describe('useRouteFocus', () => {
  it('does not steal focus on the first render', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Harness />
      </MemoryRouter>,
    )
    expect(document.activeElement).toBe(document.body)
  })

  it('moves focus to the main landmark after a route change', async () => {
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/']}>
        <Harness />
      </MemoryRouter>,
    )
    getByRole('button', { name: 'go' }).click()
    // Focus moves on the effect that runs after the navigation commit; waitFor polls until then.
    await waitFor(() => expect(document.activeElement).toBe(getByRole('main')))
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test -- useRouteFocus`
Expected: FAIL — cannot resolve `./useRouteFocus`.

- [ ] **Step 3: Write the hook**

Create `frontend/src/hooks/useRouteFocus.ts`:
```ts
import { useEffect, useRef, type RefObject } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * On each pathname change after the first render, moves keyboard focus to the main landmark
 * and scrolls to the top, so an SPA navigation behaves like a full-page load for assistive
 * tech. The first render is skipped so focus is not stolen on initial paint.
 */
export function useRouteFocus(mainRef: RefObject<HTMLElement | null>): void {
  const { pathname } = useLocation()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    mainRef.current?.focus()
    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0 })
    }
  }, [pathname, mainRef])
}
```

- [ ] **Step 4: Run the test**

Run: `npm run test -- useRouteFocus`
Expected: PASS (both cases).

- [ ] **Step 5: Write the skip link**

Create `frontend/src/components/SkipLink.tsx`:
```tsx
/**
 * A "skip to content" anchor: visually hidden until focused, then the first thing a keyboard
 * user reaches. Targets the `#main-content` landmark in `RootLayout`.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only rounded-lg border border-border bg-surface px-4 py-2 text-sm text-fg focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
    >
      Skip to content
    </a>
  )
}
```

- [ ] **Step 6: Wire the layout (skip link + main landmark + focus + Suspense)**

Replace `frontend/src/layouts/RootLayout.tsx` with:
```tsx
import { Suspense, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { SkipLink } from '../components/SkipLink'
import { useRouteFocus } from '../hooks/useRouteFocus'

/** In-voice fallback while a lazily-loaded route chunk (Task 9) resolves. */
function PageLoading() {
  return (
    <p role="status" className="text-muted">
      Loading the next layer&hellip;
    </p>
  )
}

export function RootLayout() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  useRouteFocus(mainRef)

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <Header />
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        key={location.pathname}
        className="flex-1 [animation:rise-in_0.3s_var(--ease-out-expo)] focus:outline-none"
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 7: Run tests, lint, and build**

Run: `npm run test -- useRouteFocus && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/SkipLink.tsx frontend/src/hooks/useRouteFocus.ts \
  frontend/src/hooks/useRouteFocus.test.tsx frontend/src/layouts/RootLayout.tsx
git commit -m "feat(a11y): add skip link, main landmark focus, and route-focus management"
```

---

### Task 4: Navigation accessibility (`aria-current` + unique landmarks)

**Files:**
- Modify: `frontend/src/components/Header.tsx`
- Modify: `frontend/src/components/Footer.tsx`
- Test: `frontend/src/components/Header.test.tsx`

**Interfaces:**
- Consumes: `cn` from `src/lib/cn`.
- Produces: Header nav labelled `"Primary"`, Footer nav labelled `"Social"`, and internal links as `NavLink`s that set `aria-current="page"` when active.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/Header.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { Header } from './Header'

function renderAt(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Header />
    </MemoryRouter>,
  )
}

describe('Header', () => {
  it('marks the active route link with aria-current="page"', () => {
    renderAt('/projects')
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Writing' })).not.toHaveAttribute('aria-current')
  })

  it('names its navigation landmark', () => {
    renderAt('/')
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test -- Header`
Expected: FAIL — no `aria-current`, no named navigation landmark.

- [ ] **Step 3: Update the Header**

In `frontend/src/components/Header.tsx`:
1. Change the import to add `NavLink` and `cn`:
```tsx
import { Link, NavLink } from 'react-router-dom'

import { cn } from '../lib/cn'
import { EXTERNAL_LINKS } from '../lib/links'
import { LinkIcon } from './LinkIcon'
import { TextLink } from './TextLink'
import { ThemeToggle } from './ThemeToggle'
```
2. Add `aria-label="Primary"` to the `<nav>`:
```tsx
        <nav className="flex items-center gap-4 text-sm" aria-label="Primary">
```
3. Replace the three internal `<Link>` elements (Projects, Writing, Resume) with `NavLink`s that keep the same styling and gain an active accent (lightness shift, not hue-only — the resting link is `text-fg`, active is the brand tone shared with hover):
```tsx
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              cn(
                'font-medium transition-colors hover:text-brand-700 dark:hover:text-brand-300',
                isActive ? 'text-brand-700 dark:text-brand-300' : 'text-fg',
              )
            }
          >
            Projects
          </NavLink>
          <NavLink
            to="/writing"
            className={({ isActive }) =>
              cn(
                'font-medium transition-colors hover:text-brand-700 dark:hover:text-brand-300',
                isActive ? 'text-brand-700 dark:text-brand-300' : 'text-fg',
              )
            }
          >
            Writing
          </NavLink>
          <NavLink
            to="/resume"
            className={({ isActive }) =>
              cn(
                'font-medium transition-colors hover:text-brand-700 dark:hover:text-brand-300',
                isActive ? 'text-brand-700 dark:text-brand-300' : 'text-fg',
              )
            }
          >
            Resume
          </NavLink>
```
Leave the logo `<Link to="/">` and the external GitHub `TextLink` unchanged.

- [ ] **Step 4: Name the Footer navigation landmark**

In `frontend/src/components/Footer.tsx`, add the label to its `<nav>`:
```tsx
        <nav className="flex items-center gap-4" aria-label="Social">
```

- [ ] **Step 5: Run the tests**

Run: `npm run test -- Header`
Expected: PASS.

- [ ] **Step 6: Verify both themes manually (note for the reviewer)**

The active-link accent uses `brand-700` (light) / `brand-300` (dark) — the same tokens as hover, so it is legible and CVD-safe in both themes and is not distinguished from inactive links by hue alone (it is also bolder-contrasting in lightness). No code change; record that both themes were eyeballed.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/Header.tsx frontend/src/components/Footer.tsx frontend/src/components/Header.test.tsx
git commit -m "feat(a11y): mark active nav link and name nav landmarks"
```

---

### Task 5: Reduced-motion + page-integration a11y tests

**Files:**
- Test: `frontend/src/features/chat/useChat.reducedMotion.test.tsx`
- Test: `frontend/src/pages/ProjectsPage.test.tsx`

**Interfaces:**
- Consumes: `useChat` (`src/features/chat/useChat.ts`), `ChatResponder`/`ChatEntry` types, `ProjectsPage`, `getProjects` (mocked).

- [ ] **Step 1: Write the reduced-motion test (chat reveals fully, no animation)**

Create `frontend/src/features/chat/useChat.reducedMotion.test.tsx`:
```tsx
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ChatEntry } from '../../lib/api'
import { useChat } from './useChat'
import type { ChatResponder } from './types'

const ENTRY: ChatEntry = {
  publicIdentifier: 'what-do-you-do',
  question: 'What do you actually do?',
  category: 'role',
  attachment: null,
  answerHtml: '<p>Alpha beta gamma.</p>',
}

// A responder that yields the authored answer once, like the scripted responder. The generator
// ignores its `input`/`signal` params, which structural typing permits.
const responder: ChatResponder = {
  async *respond() {
    yield { kind: 'answer', entry: ENTRY }
  },
}

describe('useChat under reduced motion', () => {
  it('reveals the whole answer immediately with no word-by-word streaming', async () => {
    const { result } = renderHook(() => useChat(responder, true))

    act(() => {
      result.current.askPrompt(ENTRY)
    })

    await waitFor(() => expect(result.current.turns).toHaveLength(2))

    const assistant = result.current.turns[1]
    expect(assistant.role).toBe('assistant')
    if (assistant.role === 'assistant') {
      // shownWords jumps to the full count at once; the reveal player never walks it up.
      expect(result.current.shownWords).toBe(assistant.wordCount)
      expect(assistant.plainText).toContain('Alpha beta gamma.')
    }
    // With nothing left to animate, the active (streaming) turn is cleared.
    await waitFor(() => expect(result.current.activeTurnId).toBeNull())
  })
})
```

- [ ] **Step 2: Run it**

Run: `npm run test -- useChat.reducedMotion`
Expected: PASS.

- [ ] **Step 3: Write the ProjectsPage integration + axe test (mocked API)**

Create `frontend/src/pages/ProjectsPage.test.tsx`:
```tsx
import { screen, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'

import { ProjectsPage } from './ProjectsPage'
import { renderInApp } from '../test/render'
import type { Project } from '../lib/api'
import { getProjects } from '../lib/api'

// Mock the whole api module but keep every real export except getProjects. Spying on a bare
// ESM named export is unreliable (the namespace is read-only); vi.mock is the robust path.
vi.mock('../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/api')>()),
  getProjects: vi.fn(),
}))

const mockedGetProjects = vi.mocked(getProjects)

const PROJECT: Project = {
  publicIdentifier: 'gpt2-from-scratch',
  title: 'GPT-2 from scratch',
  summary: 'Rebuilt GPT-2 124M in PyTorch to see what every layer was doing.',
  stack: ['PyTorch'],
  tags: ['llm'],
  repositoryUrl: 'https://github.com/cris96spa',
  demoUrl: null,
  coverImage: null,
  publishedAt: '2026-01-01',
  updatedAt: null,
}

describe('ProjectsPage', () => {
  it('renders a card per project from the API', async () => {
    mockedGetProjects.mockResolvedValue([PROJECT])
    renderInApp(<ProjectsPage />)
    await waitFor(() => expect(screen.getByText('GPT-2 from scratch')).toBeInTheDocument())
  })

  it('has no automatically-detectable accessibility violations', async () => {
    mockedGetProjects.mockResolvedValue([PROJECT])
    const { container } = renderInApp(<ProjectsPage />)
    await waitFor(() => expect(screen.getByText('GPT-2 from scratch')).toBeInTheDocument())
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 4: Run it**

Run: `npm run test -- ProjectsPage`
Expected: PASS. If axe reports a violation, fix it in `ProjectCard`/`ProjectsPage` (most likely an image missing `alt` or a heading-order issue) and re-run until clean.

- [ ] **Step 5: Run the full suite**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/chat/useChat.reducedMotion.test.tsx frontend/src/pages/ProjectsPage.test.tsx
git commit -m "test(a11y): cover reduced-motion chat reveal and projects page axe"
```

---

## Phase 3 — SEO / shareability

### Task 6: Per-page titles and descriptions (React 19 metadata)

**Files:**
- Create: `frontend/src/lib/pageMeta.ts`
- Create: `frontend/src/components/PageMeta.tsx`
- Modify: `frontend/src/pages/HomePage.tsx`, `ProjectsPage.tsx`, `WritingPage.tsx`, `ResumePage.tsx`, `ProjectDetailPage.tsx`, `NotFound.tsx`
- Test: `frontend/src/components/PageMeta.test.tsx`

**Interfaces:**
- Produces: `PAGE_META` (const map) with `home | projects | writing | resume | notFound`, each `{ title, description }`.
- Produces: `<PageMeta title description />` — renders `<title>`/`<meta name="description">`; React 19 hoists them to `<head>`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/PageMeta.test.tsx`:
```tsx
import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PageMeta } from './PageMeta'

describe('PageMeta', () => {
  it('sets the document title and meta description', async () => {
    render(<PageMeta title="Projects — latent-space" description="The things I build." />)
    await waitFor(() => expect(document.title).toBe('Projects — latent-space'))
    const meta = document.head.querySelector('meta[name="description"]')
    expect(meta).toHaveAttribute('content', 'The things I build.')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test -- PageMeta`
Expected: FAIL — cannot resolve `./PageMeta`.

- [ ] **Step 3: Write the component**

Create `frontend/src/components/PageMeta.tsx`:
```tsx
interface PageMetaProps {
  title: string
  description: string
}

/**
 * Sets the per-route document title and meta description. React 19 hoists a `<title>`/`<meta>`
 * rendered anywhere in the tree into `<head>`; non-JS card crawlers fall back to the static
 * defaults in `index.html`.
 */
export function PageMeta({ title, description }: PageMetaProps) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
    </>
  )
}
```

- [ ] **Step 4: Write the page-meta content**

Create `frontend/src/lib/pageMeta.ts`:
```ts
/** Per-route document titles and descriptions. Authored copy, kept out of components. */
export const PAGE_META = {
  home: {
    title: 'latent-space — Cristian C. Spagnuolo',
    description:
      'Cristian C. Spagnuolo, NLP engineer: I make language models run faster, fit in less GPU memory, and stop confidently inventing things. Part portfolio, part lab notebook.',
  },
  projects: {
    title: 'Projects — latent-space',
    description:
      'Things I build to actually understand them — usually by rebuilding them from scratch. Weights not included; the code is.',
  },
  writing: {
    title: 'Writing — latent-space',
    description:
      'Notes from the lab notebook: training runs, papers I could not stop thinking about, and the occasional LLM tangent. Published on Substack.',
  },
  resume: {
    title: 'Resume — Cristian C. Spagnuolo',
    description:
      'The formal version: roles, dates, and grades for Cristian C. Spagnuolo, NLP engineer in Lugano. Downloadable PDF and direct contact links.',
  },
  notFound: {
    title: '404 — latent-space',
    description: 'This route is not in the vocabulary. Everything real is one hop back.',
  },
} as const
```

- [ ] **Step 5: Run the PageMeta test**

Run: `npm run test -- PageMeta`
Expected: PASS.

- [ ] **Step 6: Render `<PageMeta>` on each page**

Add the import and render `<PageMeta>` as the first child of each page's returned root:

`HomePage.tsx`:
```tsx
import { PageMeta } from '../components/PageMeta'
import { PAGE_META } from '../lib/pageMeta'
```
```tsx
    <div className="space-y-16">
      <PageMeta {...PAGE_META.home} />
      <ForwardPassHero />
```

`ProjectsPage.tsx` (first child of the `<section>`):
```tsx
import { PageMeta } from '../components/PageMeta'
import { PAGE_META } from '../lib/pageMeta'
```
```tsx
    <section className="space-y-8">
      <PageMeta {...PAGE_META.projects} />
      <header className="max-w-2xl space-y-3">
```

`WritingPage.tsx`:
```tsx
import { PageMeta } from '../components/PageMeta'
import { PAGE_META } from '../lib/pageMeta'
```
```tsx
    <section className="space-y-8">
      <PageMeta {...PAGE_META.writing} />
      <header className="max-w-2xl space-y-3">
```

`ResumePage.tsx`:
```tsx
import { PageMeta } from '../components/PageMeta'
import { PAGE_META } from '../lib/pageMeta'
```
```tsx
    <div className="space-y-10">
      <PageMeta {...PAGE_META.resume} />
      <header className="max-w-2xl space-y-3">
```

`NotFound.tsx`:
```tsx
import { PageMeta } from '../components/PageMeta'
import { PAGE_META } from '../lib/pageMeta'
```
```tsx
    <section className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <PageMeta {...PAGE_META.notFound} />
      <img src="/favicon.png" alt="latent-space" className="size-14" />
```

`ProjectDetailPage.tsx` — inside `ProjectBody`, derive from the fetched project (import `PageMeta` at top):
```tsx
import { PageMeta } from '../components/PageMeta'
```
Then as the first child of `ProjectBody`'s `<div className="space-y-6">`:
```tsx
    <div className="space-y-6">
      <PageMeta title={`${project.title} — latent-space`} description={project.summary} />
      <header className="space-y-4">
```

- [ ] **Step 7: Run tests, lint, build**

Run: `npm run test && npm run lint && npm run build`
Expected: all green. (The existing `NotFound` and `ProjectsPage` tests still pass — `<PageMeta>` hoists to `document.head`, outside the axe container.)

- [ ] **Step 8: Commit**

```bash
git add frontend/src/lib/pageMeta.ts frontend/src/components/PageMeta.tsx \
  frontend/src/components/PageMeta.test.tsx frontend/src/pages/*.tsx
git commit -m "feat(seo): add per-page titles and descriptions via React 19 metadata"
```

---

### Task 7: Static Open Graph / Twitter cards, robots.txt, sitemap.xml

**Files:**
- Modify: `frontend/index.html` (head meta)
- Create: `frontend/public/robots.txt`
- Create: `frontend/public/sitemap.xml`
- Test: `frontend/src/test/shareMeta.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/test/shareMeta.test.ts`:
```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

describe('shareability metadata', () => {
  it('index.html declares Open Graph and Twitter card tags', () => {
    const html = read('../../index.html')
    expect(html).toContain('property="og:title"')
    expect(html).toContain('property="og:description"')
    expect(html).toContain('property="og:image"')
    expect(html).toContain('name="twitter:card"')
    expect(html).toContain('content="summary_large_image"')
  })

  it('ships robots.txt referencing the sitemap', () => {
    const robots = read('../../public/robots.txt')
    expect(robots).toContain('User-agent: *')
    expect(robots).toContain('Sitemap:')
  })

  it('ships a sitemap listing the top-level routes', () => {
    const sitemap = read('../../public/sitemap.xml')
    expect(sitemap).toContain('<loc>/</loc>')
    expect(sitemap).toContain('/projects')
    expect(sitemap).toContain('/writing')
    expect(sitemap).toContain('/resume')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test -- shareMeta`
Expected: FAIL — tags/files missing.

- [ ] **Step 3: Add the static cards to `index.html`**

In `frontend/index.html`, inside `<head>` immediately after the existing `<meta name="description" ... />` block, add:
```html
    <!-- Static share-card defaults for non-JS crawlers (Slack, LinkedIn, X, iMessage), which
         never run the SPA. React sets richer per-page <title>/<meta> at runtime for Google. -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="latent-space" />
    <meta property="og:title" content="latent-space — Cristian C. Spagnuolo" />
    <meta
      property="og:description"
      content="NLP engineer. I make language models run faster, fit in less GPU memory, and stop confidently inventing things. Part portfolio, part lab notebook."
    />
    <meta property="og:image" content="/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="latent-space — Cristian C. Spagnuolo" />
    <meta
      name="twitter:description"
      content="NLP engineer. Part portfolio, part lab notebook, part applied-ML performance art."
    />
    <meta name="twitter:image" content="/og-image.png" />
    <!-- TODO(deploy): once the canonical host/domain is decided, add <meta property="og:url">
         and switch og:image/twitter:image to absolute URLs — some scrapers ignore relative images. -->
```

- [ ] **Step 4: Add `robots.txt`**

Create `frontend/public/robots.txt`:
```
User-agent: *
Allow: /

# TODO(deploy): make Sitemap an absolute URL once the canonical host is decided.
Sitemap: /sitemap.xml
```

- [ ] **Step 5: Add `sitemap.xml`**

Create `frontend/public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- TODO(deploy): <loc> values must be absolute URLs for crawlers to honour them; they ship
     relative until the canonical host is decided. Per-project/-post detail URLs are omitted
     deliberately — they are reachable via in-page links and would couple this static file to
     backend content. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>/</loc></url>
  <url><loc>/projects</loc></url>
  <url><loc>/writing</loc></url>
  <url><loc>/resume</loc></url>
</urlset>
```

- [ ] **Step 6: Run the test and build**

Run: `npm run test -- shareMeta && npm run build`
Expected: PASS; `dist/robots.txt` and `dist/sitemap.xml` exist after build (Vite copies `public/`).

- [ ] **Step 7: Commit**

```bash
git add frontend/index.html frontend/public/robots.txt frontend/public/sitemap.xml \
  frontend/src/test/shareMeta.test.ts
git commit -m "feat(seo): add static OG/Twitter cards, robots.txt, and sitemap.xml"
```

---

### Task 8: Branded Open Graph image

**Files:**
- Modify: `frontend/package.json` (add `@playwright/test`; `og:image` script)
- Create: `frontend/scripts/generate-og-image.mjs`
- Create (generated, committed): `frontend/public/og-image.png`
- Modify: `frontend/src/test/shareMeta.test.ts` (assert the PNG exists at 1200×630)

**Interfaces:**
- Consumes: `@playwright/test`'s bundled Chromium (also used by Phase 5's e2e).
- Produces: `frontend/public/og-image.png` (1200×630) referenced by Task 7's tags.

- [ ] **Step 1: Install Playwright and its browser**

Run (from `frontend/`):
```bash
npm install -D @playwright/test@^1
npx playwright install chromium
```
Expected: `@playwright/test` added; Chromium downloaded.

- [ ] **Step 2: Write the generator script**

Create `frontend/scripts/generate-og-image.mjs`:
```js
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'

// A 1200×630 branded card: dark panel, the monospace `>_ latent-space` mark, name, and the
// site's one-line identity. Colours are literals (this is a build asset drawn to a Playwright
// canvas, not app CSS) but track the sky-blue brand.
const html = `<!doctype html><html><body style="margin:0">
  <div style="width:1200px;height:630px;box-sizing:border-box;padding:88px;display:flex;
    flex-direction:column;justify-content:center;gap:28px;background:#0b1220;color:#e8eef7;
    font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif">
    <div style="font-family:ui-monospace,'JetBrains Mono',monospace;font-size:30px;color:#38bdf8">&gt;_ latent-space</div>
    <div style="font-size:82px;font-weight:700;letter-spacing:-1.5px;line-height:1.02">Cristian C. Spagnuolo</div>
    <div style="font-size:36px;line-height:1.3;color:#93c5fd">NLP engineer · part portfolio, part lab<br/>notebook, part applied-ML performance art.</div>
  </div>
</body></html>`

const outputPath = fileURLToPath(new URL('../public/og-image.png', import.meta.url))
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await page.setContent(html, { waitUntil: 'load' })
  await page.screenshot({ path: outputPath })
  console.log(`Wrote ${outputPath}`)
} finally {
  await browser.close()
}
```

- [ ] **Step 3: Add the npm script and generate the image**

In `frontend/package.json` `scripts`, add:
```json
    "og:image": "node scripts/generate-og-image.mjs",
```
Then run:
```bash
npm run og:image
```
Expected: `Wrote .../public/og-image.png`; the file exists.

- [ ] **Step 4: Extend the share-meta test with the PNG assertion**

Append to `frontend/src/test/shareMeta.test.ts` (add `readFileSync` is already imported):
```ts
describe('og-image', () => {
  it('is a 1200×630 PNG', () => {
    const png = readFileSync(fileURLToPath(new URL('../../public/og-image.png', import.meta.url)))
    // PNG signature.
    expect(Array.from(png.subarray(0, 8))).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    // IHDR width/height are big-endian uint32 at byte offsets 16 and 20.
    expect(png.readUInt32BE(16)).toBe(1200)
    expect(png.readUInt32BE(20)).toBe(630)
  })
})
```

- [ ] **Step 5: Run the test**

Run: `npm run test -- shareMeta`
Expected: PASS (share metadata + og-image).

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/scripts/generate-og-image.mjs \
  frontend/public/og-image.png frontend/src/test/shareMeta.test.ts
git commit -m "feat(seo): generate and ship the branded Open Graph card image"
```

---

## Phase 4 — Performance

### Task 9: Route-level code-splitting

**Files:**
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: the `<Suspense>` boundary added to `RootLayout` in Task 3.

- [ ] **Step 1: Convert page imports to lazy chunks**

Replace `frontend/src/App.tsx` with:
```tsx
import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'

import { RootLayout } from './layouts/RootLayout'

// Each page is its own chunk, loaded on navigation, so the entry bundle stays lean as content
// grows. Pages are named exports, hence the `.then` default mapping. Plotly stays lazy inside
// the feature components it belongs to.
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })))
const ProjectsPage = lazy(() =>
  import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })),
)
const ProjectDetailPage = lazy(() =>
  import('./pages/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })),
)
const ResumePage = lazy(() => import('./pages/ResumePage').then((m) => ({ default: m.ResumePage })))
const WritingPage = lazy(() =>
  import('./pages/WritingPage').then((m) => ({ default: m.WritingPage })),
)
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:publicIdentifier" element={<ProjectDetailPage />} />
        <Route path="resume" element={<ResumePage />} />
        <Route path="writing" element={<WritingPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
```

- [ ] **Step 2: Build and verify separate page chunks are emitted**

Run: `npm run build`
Then: `ls dist/assets | grep -E 'HomePage|ProjectsPage|WritingPage|ResumePage|NotFound'`
Expected: one hashed `.js` per page (e.g. `HomePage-<hash>.js`), confirming the split.

- [ ] **Step 3: Run tests and lint**

Run: `npm run test && npm run lint`
Expected: green (existing tests render pages directly and are unaffected by route lazy-loading).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "perf(frontend): code-split routes into per-page chunks"
```

---

### Task 10: Vercel Web Analytics

**Files:**
- Modify: `frontend/package.json` (add `@vercel/analytics`)
- Modify: `frontend/src/layouts/RootLayout.tsx`

- [ ] **Step 1: Install the dependency**

Run: `npm install @vercel/analytics`
Expected: added to `dependencies`. (Cookieless, first-party; loads deferred and is inert off Vercel.)

- [ ] **Step 2: Mount `<Analytics />` in the layout**

In `frontend/src/layouts/RootLayout.tsx`, add the import:
```tsx
import { Analytics } from '@vercel/analytics/react'
```
and render it once, just before the closing `</div>` of the layout root (after `<Footer />`):
```tsx
      <Footer />
      <Analytics />
    </div>
```

- [ ] **Step 3: Build and verify**

Run: `npm run build && npm run lint`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/layouts/RootLayout.tsx
git commit -m "feat(perf): add cookieless Vercel Web Analytics"
```

---

### Task 11: Bundle-size budget

**Files:**
- Create: `frontend/scripts/check-bundle-size.mjs`
- Modify: `frontend/package.json` (`test:bundle` script)

**Interfaces:**
- Produces: `npm run test:bundle` — fails (exit 1) when the gzipped entry chunk exceeds the budget. Used by CI in Task 15.

- [ ] **Step 1: Write the budget script**

Create `frontend/scripts/check-bundle-size.mjs`:
```js
import { readdirSync, readFileSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

// Gzipped budget for the entry chunk. The entry holds React, the router, and the app shell
// (pages and Plotly are split out). Headroom above the measured baseline is deliberate; the
// primary job is catching a catastrophic regression such as Plotly leaking into the entry.
// Tighten toward the measured value + ~40 KB once the split baseline is known.
const ENTRY_BUDGET_BYTES = 170 * 1024

const assetsDir = fileURLToPath(new URL('../dist/assets', import.meta.url))
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`

const entry = readdirSync(assetsDir).find((name) => /^index-.*\.js$/.test(name))
if (!entry) {
  console.error('No entry chunk (index-*.js) found in dist/assets — run `npm run build` first.')
  process.exit(1)
}

const gzippedBytes = gzipSync(readFileSync(`${assetsDir}/${entry}`)).length
if (gzippedBytes > ENTRY_BUDGET_BYTES) {
  console.error(
    `Entry bundle ${entry} is ${kb(gzippedBytes)} gzipped, over the ${kb(ENTRY_BUDGET_BYTES)} budget.`,
  )
  process.exit(1)
}
console.log(`Entry bundle ${entry}: ${kb(gzippedBytes)} gzipped (budget ${kb(ENTRY_BUDGET_BYTES)}). OK.`)
```

- [ ] **Step 2: Add the npm script**

In `frontend/package.json` `scripts`, add:
```json
    "test:bundle": "node scripts/check-bundle-size.mjs",
```

- [ ] **Step 3: Build, then run the budget check and read the measured size**

Run: `npm run build && npm run test:bundle`
Expected: `Entry bundle index-<hash>.js: <N> KB gzipped (budget 170.0 KB). OK.` Record `<N>`. If `<N>` is far below 170 (it should be well under), leave the budget as-is (headroom is intentional); if the build ever fails this, that is the regression the check exists to catch.

- [ ] **Step 4: Commit**

```bash
git add frontend/scripts/check-bundle-size.mjs frontend/package.json
git commit -m "perf(ci): add gzipped entry-bundle budget check"
```

---

## Phase 5 — Playwright end-to-end smoke tests

### Task 12: Playwright setup + home smoke (bio present, works without JS)

**Files:**
- Create: `frontend/playwright.config.ts`
- Create: `frontend/e2e/fixtures/content.ts`
- Create: `frontend/e2e/home.spec.ts`
- Modify: `frontend/package.json` (`test:e2e` script)
- Modify: `frontend/.gitignore` or repo `.gitignore` (ignore `test-results/`, `playwright-report/`)

**Interfaces:**
- Produces: `stubApi(page)` in `e2e/fixtures/content.ts` — intercepts `**/api/**` with JSON fixtures so e2e needs no backend.
- Produces: `npm run test:e2e` (Playwright), used by CI in Task 15.

- [ ] **Step 1: Add the Playwright config**

Create `frontend/playwright.config.ts`:
```ts
import process from 'node:process'

import { defineConfig, devices } from '@playwright/test'

// e2e runs against the built preview (dist), with the API stubbed per-test — no backend needed.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

- [ ] **Step 2: Add the fixtures + stub helper**

Create `frontend/e2e/fixtures/content.ts`:
```ts
import type { Page } from '@playwright/test'

// Wire-shape (snake_case) fixtures matching the FastAPI content responses.
export const PROJECTS_FIXTURE = [
  {
    public_identifier: 'gpt2-from-scratch',
    title: 'GPT-2 from scratch',
    summary: 'Rebuilt GPT-2 124M in PyTorch to see what every layer was doing.',
    stack: ['PyTorch'],
    tags: ['llm'],
    repository_url: 'https://github.com/cris96spa',
    demo_url: null,
    cover_image: null,
    published_at: '2026-01-01',
    updated_at: null,
  },
]

// A single plain-answer entry (no attachment) so the chat renders without the Plotly sweep.
export const CHAT_FIXTURE = [
  {
    public_identifier: 'what-do-you-do',
    question: 'What do you actually do?',
    category: 'role',
    attachment: null,
    answer_html: '<p>I make language models faster and cheaper.</p>',
  },
]

/** Intercepts every backend call with deterministic fixtures, so no FastAPI server is needed. */
export async function stubApi(page: Page): Promise<void> {
  await page.route('**/api/projects', (route) => route.fulfill({ json: PROJECTS_FIXTURE }))
  await page.route('**/api/chat/entries', (route) => route.fulfill({ json: CHAT_FIXTURE }))
  await page.route('**/api/posts', (route) => route.fulfill({ json: [] }))
}
```

- [ ] **Step 3: Write the home smoke tests**

Create `frontend/e2e/home.spec.ts`:
```ts
import { expect, test } from '@playwright/test'

import { stubApi } from './fixtures/content'

// The stable opening of CANONICAL_BIO (content.ts) and the index.html <noscript> fallback.
const BIO_PHRASE = "Hi, I'm Cristian, and this is my latent space."

test('home renders the canonical bio in the main region', async ({ page }) => {
  await stubApi(page)
  await page.goto('/')
  await expect(page.getByRole('main')).toContainText(BIO_PHRASE)
})

test('the bio is present without JavaScript (crawlable)', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Who is Cristian?' })).toBeVisible()
  await expect(page.getByText(BIO_PHRASE)).toBeVisible()
  await context.close()
})
```

> The reduced-motion guarantee is covered by the Task 5 `useChat` unit test, which genuinely
> distinguishes the behaviour. An e2e reduced-motion check is intentionally omitted: the
> always-present sr-only bio makes any `main`-text assertion pass regardless of motion.

- [ ] **Step 4: Add the npm script and ignore Playwright output**

In `frontend/package.json` `scripts`, add:
```json
    "test:e2e": "playwright test",
```
Add to the repo root `.gitignore` (or `frontend/.gitignore`):
```
frontend/test-results/
frontend/playwright-report/
frontend/blob-report/
```

- [ ] **Step 5: Run the e2e smoke suite**

Run: `npm run test:e2e -- home`
Expected: PASS (3 tests). The config builds `dist` and serves it on :4173 automatically.

- [ ] **Step 6: Commit**

```bash
git add frontend/playwright.config.ts frontend/e2e/fixtures/content.ts frontend/e2e/home.spec.ts \
  frontend/package.json frontend/package-lock.json .gitignore
git commit -m "test(e2e): add Playwright and home/bio/no-JS smoke tests"
```

---

### Task 13: Content e2e (projects list, chat answer, CV download)

**Files:**
- Create: `frontend/e2e/content.spec.ts`

- [ ] **Step 1: Write the content smoke tests**

Create `frontend/e2e/content.spec.ts`:
```ts
import { expect, test } from '@playwright/test'

import { stubApi } from './fixtures/content'

test('projects list renders cards from the API', async ({ page }) => {
  await stubApi(page)
  await page.goto('/projects')
  await expect(page.getByText('GPT-2 from scratch')).toBeVisible()
})

test('a suggested prompt reveals its authored answer', async ({ page }) => {
  await stubApi(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'What do you actually do?' }).click()
  await expect(page.getByText('I make language models faster and cheaper.')).toBeVisible()
})

test('the résumé PDF downloads with its stable filename', async ({ page }) => {
  await stubApi(page)
  await page.goto('/resume')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: /download pdf/i }).click(),
  ])
  expect(download.suggestedFilename()).toBe('Cristian_C_Spagnuolo_CV.pdf')
})
```

- [ ] **Step 2: Run the tests**

Run: `npm run test:e2e -- content`
Expected: PASS (3 tests).

- [ ] **Step 3: Commit**

```bash
git add frontend/e2e/content.spec.ts
git commit -m "test(e2e): cover projects list, chat answer, and CV download"
```

---

### Task 14: axe scan + keyboard skip-link e2e

**Files:**
- Modify: `frontend/package.json` (add `@axe-core/playwright`)
- Create: `frontend/e2e/a11y.spec.ts`

- [ ] **Step 1: Install the axe integration**

Run: `npm install -D @axe-core/playwright`
Expected: added to devDependencies.

- [ ] **Step 2: Write the a11y e2e tests**

Create `frontend/e2e/a11y.spec.ts`:
```ts
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { stubApi } from './fixtures/content'

test('home has no automatically-detectable accessibility violations', async ({ page }) => {
  await stubApi(page)
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('projects page has no automatically-detectable accessibility violations', async ({ page }) => {
  await stubApi(page)
  await page.goto('/projects')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('the skip link is the first tab stop and moves focus to main', async ({ page }) => {
  await stubApi(page)
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: /skip to content/i })
  await expect(skip).toBeFocused()
  await skip.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
})
```

- [ ] **Step 3: Run the a11y e2e and triage any violations**

Run: `npm run test:e2e -- a11y`
Expected: PASS. If `violations` is non-empty, read each entry's `id`/`nodes` and fix at the source (the Plotly figures are already `aria-hidden` with sr-only twins, so likely findings are landmark/heading/contrast issues in ordinary components — fix them the same way as the jsdom axe findings). Re-run until both page scans report `[]`.

- [ ] **Step 4: Run the whole e2e suite**

Run: `npm run test:e2e`
Expected: all specs PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/e2e/a11y.spec.ts
git commit -m "test(e2e): add axe scans and keyboard skip-link check"
```

---

## Phase 6 — CI

### Task 15: Makefile targets + frontend CI job (hard gates)

**Files:**
- Modify: `Makefile` (add `fe-e2e`, `fe-bundle`, `fe-check`)
- Create: `.github/workflows/frontend-validate.yaml`

**Interfaces:**
- Consumes: `npm run lint|test|build|test:bundle|test:e2e` from earlier tasks.

- [ ] **Step 1: Add Makefile targets**

Append to `Makefile`:
```make
fe-e2e: # run the Playwright end-to-end smoke tests
	cd $(FRONTEND_DIR) && $(NPM) run test:e2e

fe-bundle: # check the gzipped entry-bundle budget (run after fe-build)
	cd $(FRONTEND_DIR) && $(NPM) run test:bundle

fe-check: fe-lint fe-test fe-build fe-bundle # run all fast frontend checks
```

- [ ] **Step 2: Verify the aggregate target locally**

Run: `make fe-check`
Expected: lint, unit tests, build, and bundle budget all pass in sequence.

- [ ] **Step 3: Add the frontend CI workflow**

Create `.github/workflows/frontend-validate.yaml`:
```yaml
name: Frontend Validate

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

defaults:
  run:
    shell: bash
    working-directory: frontend

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - name: 🛎️ Checkout
        uses: actions/checkout@v4

      - name: ⬢ Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: 📦 Install
        run: npm ci

      - name: 🔎 Lint
        run: npm run lint

      - name: 🧪 Unit tests
        run: npm run test

      - name: 🏗️ Build
        run: npm run build

      - name: 📏 Bundle budget
        run: npm run test:bundle

      - name: 🌐 Install Playwright browser
        run: npx playwright install --with-deps chromium

      - name: 🎭 End-to-end smoke tests
        run: npm run test:e2e
```

- [ ] **Step 4: Lint the workflow YAML locally (syntax sanity)**

Run (from repo root): `python -c "import yaml,sys; yaml.safe_load(open('.github/workflows/frontend-validate.yaml')); print('ok')"`
Expected: `ok`.

- [ ] **Step 5: Commit**

```bash
git add Makefile .github/workflows/frontend-validate.yaml
git commit -m "ci(frontend): add lint/test/build/bundle/e2e gates and make targets"
```

---

### Task 16: Lighthouse advisory job + recorded targets

**Files:**
- Modify: `frontend/package.json` (add `@lhci/cli`)
- Create: `frontend/lighthouserc.json`
- Modify: `.github/workflows/frontend-validate.yaml` (add an advisory `lighthouse` job)
- Create: `docs/superpowers/specs/2026-07-22-performance-targets.md` (record the agreed numbers)

- [ ] **Step 1: Install Lighthouse CI**

Run (from `frontend/`): `npm install -D @lhci/cli`
Expected: added to devDependencies.

- [ ] **Step 2: Configure Lighthouse CI (advisory — assertions are warnings)**

Create `frontend/lighthouserc.json`:
```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run preview -- --port 4173 --strictPort",
      "startServerReadyPattern": "Local",
      "url": ["http://localhost:4173/", "http://localhost:4173/projects", "http://localhost:4173/resume"],
      "numberOfRuns": 1,
      "settings": { "preset": "desktop" }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.9 }],
        "categories:accessibility": ["warn", { "minScore": 1 }],
        "categories:best-practices": ["warn", { "minScore": 0.95 }],
        "categories:seo": ["warn", { "minScore": 1 }],
        "largest-contentful-paint": ["warn", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["warn", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 200 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

- [ ] **Step 3: Add the advisory Lighthouse job (never blocks)**

Append to `.github/workflows/frontend-validate.yaml`:
```yaml
  lighthouse:
    runs-on: ubuntu-latest
    needs: frontend
    continue-on-error: true
    steps:
      - name: 🛎️ Checkout
        uses: actions/checkout@v4

      - name: ⬢ Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: 📦 Install
        run: npm ci

      - name: 🏗️ Build
        run: npm run build

      - name: 💡 Lighthouse (advisory)
        run: npx lhci autorun
```

- [ ] **Step 4: Run Lighthouse locally to smoke the config**

Run (from `frontend/`): `npm run build && npx lhci autorun`
Expected: LHCI collects, prints scores, and uploads a temporary report URL. Warnings are acceptable (advisory); the command should not fail the shell. Note the scores.

- [ ] **Step 5: Record the agreed targets**

Create `docs/superpowers/specs/2026-07-22-performance-targets.md`:
```markdown
# Performance & Lighthouse targets

**Date:** 2026-07-22
**Enforcement:** advisory in CI (the `lighthouse` job is `continue-on-error`); the hard CI
gates are lint, unit tests, build, the gzipped entry-bundle budget, and the Playwright e2e
suite.

## Targets (desktop preset, measured against `vite preview`)

| Metric | Target |
| --- | --- |
| Lighthouse Performance | ≥ 0.90 |
| Lighthouse Accessibility | 1.00 |
| Lighthouse Best Practices | ≥ 0.95 |
| Lighthouse SEO | 1.00 |
| Largest Contentful Paint | < 2.5 s |
| Cumulative Layout Shift | < 0.1 |
| Total Blocking Time | < 200 ms |

## Bundle budget

- Gzipped entry chunk (`dist/assets/index-*.js`): ≤ 170 KB (enforced by
  `frontend/scripts/check-bundle-size.mjs`). Plotly (~4.3 MB raw) is excluded from the entry —
  it must stay in its own lazy chunk.

## Notes

- Plotly is the dominant asset; it is code-split and only loads when the radar or ablation
  sweep renders. Replacing it with a lighter charting library is a future option, out of scope
  for this pass.
- Fonts are self-hosted, subset woff2 (`@fontsource-variable/*`) with `font-display: swap`. A
  `<link rel="preload">` for the primary subset was intentionally not added: fontsource
  fingerprints the file, so a hardcoded preload href would 404 after every content hash, and a
  manifest-driven preload is disproportionate to the LCP gain here (first paint is text that
  swaps in). Revisit if LCP measures above target.
```

- [ ] **Step 6: Validate the workflow YAML again**

Run (from repo root): `python -c "import yaml; yaml.safe_load(open('.github/workflows/frontend-validate.yaml')); print('ok')"`
Expected: `ok`.

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/lighthouserc.json \
  .github/workflows/frontend-validate.yaml docs/superpowers/specs/2026-07-22-performance-targets.md
git commit -m "ci(frontend): add advisory Lighthouse job and record performance targets"
```

---

## Final verification

After all tasks, run from `frontend/`:
```bash
npm run lint && npm run test && npm run build && npm run test:bundle && npm run test:e2e
```
Expected: every command exits 0. This mirrors the hard CI gates in `frontend-validate.yaml`.

Then confirm against the spec's acceptance criteria:
- Automated a11y (vitest-axe + Playwright axe) green on home and projects; skip link + route focus verified; reduced-motion chat reveal tested; bio present without JS (e2e).
- Routes code-split; entry within the gzipped budget; Lighthouse/CWV targets recorded.
- Per-page titles/descriptions live; static OG/Twitter cards + 1200×630 OG image; robots.txt + sitemap.xml served.
- Critical-path e2e (home+bio, projects, chat, CV download) run in CI alongside lint/test/build/bundle.
```
