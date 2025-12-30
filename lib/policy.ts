import type { AggregatedEvidenceItem, PolicyDecision, PolicyMode, NormalizedProviderEvidence } from "./types";
import { asFloat } from "./utils/parse";

/**
 * Policy engine - evaluates evidence and makes decisions
 * Strict vs Degen modes are meaningfully different
 */
export function evaluatePolicy(
  evidence: AggregatedEvidenceItem[],
  normalizedEvidence: NormalizedProviderEvidence[],
  totalProvidersEnabled: number,
  mode: PolicyMode = "strict",
): PolicyDecision {
  const reasons: AggregatedEvidenceItem[] = [];
  let decision: "allow" | "warn" | "block" = "allow";

  // Check if token is trusted/CEX listed (for degen mode exceptions)
  const isTrusted = evidence.some((e) => e.key === "TRUST_LISTED");
  const isCexListed = evidence.some((e) => e.key === "CEX_LISTED");
  const isTrustedToken = isTrusted || isCexListed;
  
  // Get liquidity for trusted token exceptions
  const totalLiquidity = evidence.find((e) => e.key === "TOTAL_LIQUIDITY_USD");
  const liquidityValue = totalLiquidity?.value ? Number(totalLiquidity.value) : 0;
  const hasHugeLiquidity = liquidityValue > 10_000_000; // >$10M

  // Block list: only true honeypots block (both modes)
  const blockKeys = ["HONEYPOT_DETECTED"];
  const blockItems = evidence.filter((e) => blockKeys.includes(e.key));
  
  if (blockItems.length > 0) {
    decision = "block";
    reasons.push(...blockItems);
    return { mode, decision, reasons };
  }

  // Check provider availability (coverage)
  const availableProviders = normalizedEvidence.filter(
    (p) => !p.flags.includes("PROVIDER_UNAVAILABLE") && p.evidence.length > 0
  ).length;
  const coverageRatio = availableProviders / totalProvidersEnabled;
  const hasLowCoverage = coverageRatio < 1.0;

  // Warn conditions - different for strict vs degen
  const warnItems: AggregatedEvidenceItem[] = [];
  
  if (mode === "strict") {
    // STRICT MODE: Conservative policy
    
    // Warn on medium severity items
    const mediumItems = evidence.filter((e) => e.severity === "medium");
    warnItems.push(...mediumItems);
    
    // Warn on specific keys (even if info/low)
    const strictWarnKeys = [
      "SELL_LIMIT_PRESENT",
      "PROXY_UPGRADEABLE",
      "LP_UNLOCKED",
      "HIGH_SELL_TAX",
      "HIGH_BUY_TAX",
      "TOP_HOLDERS_CONCENTRATED",
    ];
    const strictWarnItems = evidence.filter(
      (e) => strictWarnKeys.includes(e.key) && e.severity !== "info"
    );
    warnItems.push(...strictWarnItems);
    
    // Warn if provider unavailable in strict mode
    if (hasLowCoverage) {
      warnItems.push({
        category: "contractRisk",
        key: "LOW_COVERAGE",
        severity: "medium",
        title: `Only ${availableProviders}/${totalProvidersEnabled} providers responded`,
        detail: "Some providers are unavailable - reduced confidence",
        sources: [],
        supportCount: 0,
        supportRatio: 0,
      });
    }
  } else if (mode === "degen") {
    // DEGEN MODE: Risk-tolerant policy
    
    // Only warn on high severity (except honeypot which already blocks)
    const highItems = evidence.filter((e) => e.severity === "high" && e.key !== "HONEYPOT_DETECTED");
    warnItems.push(...highItems);
    
    // For trusted tokens in degen mode: downgrade certain warnings
    if (isTrustedToken) {
      // Downgrade PROXY_UPGRADEABLE to INFO (not WARN) for trusted tokens
      const proxyItem = evidence.find((e) => e.key === "PROXY_UPGRADEABLE");
      if (proxyItem && proxyItem.severity === "medium") {
        // Don't add to warnItems - it's downgraded
      }
      
      // Downgrade LP_UNLOCKED to INFO if huge liquidity
      const lpUnlocked = evidence.find((e) => e.key === "LP_UNLOCKED");
      if (lpUnlocked && hasHugeLiquidity) {
        // Don't add to warnItems - it's downgraded
      }
    } else {
      // For non-trusted tokens: warn on LP_UNLOCKED
      const lpUnlocked = evidence.find((e) => e.key === "LP_UNLOCKED");
      if (lpUnlocked) {
        warnItems.push(lpUnlocked);
      }
    }
    
    // Warn on very high tax only (>30%)
    const highTaxItems = evidence.filter((e) => {
      if (e.key === "HIGH_SELL_TAX" || e.key === "HIGH_BUY_TAX") {
        // Extract tax value from title or value
        const taxValue = e.value ? Number(e.value) : 
          asFloat(e.title.replace(/[^0-9.]/g, "")) || 0;
        return taxValue > 30;
      }
      return false;
    });
    warnItems.push(...highTaxItems);
    
    // Warn on extreme holder concentration only (top5 >70%)
    const holderConcentration = evidence.find((e) => e.key === "TOP_HOLDERS_CONCENTRATED");
    if (holderConcentration) {
      const concentrationValue = holderConcentration.value ? Number(holderConcentration.value) : 0;
      if (concentrationValue > 70) {
        warnItems.push(holderConcentration);
      }
    }
    
    // PROXY_UPGRADEABLE: soft WARN for non-trusted, INFO for trusted (already handled above)
    if (!isTrustedToken) {
      const proxyItem = evidence.find((e) => e.key === "PROXY_UPGRADEABLE");
      if (proxyItem) {
        // In degen mode, proxy is less concerning - make it a soft warn or skip
        // For now, skip it unless severity is high
        if (proxyItem.severity === "high") {
          warnItems.push(proxyItem);
        }
      }
    }
  }

  // Dedupe warnItems by key
  const warnItemsMap = new Map<string, AggregatedEvidenceItem>();
  for (const item of warnItems) {
    if (!warnItemsMap.has(item.key)) {
      warnItemsMap.set(item.key, item);
    }
  }
  const dedupedWarnItems = Array.from(warnItemsMap.values());

  if (dedupedWarnItems.length > 0) {
    decision = "warn";
    reasons.push(...dedupedWarnItems);
  }

  return {
    mode,
    decision,
    reasons,
  };
}
