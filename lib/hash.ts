import { createHash } from "crypto";

/**
 * Canonicalize JSON by sorting keys recursively
 */
function canonicalize(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(canonicalize);
  }

  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = canonicalize((obj as Record<string, unknown>)[key]);
  }
  return sorted;
}

/**
 * Generate SHA-256 hash of canonicalized JSON
 */
export function hashPayload(payload: unknown): string {
  const canonical = canonicalize(payload);
  const json = JSON.stringify(canonical);
  return createHash("sha256").update(json).digest("hex");
}

