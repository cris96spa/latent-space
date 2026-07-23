import { screen, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'

import { ProjectsPage } from './ProjectsPage'
import { renderInApp } from '../test-utils/render'
import type { Project } from '../lib/api'
import { getProjects } from '../lib/api'

// Mock the whole api module but keep every real export except getProjects. Spying on a bare
// ESM named export is unreliable (the namespace is read-only); vi.mock is the robust path.
vi.mock('../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/api')>()),
  getProjects: vi.fn(),
}))

const mockedGetProjects = vi.mocked(getProjects)

const PROJECT: Project = {
  publicIdentifier: 'gpt2-from-scratch',
  title: 'GPT-2 from scratch',
  summary: 'Rebuilt GPT-2 124M in PyTorch to see what every layer was doing.',
  stack: ['PyTorch'],
  tags: ['llm'],
  repositoryUrl: 'https://github.com/cris96spa',
  demoUrl: null,
  coverImage: null,
  publishedAt: '2026-01-01',
  updatedAt: null,
}

describe('ProjectsPage', () => {
  it('renders a card per project from the API', async () => {
    mockedGetProjects.mockResolvedValue([PROJECT])
    renderInApp(<ProjectsPage />)
    await waitFor(() => expect(screen.getByText('GPT-2 from scratch')).toBeInTheDocument())
  })

  it('has no automatically-detectable accessibility violations', async () => {
    mockedGetProjects.mockResolvedValue([PROJECT])
    const { container } = renderInApp(<ProjectsPage />)
    await waitFor(() => expect(screen.getByText('GPT-2 from scratch')).toBeInTheDocument())
    expect(await axe(container)).toHaveNoViolations()
  })
})
