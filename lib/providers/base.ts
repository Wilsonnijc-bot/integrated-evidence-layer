import { createHash } from "crypto";
import type { RawProviderResult, ScanInput } from "../types";

/**
 * Generate SHA-256 hash of payload
 */
export function hashPayload(payload: unknown): string {
  const json = JSON.stringify(payload, Object.keys(payload as object).sort());
  return createHash("sha256").update(json).digest("hex");
}

/**
 * Create a raw provider result
 */
export function createRawResult(
  providerId: string,
  providerName: string,
  url: string,
  method: "GET" | "POST",
  httpStatus: number,
  raw: unknown,
  error?: string,
): RawProviderResult {
  const fetchedAt = new Date().toISOString();
  // Always compute hash, even for null/error cases
  const rawSha256 = raw !== null && raw !== undefined ? hashPayload(raw) : hashPayload({ error, httpStatus });

  return {
    providerId,
    providerName,
    fetchedAt,
    request: { url, method },
    httpStatus,
    raw: raw !== null && raw !== undefined ? raw : null,
    rawSha256,
    error,
  };
}

/**
 * Create error result
 */
export function createErrorResult(
  providerId: string,
  providerName: string,
  url: string,
  method: "GET" | "POST",
  error: string,
  httpStatus?: number,
): RawProviderResult {
  return createRawResult(providerId, providerName, url, method, httpStatus || 0, null, error);
}

/**
 * Timeout wrapper
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs),
    ),
  ]);
}

/**
 * Chain ID mapping
 */
export const CHAIN_ID_MAP: Record<string, string> = {
  ethereum: "1",
  bsc: "56",
  polygon: "137",
  arbitrum: "42161",
  optimism: "10",
};

export function getChainId(chain: string): string {
  return CHAIN_ID_MAP[chain] || "1";
}

/**
 * Supported chains
 */
export const SUPPORTED_CHAINS = ["ethereum", "bsc", "polygon", "arbitrum", "optimism"] as const;
