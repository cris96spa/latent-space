import { expect, test } from '@playwright/test'

import { stubApi } from './fixtures/content'

test('projects list renders cards from the API', async ({ page }) => {
  await stubApi(page)
  await page.goto('/projects')
  await expect(page.getByText('GPT-2 from scratch')).toBeVisible()
})

test('a suggested prompt reveals its authored answer', async ({ page }) => {
  await stubApi(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'What do you actually do?' }).click()
  await expect(page.getByText('I make language models faster and cheaper.')).toBeVisible()
})

test('the résumé PDF downloads with its stable filename', async ({ page }) => {
  await stubApi(page)
  await page.goto('/resume')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: /download pdf/i }).click(),
  ])
  expect(download.suggestedFilename()).toBe('Cristian_C_Spagnuolo_CV.pdf')
})
