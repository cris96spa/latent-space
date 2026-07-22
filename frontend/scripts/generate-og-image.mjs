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
