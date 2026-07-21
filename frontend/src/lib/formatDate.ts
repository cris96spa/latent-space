const MONTH_ABBREVIATIONS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

/**
 * Formats an ISO `YYYY-MM-DD` date as a short, locale-independent label like `21 Jul 2026`.
 * The fields are parsed directly rather than through `new Date(iso)`, whose UTC-midnight
 * result renders as the previous day in negative-offset time zones. Throws on input that is
 * not exactly `YYYY-MM-DD` or whose month is out of range.
 */
export function formatPublishDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) {
    throw new Error(`Expected an ISO YYYY-MM-DD date, got '${iso}'.`)
  }
  const [, year, month, day] = match
  const monthLabel = MONTH_ABBREVIATIONS[Number(month) - 1]
  if (!monthLabel) {
    throw new Error(`Month out of range in date '${iso}'.`)
  }
  return `${Number(day)} ${monthLabel} ${year}`
}
