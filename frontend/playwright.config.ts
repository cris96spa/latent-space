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
    // CI builds in a prior step of the same job, so reuse that `dist` and skip a redundant
    // rebuild; locally, build first so the preview always serves fresh output.
    command: process.env.CI
      ? 'npm run preview -- --port 4173 --strictPort'
      : 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
