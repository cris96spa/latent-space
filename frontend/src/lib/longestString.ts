/**
 * The longest of `values`, or an empty string for none. Ties keep the first value, so a
 * caller sizing a layout against a value set gets a stable answer as that set is reordered.
 */
export function longestString(values: readonly string[]): string {
  return values.reduce((longest, value) => (value.length > longest.length ? value : longest), '')
}
