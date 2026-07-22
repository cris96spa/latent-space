import type { Page } from '@playwright/test'

// Wire-shape (snake_case) fixtures matching the FastAPI content responses.
export const PROJECTS_FIXTURE = [
  {
    public_identifier: 'gpt2-from-scratch',
    title: 'GPT-2 from scratch',
    summary: 'Rebuilt GPT-2 124M in PyTorch to see what every layer was doing.',
    stack: ['PyTorch'],
    tags: ['llm'],
    repository_url: 'https://github.com/cris96spa',
    demo_url: null,
    cover_image: null,
    published_at: '2026-01-01',
    updated_at: null,
  },
]

// A single plain-answer entry (no attachment) so the chat renders without the Plotly sweep.
export const CHAT_FIXTURE = [
  {
    public_identifier: 'what-do-you-do',
    question: 'What do you actually do?',
    category: 'role',
    attachment: null,
    answer_html: '<p>I make language models faster and cheaper.</p>',
  },
]

/** Intercepts every backend call with deterministic fixtures, so no FastAPI server is needed. */
export async function stubApi(page: Page): Promise<void> {
  await page.route('**/api/projects', (route) => route.fulfill({ json: PROJECTS_FIXTURE }))
  await page.route('**/api/chat/entries', (route) => route.fulfill({ json: CHAT_FIXTURE }))
  await page.route('**/api/posts', (route) => route.fulfill({ json: [] }))
}
