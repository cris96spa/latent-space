import { expect, test, type Page } from '@playwright/test'

import { stubApi, stubTokenize } from './fixtures/content'

/**
 * Frame positions to sample, as fractions of the streamed buffer, so the pass is measured
 * in every phase: the resting tokenize frames, prefill, early and late decode, and the
 * finished pass. Seeking pauses playback, so each measurement is a settled layout rather
 * than a race with the player.
 */
const SAMPLE_FRACTIONS = [0, 0.1, 0.3, 0.5, 0.8, 1]

const MOBILE_VIEWPORTS = [
  { label: 'phone', width: 390, height: 844 },
  { label: 'narrow phone', width: 320, height: 700 },
]

/** Runs the pass to the end so the frame buffer is complete before anything is measured. */
async function streamWholePass(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Skip to end' }).click()
  await expect(page.getByText('complete:')).toBeVisible()
}

/** The hero section's height at each sampled frame, rounded to whole pixels. */
async function heroHeightsAcrossPass(page: Page): Promise<number[]> {
  const hero = page.locator('section[aria-labelledby="hero-heading"]')
  const slider = page.getByRole('slider')
  const lastPosition = Number(await slider.getAttribute('max'))
  const heights: number[] = []
  for (const fraction of SAMPLE_FRACTIONS) {
    await slider.fill(String(Math.round(lastPosition * fraction)))
    const box = await hero.boundingBox()
    heights.push(Math.round(box?.height ?? 0))
  }
  return heights
}

for (const viewport of MOBILE_VIEWPORTS) {
  test.describe(`forward-pass hero on a ${viewport.label} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('keeps one height through the whole pass in the text view', async ({ page }) => {
      await stubApi(page)
      await stubTokenize(page)
      await page.goto('/')
      await streamWholePass(page)

      const heights = await heroHeightsAcrossPass(page)
      expect(new Set(heights).size, `hero height changed across the pass: ${heights}`).toBe(1)
    })

    test('keeps one height through the whole pass in the ids view', async ({ page }) => {
      await stubApi(page)
      await stubTokenize(page)
      await page.goto('/')
      // The sticky header overlaps the prompt strip at the top of the page, and this test is
      // about layout, not about whether the toggle is clickable at scroll zero.
      await page.locator('input[value="ids"]').check({ force: true })
      await streamWholePass(page)

      const heights = await heroHeightsAcrossPass(page)
      expect(new Set(heights).size, `hero height changed across the pass: ${heights}`).toBe(1)
    })

    // Reserving worst-case widths is exactly the kind of change that could push the hero
    // sideways, so it is pinned here; `header.spec.ts` covers the page as a whole.
    test('never scrolls sideways', async ({ page }) => {
      await stubApi(page)
      await stubTokenize(page)
      await page.goto('/')
      await streamWholePass(page)

      const overflow = await page
        .locator('section[aria-labelledby="hero-heading"]')
        .evaluate((hero) => hero.scrollWidth - hero.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  })
}
