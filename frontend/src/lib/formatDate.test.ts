import { describe, expect, it } from 'vitest'

import { formatPublishDate } from './formatDate'

describe('formatPublishDate', () => {
  it('formats an ISO date as a short day-month-year label', () => {
    expect(formatPublishDate('2026-07-21')).toBe('21 Jul 2026')
    expect(formatPublishDate('2024-01-01')).toBe('1 Jan 2024')
    expect(formatPublishDate('2023-12-31')).toBe('31 Dec 2023')
  })

  it('keeps the calendar date regardless of time zone', () => {
    // `new Date("2026-01-01")` is UTC midnight and renders as 2025 in negative-offset
    // zones; parsing the fields directly avoids that off-by-one-day drift.
    expect(formatPublishDate('2026-01-01')).toBe('1 Jan 2026')
  })

  it('rejects input that is not exactly YYYY-MM-DD', () => {
    expect(() => formatPublishDate('2026-7-1')).toThrow()
    expect(() => formatPublishDate('July 21, 2026')).toThrow()
  })

  it('rejects an out-of-range month', () => {
    expect(() => formatPublishDate('2026-13-01')).toThrow()
  })
})
