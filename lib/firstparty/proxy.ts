import type { EvidenceItem, ScanInput } from "../types";

/**
 * First-party proxy detection (EIP-1967)
 * Detects upgradeable proxy patterns without relying on third-party scanners
 */
export async function detectProxy(
  input: ScanInput,
): Promise<EvidenceItem | null> {
  // Only support Ethereum for now
  if (input.chain !== "ethereum") {
    return null;
  }

  try {
    // EIP-1967: Check storage slot 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
    // This slot contains the implementation address for transparent proxies
    // For MVP, we'll use a public RPC endpoint
    const rpcUrl = process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com";
    
    const storageSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getStorageAt",
        params: [input.tokenAddress, storageSlot, "latest"],
        id: 1,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const implementationAddress = data.result;

    // If storage slot is not empty (not 0x000...), it's likely a proxy
    if (implementationAddress && implementationAddress !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
      return {
        category: "contractRisk",
        key: "PROXY_UPGRADEABLE",
        severity: "medium",
        title: "Proxy contract detected (first-party)",
        detail: `Implementation address: ${implementationAddress.slice(0, 10)}... (EIP-1967 storage slot)`,
        value: implementationAddress,
      };
    }

    return null;
  } catch (error) {
    // Fail silently - first-party evidence is optional
    console.error("[First-party] Proxy detection error:", error);
    return null;
  }
}

