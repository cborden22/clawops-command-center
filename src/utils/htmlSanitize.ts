import DOMPurify from 'dompurify';

/**
 * Sanitize user input for safe embedding in HTML templates.
 * Removes all HTML tags and script content to prevent XSS attacks.
 * 
 * @param input - User-provided string that may contain HTML/scripts
 * @returns Safe text content with HTML tags removed
 */
export function sanitizeForHTML(input: string | null | undefined): string {
  if (!input) return '';
  
  // Use DOMPurify to strip all HTML tags, keeping only text content
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true // Keep the text content
  });
}

/**
 * HTML-escape special characters for safe embedding in HTML.
 * Use this when you need to preserve the exact text including < and > characters.
 * 
 * @param input - String to escape
 * @returns Escaped string safe for HTML embedding
 */
export function escapeHTML(input: string | null | undefined): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
