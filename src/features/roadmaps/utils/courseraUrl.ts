export function isAllowedCourseraUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    const allowedHosts = new Set(['coursera.org', 'www.coursera.org'])

    return parsed.protocol === 'https:' && allowedHosts.has(parsed.hostname)
  } catch {
    return false
  }
}
