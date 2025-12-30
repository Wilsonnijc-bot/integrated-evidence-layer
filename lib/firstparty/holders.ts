import type { EvidenceItem, ScanInput } from "../types";

/**
 * First-party holder concentration detection
 * For MVP: Stub implementation (can be enhanced with on-chain data)
 */
export async function detectHolderConcentration(
  input: ScanInput,
): Promise<EvidenceItem | null> {
  // Only support Ethereum for now
  if (input.chain !== "ethereum") {
    return null;
  }

  try {
    // For MVP: This is a stub
    // In production: Query token holders via The Graph, Etherscan API, or direct RPC calls
    // For now, return null (can be implemented later)
    
    // Example future implementation:
    // 1. Query token holders via The Graph subgraph
    // 2. Calculate top 5 holders' percentage
    // 3. Return evidence if concentration > threshold (e.g., 50%)
    
    return null;
  } catch (error) {
    console.error("[First-party] Holder concentration error:", error);
    return null;
  }
}

