export function sanitizeNextPath(candidate, fallback = '/dashboard') {
  if (!candidate || typeof candidate !== 'string') {
    return fallback;
  }
  if (!candidate.startsWith('/')) {
    return fallback;
  }
  return candidate;
}
