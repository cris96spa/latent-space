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
  // getByText() relies on JS evaluation in the page, which Chromium suppresses entirely
  // under javaScriptEnabled: false, so it can't locate the (present, visible) bio text
  // here. locator().toContainText() reads element text directly and works reliably.
  await expect(page.locator('main')).toContainText(BIO_PHRASE)
  await context.close()
})
