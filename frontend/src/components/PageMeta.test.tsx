import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PageMeta } from './PageMeta'

describe('PageMeta', () => {
  it('sets the document title and meta description', async () => {
    render(<PageMeta title="Projects — latent-space" description="The things I build." />)
    await waitFor(() => expect(document.title).toBe('Projects — latent-space'))
    const meta = document.head.querySelector('meta[name="description"]')
    expect(meta).toHaveAttribute('content', 'The things I build.')
  })
})
