export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date + 'T00:00:00'))
}
export function prettyValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number')
    return String(value)
  if (Array.isArray(value)) return value.map(prettyValue).join(' · ')
  if (typeof value === 'object')
    return Object.entries(value)
      .map(([key, item]) => key.replaceAll('_', ' ') + ': ' + prettyValue(item))
      .join(' · ')
  return String(value)
}
