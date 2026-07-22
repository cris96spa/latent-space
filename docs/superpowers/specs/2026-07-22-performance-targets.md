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
