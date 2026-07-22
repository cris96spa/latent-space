import { expect, test } from '@playwright/test'

import { stubApi } from './fixtures/content'

// PageMeta renders a per-route <meta name="description"> and React 19 *appends* metadata rather
// than replacing it. index.html must not also ship a static description, or the live <head>
// would carry two and a first-match crawler would read the generic one. Assert exactly one, and
// that it is the per-route copy (not the generic index.html default).
test('home exposes exactly one description meta, the per-route one', async ({ page }) => {
  await stubApi(page)
  await page.goto('/')
  const description = page.locator('head meta[name="description"]')
  await expect(description).toHaveCount(1)
  await expect(description).toHaveAttribute('content', /I make language models run faster/)
})
