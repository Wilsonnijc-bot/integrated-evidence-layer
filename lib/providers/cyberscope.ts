import type { ProviderAdapter } from "./base";
import type { RawProviderRecord } from "../types";
import { createRawRecord, withTimeout } from "./base";

const PROVIDER_TIMEOUT_MS = 6000; // 6 seconds

// Cyberscope/Cyberscan API endpoint
// Note: Actual API endpoint needs verification from Cyberscope documentation
const CYBERSCOPE_API_BASE = "https://api.cyberscope.io";

export const cyberscopeAdapter: ProviderAdapter = {
  providerId: "cyberscope",
  providerName: "Cyberscope",
  call: async (tokenAddress: string, chain: string, chainId: string | number): Promise<RawProviderRecord> => {
    const requestedAt = new Date().toISOString();
    const request = { chain, chainId: typeof chainId === "string" ? parseInt(chainId) : chainId, tokenAddress };

    try {
      const apiKey = process.env.CYBERSCOPE_API_KEY;
      
      // Try POST endpoint pattern
      let url = `${CYBERSCOPE_API_BASE}/v1/token/scan`;
      
      // Alternative: GET endpoint
      // url = `${CYBERSCOPE_API_BASE}/api/v1/scan?address=${tokenAddress}&chainId=${chainId}`;

      const fetchPromise = fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(apiKey ? { "X-API-Key": apiKey } : {}),
          ...(apiKey ? { "Authorization": `Bearer ${apiKey}` } : {}),
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          address: tokenAddress,
          chain: chainId,
          chainId: typeof chainId === "string" ? parseInt(chainId) : chainId,
        }),
        cache: "no-store",
      });

      const response = await withTimeout(
        fetchPromise,
        PROVIDER_TIMEOUT_MS,
        `Cyberscope API timeout after ${PROVIDER_TIMEOUT_MS}ms`,
      );

      const respondedAt = new Date().toISOString();
      const httpStatus = response.status;

      if (!response.ok) {
        return createRawRecord(
          "cyberscope",
          "Cyberscope",
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
        "cyberscope",
        "Cyberscope",
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
        "cyberscope",
        "Cyberscope",
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

