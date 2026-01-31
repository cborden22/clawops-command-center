/**
 * Convert a string to a URL-friendly slug
 * Example: "Downtown Pizza & Taproom" → "downtown-pizza-taproom"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate a unit code for a machine based on type and index
 * Example: "claw" with index 1 → "claw-1"
 */
export function generateUnitCode(machineType: string, index: number): string {
  return `${machineType.toLowerCase().replace(/_/g, "-")}-${index}`;
}
