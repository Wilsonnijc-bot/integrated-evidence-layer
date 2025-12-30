import type { ProviderAdapter, RawProviderResult, NormalizedProviderEvidence, ScanInput, EvidenceItem } from "../types";
import { createRawResult, createErrorResult, withTimeout, getChainId, SUPPORTED_CHAINS } from "./base";
import { asInteger, asFloat } from "../utils/parse";

const PROVIDER_TIMEOUT_MS = 6000;

export const goplusAdapter: ProviderAdapter = {
  id: "goplus",
  name: "GoPlus",
  supports: (chain: string) => (SUPPORTED_CHAINS as readonly string[]).includes(chain),
  
  fetchRaw: async (input: ScanInput): Promise<RawProviderResult> => {
    const chainId = getChainId(input.chain);
    const apiKey = process.env.GOPLUS_API_KEY;
    const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${input.tokenAddress}`;

    try {
      const fetchPromise = fetch(url, {
        headers: {
          ...(apiKey ? { "X-API-KEY": apiKey } : {}),
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      });

      const response = await withTimeout(
        fetchPromise,
        PROVIDER_TIMEOUT_MS,
        `GoPlus API timeout after ${PROVIDER_TIMEOUT_MS}ms`,
      );

      const httpStatus = response.status;
      const raw = response.ok ? await response.json() : null;

      if (!response.ok) {
        return createErrorResult(
          "goplus",
          "GoPlus",
          url,
          "GET",
          `HTTP ${httpStatus}: ${response.statusText}`,
          httpStatus,
        );
      }

      return createRawResult("goplus", "GoPlus", url, "GET", httpStatus, raw);
    } catch (error) {
      return createErrorResult(
        "goplus",
        "GoPlus",
        url,
        "GET",
        error instanceof Error ? error.message : String(error),
      );
    }
  },

  normalize: (raw: RawProviderResult, input: ScanInput): NormalizedProviderEvidence => {
    const evidence: EvidenceItem[] = [];
    const flags: string[] = [];

    if (!raw.raw || raw.error) {
      return {
        providerId: "goplus",
        providerName: "GoPlus",
        verdict: "medium",
        summary: raw.error || "No data available",
        flags: [],
        timestamp: raw.fetchedAt,
        evidence: [],
        rawSha256: raw.rawSha256,
      };
    }

    // GoPlus API response structure (partial)
    interface GoPlusTokenData {
      buy_tax?: string | number;
      sell_tax?: string | number;
      transfer_tax?: string | number;
      is_honeypot?: string;
      cannot_sell_all?: string;
      is_proxy?: string;
      is_blacklisted?: string;
      is_mintable?: string;
      holder_count?: string | number;
      creator_address?: string;
      honeypot_with_same_creator?: string;
      is_in_cex?: {
        listed?: string;
        cex_list?: Array<{ name?: string }>;
      };
      dex?: Array<{ liquidity?: string | number }>;
      lp_holders?: Array<{ is_locked?: number | string }>;
      [key: string]: unknown;
    }
    interface GoPlusResponse {
      code: number;
      result?: Record<string, GoPlusTokenData>;
    }
    const payload = raw.raw as GoPlusResponse;
    if (payload.code !== 1 || !payload.result) {
      return {
        providerId: "goplus",
        providerName: "GoPlus",
        verdict: "medium",
        summary: "Invalid response from GoPlus",
        flags: [],
        timestamp: raw.fetchedAt,
        evidence: [],
        rawSha256: raw.rawSha256,
      };
    }

    const tokenAddress = input.tokenAddress.toLowerCase();
    const tokenData = payload.result[tokenAddress] || payload.result[input.tokenAddress];
    if (!tokenData) {
      return {
        providerId: "goplus",
        providerName: "GoPlus",
        verdict: "low",
        summary: "Token not found in GoPlus database",
        flags: [],
        timestamp: raw.fetchedAt,
        evidence: [],
        rawSha256: raw.rawSha256,
      };
    }

    // Contract Risk
    if (tokenData.is_honeypot === "1") {
      evidence.push({
        category: "contractRisk",
        key: "HONEYPOT_DETECTED",
        severity: "high",
        title: "Honeypot detected",
        detail: "Tokens cannot be sold",
      });
      flags.push("⚠️ Honeypot detected");
    }

    if (tokenData.cannot_sell_all === "1") {
      evidence.push({
        category: "contractRisk",
        key: "SELL_LIMIT_PRESENT",
        severity: "medium",
        title: "Full sell-off not possible (sell limit)",
        detail: "Contract enforces max sell / max tx limit. This is NOT necessarily a honeypot.",
      });
      flags.push("⚠️ Sell limit present");
    }

    if (tokenData.is_blacklisted === "1") {
      evidence.push({
        category: "contractRisk",
        key: "HAS_BLACKLIST",
        severity: "high",
        title: "Blacklist function detected",
        detail: "Owner can block addresses",
      });
      flags.push("⚠️ Blacklist function");
    }

    if (tokenData.is_proxy === "1") {
      evidence.push({
        category: "contractRisk",
        key: "PROXY_UPGRADEABLE",
        severity: "medium",
        title: "Proxy contract (upgradeable)",
        detail: "Owner can change contract logic",
      });
      flags.push("Proxy contract");
    }

    if (tokenData.is_mintable === "1") {
      evidence.push({
        category: "contractRisk",
        key: "IS_MINTABLE",
        severity: "medium",
        title: "Token is mintable",
        detail: "Supply can be increased",
      });
      flags.push("Mintable token");
    }

    const buyTax = asFloat(tokenData.buy_tax) || 0;
    const sellTax = asFloat(tokenData.sell_tax) || 0;
    // transferTax is available but not currently used in evidence
    // const transferTax = asFloat(tokenData.transfer_tax) || 0;

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

    if (sellTax > 0) {
      const severity = sellTax > 50 ? "high" : sellTax > 10 ? "medium" : "low";
      evidence.push({
        category: "contractRisk",
        key: "HIGH_SELL_TAX",
        severity,
        title: `Sell tax: ${sellTax}%`,
        detail: sellTax > 50 ? "Extremely high tax" : sellTax > 10 ? "High tax" : "Low tax",
      });
      flags.push(`Sell tax: ${sellTax}%`);
    }

    if (tokenData.is_open_source === "0") {
      evidence.push({
        category: "contractRisk",
        key: "NOT_OPEN_SOURCE",
        severity: "medium",
        title: "Contract not open source",
        detail: "Code cannot be verified",
      });
      flags.push("Not open source");
    }

    if (tokenData.trust_list === "1") {
      evidence.push({
        category: "contractRisk",
        key: "TRUST_LISTED",
        severity: "info",
        title: "Trusted token",
        detail: "Listed on GoPlus trust list",
      });
    }

    // Liquidity Evidence
    if (tokenData.dex && Array.isArray(tokenData.dex) && tokenData.dex.length > 0) {
      const totalLiquidity = tokenData.dex.reduce((sum: number, dex: { liquidity?: string | number }) => {
        return sum + (asFloat(dex.liquidity) || 0);
      }, 0);

      if (totalLiquidity > 0) {
        evidence.push({
          category: "liquidityEvidence",
          key: "TOTAL_LIQUIDITY_USD",
          severity: "info",
          title: `Total liquidity: $${(totalLiquidity / 1e6).toFixed(2)}M`,
          detail: `${tokenData.dex.length} DEX pools`,
        });
      }

      const lockedLP = tokenData.lp_holders?.filter((lp: { is_locked?: number | string }) => lp.is_locked === 1 || lp.is_locked === "1");
      if (lockedLP && lockedLP.length > 0) {
        evidence.push({
          category: "liquidityEvidence",
          key: "LP_LOCKED_PRESENT",
          severity: "info",
          title: `${lockedLP.length} LP positions locked`,
          detail: "Liquidity is locked",
        });
      } else if (tokenData.lp_holders && tokenData.lp_holders.length > 0) {
        evidence.push({
          category: "liquidityEvidence",
          key: "LP_UNLOCKED",
          severity: "medium",
          title: "No locked LP detected",
          detail: "All liquidity positions are unlocked",
        });
      }
    }

    // Deployer Reputation
    if (tokenData.creator_address) {
      evidence.push({
        category: "deployerReputation",
        key: "CREATOR_ADDRESS",
        severity: "info",
        title: `Creator: ${tokenData.creator_address.slice(0, 6)}...${tokenData.creator_address.slice(-4)}`,
        detail: tokenData.creator_address,
      });
    }

    if (tokenData.honeypot_with_same_creator === "1") {
      evidence.push({
        category: "deployerReputation",
        key: "PAST_HONEYPOT_CREATOR",
        severity: "high",
        title: "Creator has deployed honeypot tokens before",
        detail: "High risk deployer",
      });
      flags.push("🚨 Past honeypot creator");
    }

    // Behavioral Signals
    if (tokenData.holder_count) {
      evidence.push({
        category: "behavioralSignals",
        key: "HOLDER_COUNT",
        severity: "info",
        title: `${(asInteger(tokenData.holder_count) || 0).toLocaleString()} token holders`,
      });
    }

    if (tokenData.is_in_cex?.listed === "1") {
      evidence.push({
        category: "behavioralSignals",
        key: "CEX_LISTED",
        severity: "info",
        title: `Listed on CEX: ${tokenData.is_in_cex?.cex_list?.map(c => c.name || "").filter(Boolean).join(", ") || "Unknown"}`,
      });
    }

    // Determine verdict
    let verdict: "low" | "medium" | "high" = "low";
    if (tokenData.is_honeypot === "1" || tokenData.is_blacklisted === "1") {
      verdict = "high";
    } else if (flags.length > 0 || buyTax > 10 || sellTax > 10 || tokenData.cannot_sell_all === "1") {
      verdict = "medium";
    }

    // Build summary
    let summary = "";
    if (tokenData.trust_list === "1") {
      summary = "Trusted Token - Well-known and backed by reputable institutions";
    } else if (flags.length === 0) {
      summary = "No major risks detected - Token appears safe";
    } else {
      summary = `${flags.length} risk flag${flags.length !== 1 ? "s" : ""} detected`;
    }

    return {
      providerId: "goplus",
      providerName: "GoPlus",
      verdict,
      summary,
      flags: flags.slice(0, 8), // Top 8 flags
      timestamp: raw.fetchedAt,
      evidence,
      rawSha256: raw.rawSha256,
    };
  },
};
