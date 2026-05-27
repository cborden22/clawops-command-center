/**
 * Returns true if URL uses a safe protocol for an anchor href (http/https/mailto/tel).
 * Prevents javascript: and data: URL XSS vectors.
 */
export function isSafeHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /^(https?:|mailto:|tel:)/i.test(url.trim());
}
