import type { ProviderAdapter, RawProviderResult, NormalizedProviderEvidence, ScanInput, EvidenceItem } from "../types";
import { createRawResult, createErrorResult, withTimeout, getChainId, SUPPORTED_CHAINS } from "./base";
import { asInteger } from "../utils/parse";

// Address validation - try to use ethers if available, otherwise use basic validation
let getAddress: (address: string) => string;
try {
  // Dynamic import to avoid require() - ethers is optional
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ethers = require("ethers");
  getAddress = ethers.getAddress;
} catch {
  // Fallback: basic address validation (checksum not enforced)
  getAddress = (address: string) => {
    const trimmed = address.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      throw new Error("Invalid address format");
    }
    return trimmed; // Return as-is, lowercase will be applied separately
  };
}

const PROVIDER_TIMEOUT_MS = 6000;

// Correct Honeypot.is API endpoint
const HONEYPOT_API_BASE = "https://api.honeypot.is";

export const honeypotAdapter: ProviderAdapter = {
  id: "honeypot",
  name: "Honeypot.is",
  supports: (chain: string) => (SUPPORTED_CHAINS as readonly string[]).includes(chain),
  
  fetchRaw: async (input: ScanInput): Promise<RawProviderResult> => {
    const now = new Date().toISOString();
    
    // #region agent log
    console.log(JSON.stringify({
      tag: "honeypot_call",
      step: "entry",
      addressOriginal: input.tokenAddress,
      chain: input.chain,
      at: now,
    }));
    // #endregion

    // 1) Validate and normalize address
    const addressOriginal = input.tokenAddress.trim();
    let addressChecksummed: string;
    let addressLowercased: string;
    
    try {
      addressChecksummed = getAddress(addressOriginal);
      addressLowercased = addressChecksummed.toLowerCase();
    } catch (error) {
      // #region agent log
      console.log(JSON.stringify({
        tag: "honeypot_call",
        step: "validation_failed",
        addressOriginal,
        error: error instanceof Error ? error.message : String(error),
        at: new Date().toISOString(),
      }));
      // #endregion

      return createErrorResult(
        "honeypot",
        "Honeypot.is",
        "",
        "GET",
        "Invalid token address (local validation failed)",
        400,
      );
    }

    // 2) Get chain ID
    const chainId = asInteger(getChainId(input.chain)) || 1;

    // 3) Build correct URL
    const url = new URL(`${HONEYPOT_API_BASE}/v2/IsHoneypot`);
    url.searchParams.set("address", addressLowercased);
    url.searchParams.set("chainID", String(chainId));
    
    const finalUrl = url.toString();

    // #region agent log
    console.log(JSON.stringify({
      tag: "honeypot_call",
      step: "request",
      finalUrl,
      addressOriginal,
      addressTrimmed: addressOriginal,
      addressChecksummed,
      addressLowercased,
      chain: input.chain,
      chainId,
      at: new Date().toISOString(),
    }));
    // #endregion

    try {
      const fetchPromise = fetch(finalUrl, {
        method: "GET",
        headers: {
          "accept": "application/json",
          "user-agent": "Mozilla/5.0",
        },
        cache: "no-store",
        redirect: "follow",
      });

      const response = await withTimeout(
        fetchPromise,
        PROVIDER_TIMEOUT_MS,
        `Honeypot.is API timeout after ${PROVIDER_TIMEOUT_MS}ms`,
      );

      const httpStatus = response.status;
      const contentType = response.headers.get("content-type") || "";
      
      // 4) Always get text first (never call res.json() on HTML)
      const rawText = await response.text();
      const bodyPrefix = rawText.slice(0, 120);

      // #region agent log
      console.log(JSON.stringify({
        tag: "honeypot_call",
        step: "response",
        finalUrl,
        addressOriginal,
        addressChecksummed,
        addressLowercased,
        chain: input.chain,
        chainId,
        respStatus: httpStatus,
        contentType,
        bodyPrefix,
        at: new Date().toISOString(),
      }));
      // #endregion

      // 5) Classify response
      if (!response.ok) {
        // JSON error payload is still "OK response from provider" (not WAF)
        if (contentType.includes("application/json")) {
          try {
            const errorData = JSON.parse(rawText);
            return createRawResult(
              "honeypot",
              "Honeypot.is",
              finalUrl,
              "GET",
              httpStatus,
              errorData,
            );
          } catch {
            // JSON parse failed on error response
            return createErrorResult(
              "honeypot",
              "Honeypot.is",
              finalUrl,
              "GET",
              `Provider returned ${httpStatus} with invalid JSON`,
              httpStatus,
            );
          }
        }
        // Non-JSON error (WAF/HTML)
        return createErrorResult(
          "honeypot",
          "Honeypot.is",
          finalUrl,
          "GET",
          `Non-JSON error (${httpStatus}; ${contentType || "no content-type"})`,
          httpStatus,
        );
      }

      // 6) Check content-type for successful responses
      if (!contentType.includes("application/json")) {
        return createErrorResult(
          "honeypot",
          "Honeypot.is",
          finalUrl,
          "GET",
          `Non-JSON response (${contentType || "no content-type"})`,
          httpStatus,
        );
      }

      // 7) Parse JSON safely
      let raw: unknown;
      try {
        raw = JSON.parse(rawText);
      } catch (parseError) {
        // #region agent log
        console.log(JSON.stringify({
          tag: "honeypot_call",
          step: "json_parse_failed",
          finalUrl,
          contentType,
          bodyPrefix,
          error: parseError instanceof Error ? parseError.message : String(parseError),
          at: new Date().toISOString(),
        }));
        // #endregion

        return createErrorResult(
          "honeypot",
          "Honeypot.is",
          finalUrl,
          "GET",
          "JSON parse failed (unexpected provider payload)",
          httpStatus,
        );
      }

      return createRawResult("honeypot", "Honeypot.is", finalUrl, "GET", httpStatus, raw);
    } catch (error) {
      // #region agent log
      console.log(JSON.stringify({
        tag: "honeypot_call",
        step: "exception",
        finalUrl,
        error: error instanceof Error ? error.message : String(error),
        at: new Date().toISOString(),
      }));
      // #endregion

      return createErrorResult(
        "honeypot",
        "Honeypot.is",
        finalUrl,
        "GET",
        error instanceof Error ? error.message : String(error),
      );
    }
  },

  normalize: (raw: RawProviderResult): NormalizedProviderEvidence => {
    const evidence: EvidenceItem[] = [];
    const flags: string[] = [];

    // Always return valid evidence, even on failure
    // Check for errors, non-200 status, or invalid JSON
    interface HoneypotErrorPayload {
      error?: string;
      rawText?: string;
      [key: string]: unknown;
    }
    interface HoneypotResponse {
      honeypotResult?: {
        isHoneypot?: boolean;
      };
      simulationResult?: {
        buyTax?: number;
        sellTax?: number;
      };
      contractCode?: {
        isProxy?: boolean;
      };
      error?: string;
      rawText?: string;
      [key: string]: unknown;
    }
    const isError = raw.error || raw.httpStatus !== 200 || !raw.raw;
    const payload = raw.raw as HoneypotErrorPayload | HoneypotResponse | null;
    const isInvalidPayload = payload && (payload.error || (payload as HoneypotErrorPayload).rawText);
    
    if (isError || isInvalidPayload) {
      // Don't add PROVIDER_UNAVAILABLE to evidence - it goes to coverage section
      flags.push("PROVIDER_UNAVAILABLE");
      
      const errorMsg = raw.error || 
        (payload?.error ? `Invalid response: ${payload.error}` : "") ||
        `HTTP ${raw.httpStatus || "error"}: Provider unavailable`;
      
      return {
        providerId: "honeypot",
        providerName: "Honeypot.is",
        verdict: "medium",
        summary: errorMsg,
        flags,
        timestamp: raw.fetchedAt,
        evidence: [], // No evidence items on failure
        rawSha256: raw.rawSha256 || "",
      };
    }

    // Payload is valid at this point - parse Honeypot.is v2 API response
    // Expected structure: { honeypotResult: { isHoneypot }, simulationResult: { buyTax, sellTax }, contractCode: { isProxy } }
    const validPayload = payload as HoneypotResponse;
    
    const isHoneypot = Boolean(validPayload?.honeypotResult?.isHoneypot === true);
    const buyTax = Number(validPayload?.simulationResult?.buyTax ?? 0);
    const sellTax = Number(validPayload?.simulationResult?.sellTax ?? 0);
    const isProxy = Boolean(validPayload?.contractCode?.isProxy);

    // Contract Risk - Only emit HONEYPOT_DETECTED if actually a honeypot
    if (isHoneypot) {
      evidence.push({
        category: "contractRisk",
        key: "HONEYPOT_DETECTED",
        severity: "high",
        title: "Honeypot detected",
        detail: "Tokens cannot be sold - this is a honeypot token",
      });
      flags.push("🚨 Honeypot detected");
    } else {
      // Emit NOT_HONEYPOT for clarity
      evidence.push({
        category: "contractRisk",
        key: "NOT_HONEYPOT",
        severity: "info",
        title: "Not a honeypot",
        detail: "Honeypot.is simulation indicates tokens can be sold",
      });
    }

    if (isProxy) {
      evidence.push({
        category: "contractRisk",
        key: "PROXY_UPGRADEABLE",
        severity: "medium",
        title: "Proxy contract detected",
        detail: "Contract uses an upgradeable proxy pattern",
      });
      flags.push("⚠️ Proxy contract");
    }

    if (sellTax > 0) {
      const severity = sellTax > 50 ? "high" : sellTax > 10 ? "medium" : "low";
      evidence.push({
        category: "contractRisk",
        key: "HIGH_SELL_TAX",
        severity,
        title: `Sell tax: ${sellTax}%`,
        detail: sellTax > 50 ? "Extremely high tax - may prevent selling" : sellTax > 10 ? "High tax" : "Low tax",
      });
      flags.push(`Sell tax: ${sellTax}%`);
    }

    if (buyTax > 0) {
      const severity = buyTax > 50 ? "high" : buyTax > 10 ? "medium" : "low";
      evidence.push({
        category: "contractRisk",
        key: "HIGH_BUY_TAX",
        severity,
        title: `Buy tax: ${buyTax}%`,
        detail: buyTax > 50 ? "Extremely high tax" : buyTax > 10 ? "High tax" : "Low tax",
      });
      flags.push(`Buy tax: ${buyTax}%`);
    }

    // Behavioral Signals
    if (buyTax > 10 || sellTax > 10) {
      evidence.push({
        category: "behavioralSignals",
        key: "SUSPICIOUS_TAX",
        severity: "medium",
        title: "Suspicious tax rates",
        detail: `Buy: ${buyTax}%, Sell: ${sellTax}%`,
      });
    }

    // Determine verdict
    let verdict: "low" | "medium" | "high" = "low";
    if (isHoneypot || sellTax > 50 || buyTax > 50) {
      verdict = "high";
    } else if (sellTax > 10 || buyTax > 10 || flags.length > 0) {
      verdict = "medium";
    }

    // Build summary
    let summary = "";
    if (isHoneypot) {
      summary = "Honeypot detected - tokens cannot be sold";
    } else if (sellTax > 10 || buyTax > 10) {
      summary = `High tax rates detected (Buy: ${buyTax}%, Sell: ${sellTax}%)`;
    } else if (isProxy) {
      summary = "Proxy contract detected";
    } else if (flags.length === 0) {
      summary = "Token appears sellable with low tax rates";
    } else {
      summary = `${flags.length} issue${flags.length !== 1 ? "s" : ""} detected`;
    }

    return {
      providerId: "honeypot",
      providerName: "Honeypot.is",
      verdict,
      summary,
      flags: flags.slice(0, 8), // Top 8 flags
      timestamp: raw.fetchedAt,
      evidence,
      rawSha256: raw.rawSha256,
    };
  },
};
