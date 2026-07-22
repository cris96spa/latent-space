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
