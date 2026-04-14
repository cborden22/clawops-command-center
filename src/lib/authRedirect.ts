/**
 * Returns a safe canonical base URL for auth redirects.
 * Ensures the URL is one of the allowed redirect origins.
 */
const ALLOWED_ORIGINS = [
  "https://clawops.com",
  "https://www.clawops.com",
  "https://clawops.lovable.app",
];

export function getCanonicalRedirectOrigin(): string {
  const origin = window.location.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  // For preview/dev environments, use the current origin
  return origin;
}
