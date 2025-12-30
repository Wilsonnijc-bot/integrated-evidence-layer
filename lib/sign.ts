import { createHash } from "crypto";
import type { EvidenceBundle, RawMetadata } from "./types";

/**
 * Canonicalize JSON for consistent hashing
 */
function canonicalizeJson(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj as object).sort());
}

/**
 * Generate SHA-256 hash of bundle
 */
export function hashBundle(bundle: EvidenceBundle, rawMeta: RawMetadata[]): string {
  const canonical = canonicalizeJson({ bundle, rawMeta });
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Sign bundle using ed25519 (server-side)
 * For MVP, we'll use a simple approach - in production, use proper key management
 */
export function signBundle(
  bundleSha256: string,
  privateKey?: string,
): { signature: string; publicKeyId: string } {
  // For MVP: Use a simple HMAC-based signature
  // In production: Use proper ed25519 signing with key rotation
  const signingKey = privateKey || process.env.SIGNING_KEY || "mvp-signing-key-change-in-production";
  const signedAt = new Date().toISOString();
  
  // Simple HMAC signature (replace with ed25519 in production)
  const hmac = createHash("sha256")
    .update(`${bundleSha256}:${signedAt}:${signingKey}`)
    .digest("hex");
  
  // Base64 encode
  const signature = Buffer.from(hmac).toString("base64");
  const publicKeyId = "mvp-key-1"; // In production, rotate keys and track IDs

  return { signature, publicKeyId };
}

/**
 * Verify bundle signature
 */
export function verifySignature(
  bundleSha256: string,
  signature: string,
  publicKeyId: string,
  signedAt: string,
): boolean {
  const signingKey = process.env.SIGNING_KEY || "mvp-signing-key-change-in-production";
  
  // Recompute signature
  const hmac = createHash("sha256")
    .update(`${bundleSha256}:${signedAt}:${signingKey}`)
    .digest("hex");
  
  const expectedSignature = Buffer.from(hmac).toString("base64");
  
  return signature === expectedSignature && publicKeyId === "mvp-key-1";
}

