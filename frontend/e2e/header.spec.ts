import { expect, test } from '@playwright/test'

import { stubApi } from './fixtures/content'

const NAV_LINKS = ['Projects', 'Writing', 'Resume']

const MOBILE_VIEWPORTS = [
  { label: 'phone', width: 390, height: 844 },
  { label: 'narrow phone', width: 320, height: 700 },
]

for (const viewport of MOBILE_VIEWPORTS) {
  test.describe(`site header on a ${viewport.label} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    // The wordmark and the nav need about 450px side by side, so they share a row only from
    // `sm` up. Before that they overflowed the viewport and the whole page scrolled sideways.
    test('does not push the page sideways', async ({ page }) => {
      await stubApi(page)
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
    })

    test('keeps every primary nav link reachable', async ({ page }) => {
      await stubApi(page)
      await page.goto('/')
      const nav = page.getByRole('navigation', { name: 'Primary' })
      for (const name of NAV_LINKS) {
        await expect(nav.getByRole('link', { name })).toBeVisible()
      }
      await expect(page.getByRole('button', { name: /switch to/i })).toBeVisible()
    })

    test('keeps the wordmark on one line', async ({ page }) => {
      await stubApi(page)
      await page.goto('/')
      const wordmark = page.getByRole('link', { name: 'latent-space, home' })
      // Two lines of a 28px-tall mark would clear 40px; one line cannot.
      const box = await wordmark.boundingBox()
      expect(box?.height ?? 0).toBeLessThan(40)
    })
  })
}
