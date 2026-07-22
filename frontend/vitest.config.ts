import { defineConfig } from 'vitest/config'

export default defineConfig({
  // This Vite pipeline defaults .tsx transforms to esbuild's classic JSX pragma (`React` in
  // scope) rather than reading tsconfig's `"jsx": "react-jsx"`, unlike the app's own
  // vite.config.ts (which gets automatic-runtime JSX via @vitejs/plugin-react). Set it
  // explicitly so component tests compile without importing React everywhere.
  esbuild: {
    jsx: 'automatic',
  },
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
