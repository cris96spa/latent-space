import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

describe('shareability metadata', () => {
  it('index.html declares Open Graph and Twitter card tags', () => {
    const html = read('../../index.html')
    expect(html).toContain('property="og:title"')
    expect(html).toContain('property="og:description"')
    expect(html).toContain('property="og:image"')
    expect(html).toContain('name="twitter:card"')
    expect(html).toContain('content="summary_large_image"')
  })

  it('ships robots.txt referencing the sitemap', () => {
    const robots = read('../../public/robots.txt')
    expect(robots).toContain('User-agent: *')
    expect(robots).toContain('Sitemap:')
  })

  it('ships a sitemap listing the top-level routes', () => {
    const sitemap = read('../../public/sitemap.xml')
    expect(sitemap).toContain('<loc>/</loc>')
    expect(sitemap).toContain('/projects')
    expect(sitemap).toContain('/writing')
    expect(sitemap).toContain('/resume')
  })
})
