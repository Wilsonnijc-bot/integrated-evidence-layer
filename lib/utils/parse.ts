/**
 * Safe parsing utilities for external API payloads
 * All functions handle string | number | undefined | null safely
 */

/**
 * Convert value to number, returning undefined if invalid
 */
export function asNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") return isNaN(value) ? undefined : value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

/**
 * Convert value to string, returning undefined if invalid
 */
export function asString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

/**
 * Convert value to array, returning empty array if invalid
 */
export function asArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

/**
 * Ensure address is lowercase and valid format
 * Throws if invalid
 */
export function ensureLowercaseAddress(address: string): string {
  const trimmed = address.trim();
  if (!/^0x[a-fA-F0-9]{40}$/i.test(trimmed)) {
    throw new Error(`Invalid Ethereum address format: ${trimmed}`);
  }
  return trimmed.toLowerCase();
}

/**
 * Safe parseInt with fallback
 */
export function asInteger(value: unknown, fallback?: number): number | undefined {
  const num = asNumber(value);
  if (num === undefined) return fallback;
  return Math.floor(num);
}

/**
 * Safe parseFloat with fallback
 */
export function asFloat(value: unknown, fallback?: number): number | undefined {
  return asNumber(value) ?? fallback;
}

