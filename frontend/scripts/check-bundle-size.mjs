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

let assetNames
try {
  assetNames = readdirSync(assetsDir)
} catch {
  console.error('dist/assets not found — run `npm run build` first.')
  process.exit(1)
}

// The Vite entry is `index-<hash>.js`. Require exactly one match: if a barrel `index.ts` ever
// chunked to the same name, silently taking the first could validate a small chunk while a
// bloated entry slips through — the exact regression this check exists to catch.
const entries = assetNames.filter((name) => /^index-.*\.js$/.test(name))
if (entries.length !== 1) {
  console.error(
    `Expected exactly one entry chunk (index-*.js) in dist/assets, found ${entries.length}` +
      (entries.length ? `: ${entries.join(', ')}.` : ' — run `npm run build` first.'),
  )
  process.exit(1)
}
const entry = entries[0]

const gzippedBytes = gzipSync(readFileSync(`${assetsDir}/${entry}`)).length
if (gzippedBytes > ENTRY_BUDGET_BYTES) {
  console.error(
    `Entry bundle ${entry} is ${kb(gzippedBytes)} gzipped, over the ${kb(ENTRY_BUDGET_BYTES)} budget.`,
  )
  process.exit(1)
}
console.log(`Entry bundle ${entry}: ${kb(gzippedBytes)} gzipped (budget ${kb(ENTRY_BUDGET_BYTES)}). OK.`)
