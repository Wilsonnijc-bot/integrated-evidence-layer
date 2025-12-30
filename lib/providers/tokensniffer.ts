import type { ProviderAdapter } from "./base";
import type { RawProviderRecord } from "../types";
import { createRawRecord, withTimeout } from "./base";

const PROVIDER_TIMEOUT_MS = 6000; // 6 seconds

// Token Sniffer API endpoint
// Note: Actual API endpoint needs verification from Token Sniffer documentation
const TOKENSNIFFER_API_BASE = "https://api.tokensniffer.com";

export const tokensnifferAdapter: ProviderAdapter = {
  providerId: "tokensniffer",
  providerName: "Token Sniffer",
  call: async (tokenAddress: string, chain: string, chainId: string | number): Promise<RawProviderRecord> => {
    const requestedAt = new Date().toISOString();
    const request = { chain, chainId: typeof chainId === "string" ? parseInt(chainId) : chainId, tokenAddress };

    try {
      const apiKey = process.env.TOKENSNIFFER_API_KEY;
      
      // Try v1 endpoint pattern
      let url = `${TOKENSNIFFER_API_BASE}/v1/token/${tokenAddress}?chain=${chainId}`;
      
      // Alternative patterns to try:
      // url = `${TOKENSNIFFER_API_BASE}/api/v1/tokens/${tokenAddress}?chain=${chain}`;
      // url = `${TOKENSNIFFER_API_BASE}/tokens/${tokenAddress}?chainId=${chainId}`;

      const fetchPromise = fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          ...(apiKey ? { "X-API-Key": apiKey } : {}),
          ...(apiKey ? { "Authorization": `Bearer ${apiKey}` } : {}),
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      });

      const response = await withTimeout(
        fetchPromise,
        PROVIDER_TIMEOUT_MS,
        `Token Sniffer API timeout after ${PROVIDER_TIMEOUT_MS}ms`,
      );

      const respondedAt = new Date().toISOString();
      const httpStatus = response.status;

      if (!response.ok) {
        return createRawRecord(
          "tokensniffer",
          "Token Sniffer",
          requestedAt,
          request,
          false,
          respondedAt,
          httpStatus,
          undefined,
          `HTTP ${httpStatus}: ${response.statusText}`,
        );
      }

      const rawPayload = await response.json();

      return createRawRecord(
        "tokensniffer",
        "Token Sniffer",
        requestedAt,
        request,
        true,
        respondedAt,
        httpStatus,
        rawPayload,
      );
    } catch (error) {
      const respondedAt = new Date().toISOString();
      return createRawRecord(
        "tokensniffer",
        "Token Sniffer",
        requestedAt,
        request,
        false,
        respondedAt,
        undefined,
        undefined,
        error instanceof Error ? error.message : String(error),
      );
    }
  },
};

