/**
 * Stable ID generator for SSR compatibility
 * Avoids hydration mismatches by using predictable IDs
 */

let counter = 0;

export function generateStableId(prefix: string = 'id'): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function resetCounter(): void {
  counter = 0;
}