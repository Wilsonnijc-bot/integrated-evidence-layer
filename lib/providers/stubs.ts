import type { ProviderAdapter, RawProviderResult, NormalizedProviderEvidence, ScanInput } from "../types";
import { createErrorResult, SUPPORTED_CHAINS } from "./base";

/**
 * Create a stub adapter for providers that require API keys
 */
function createStubAdapter(
  id: string,
  name: string,
  envKey: string,
): ProviderAdapter {
  return {
    id,
    name,
    supports: (chain: string) => SUPPORTED_CHAINS.includes(chain as any),
    
    fetchRaw: async (input: ScanInput): Promise<RawProviderResult> => {
      const apiKey = process.env[envKey];
      
      if (!apiKey) {
        return createErrorResult(
          id,
          name,
          `https://api.${id}.com`, // Placeholder URL
          "GET",
          "missing_api_key",
        );
      }

      // If key exists but we're in MVP, still return error
      return createErrorResult(
        id,
        name,
        `https://api.${id}.com`,
        "GET",
        "Provider integration requires partner API key; disabled in MVP.",
      );
    },

    normalize: (raw: RawProviderResult): NormalizedProviderEvidence => {
      return {
        providerId: id,
        providerName: name,
        verdict: "medium",
        summary: raw.error === "missing_api_key"
          ? "Provider integration requires partner API key; disabled in MVP."
          : "Provider not available in MVP",
        flags: [],
        timestamp: raw.fetchedAt,
        evidence: [],
        rawSha256: raw.rawSha256,
      };
    },
  };
}

// Stub adapters for providers that require keys/partnerships
export const tokensnifferStub = createStubAdapter("tokensniffer", "Token Sniffer", "TOKENSNIFFER_API_KEY");
export const cyberscopeStub = createStubAdapter("cyberscope", "Cyberscope", "CYBERSCOPE_API_KEY");
export const defiStub = createStubAdapter("defi", "De.Fi", "DEFI_API_KEY");
export const solidityscanStub = createStubAdapter("solidityscan", "SolidityScan", "SOLIDITYSCAN_API_KEY");
export const dexanalyzerStub = createStubAdapter("dexanalyzer", "DexAnalyzer", "DEXANALYZER_API_KEY");
export const quillcheckStub = createStubAdapter("quillcheck", "QuillCheck", "QUILLCHECK_API_KEY");
export const aegisStub = createStubAdapter("aegis", "Aegisweb3", "AEGIS_API_KEY");
export const blocksafuStub = createStubAdapter("blocksafu", "BlockSafu", "BLOCKSAFU_API_KEY");
export const contractwolfStub = createStubAdapter("contractwolf", "ContractWolf", "CONTRACTWOLF_API_KEY");
export const staysafuStub = createStubAdapter("staysafu", "StaySAFU", "STAYSAFU_API_KEY");

