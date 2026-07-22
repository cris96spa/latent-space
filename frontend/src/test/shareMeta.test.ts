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

describe('og-image', () => {
  it('is a 1200×630 PNG', () => {
    const png = readFileSync(fileURLToPath(new URL('../../public/og-image.png', import.meta.url)))
    // PNG signature.
    expect(Array.from(png.subarray(0, 8))).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    // IHDR width/height are big-endian uint32 at byte offsets 16 and 20.
    expect(png.readUInt32BE(16)).toBe(1200)
    expect(png.readUInt32BE(20)).toBe(630)
  })
})
