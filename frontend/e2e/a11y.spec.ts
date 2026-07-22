import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { stubApi } from './fixtures/content'

test('home has no automatically-detectable accessibility violations', async ({ page }) => {
  await stubApi(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('projects page has no automatically-detectable accessibility violations', async ({ page }) => {
  await stubApi(page)
  await page.goto('/projects')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('the skip link is the first tab stop and moves focus to main', async ({ page }) => {
  await stubApi(page)
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: /skip to content/i })
  await expect(skip).toBeFocused()
  await skip.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
})
