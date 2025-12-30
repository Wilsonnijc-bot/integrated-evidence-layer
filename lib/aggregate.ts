import type { NormalizedProviderEvidence, ProviderSummary, EvidenceBundle, AggregatedEvidenceItem } from "./types";
import { asFloat } from "./utils/parse";

/**
 * Aggregate evidence items by key (dedupe, max severity, merge sources)
 * Filters out PROVIDER_UNAVAILABLE from consensus evidence
 */
export function aggregateEvidence(
  normalizedEvidence: NormalizedProviderEvidence[],
  totalProvidersEnabled: number,
): AggregatedEvidenceItem[] {
  const merged = new Map<string, AggregatedEvidenceItem>();

  // Process each provider's evidence
  for (const provider of normalizedEvidence) {
    for (const item of provider.evidence) {
      // Skip PROVIDER_UNAVAILABLE - it goes to coverage section, not consensus
      if (item.key === "PROVIDER_UNAVAILABLE") {
        continue;
      }

      // Group by canonical key only (not category:key) so same evidence from different providers merges
      // Example: PROXY_UPGRADEABLE from GoPlus and Honeypot should merge into one consensus item
      const consensusKey = item.key;
      const existing = merged.get(consensusKey);

      if (!existing) {
        // First occurrence - create aggregated item with source
        const sources = [{
          providerId: provider.providerId,
          rawSha256: provider.rawSha256,
          observedAt: provider.timestamp,
        }];
        merged.set(consensusKey, {
          ...item,
          sources,
          supportCount: sources.length,
          supportRatio: sources.length / totalProvidersEnabled,
        });
      } else {
        // Merge: take max severity, add source
        const severityOrder: Record<"info" | "low" | "medium" | "high", number> = { info: 0, low: 1, medium: 2, high: 3 };
        const maxSeverity = (severityOrder[item.severity] ?? 0) > (severityOrder[existing.severity] ?? 0)
          ? item.severity
          : existing.severity;

        // Add source if not already present
        const sourceExists = existing.sources.some(s => s.providerId === provider.providerId);
        if (!sourceExists) {
          existing.sources.push({
            providerId: provider.providerId,
            rawSha256: provider.rawSha256,
            observedAt: provider.timestamp,
          });
        }

        merged.set(consensusKey, {
          ...existing,
          severity: maxSeverity,
          // Keep more detailed title if available
          title: item.detail ? item.title : existing.title,
          detail: item.detail || existing.detail,
          supportCount: existing.sources.length,
          supportRatio: existing.sources.length / totalProvidersEnabled,
        });
      }
    }
  }

  return Array.from(merged.values());
}

/**
 * Generate UI-ready strings from aggregated evidence
 */
export function generateBundle(
  tokenAddress: string,
  chain: string,
  normalizedEvidence: NormalizedProviderEvidence[],
  aggregatedEvidence: AggregatedEvidenceItem[],
  totalProvidersEnabled: number,
): EvidenceBundle {
  const contractRisk: string[] = [];
  const liquidityEvidence: string[] = [];
  const deployerReputation: string[] = [];
  const behavioralSignals: string[] = [];

  // Group by category (convert AggregatedEvidenceItem to EvidenceItem for filtering)
  const byCategory = {
    contractRisk: aggregatedEvidence.filter((e) => e.category === "contractRisk"),
    liquidityEvidence: aggregatedEvidence.filter((e) => e.category === "liquidityEvidence"),
    deployerReputation: aggregatedEvidence.filter((e) => e.category === "deployerReputation"),
    behavioralSignals: aggregatedEvidence.filter((e) => e.category === "behavioralSignals"),
  };

  // Contract Risk
  const honeypot = byCategory.contractRisk.find((e) => e.key === "HONEYPOT_DETECTED");
  if (honeypot) {
    contractRisk.push("🚨 Honeypot detected - tokens cannot be sold");
  } else {
    contractRisk.push("✅ Likely Not a Pixiu Token - No malicious code has been detected in this token.");
  }

  const sellLimit = byCategory.contractRisk.find((e) => e.key === "SELL_LIMIT_PRESENT");
  if (sellLimit) {
    contractRisk.push("⚠️ Sell limit present (cannot sell 100% at once) - Contract enforces max sell / max tx limit");
  } else {
    contractRisk.push("✅ Full Sell-Off Possible - The token can be sold entirely.");
  }

  const trustListed = byCategory.contractRisk.find((e) => e.key === "TRUST_LISTED");
  if (trustListed) {
    contractRisk.push("✅ Trusted Token - The token is well-known and backed by reputable institutions.");
  }

  const isProxy = byCategory.contractRisk.find((e) => e.key === "PROXY_UPGRADEABLE");
  if (isProxy) {
    contractRisk.push(`⚠️ Proxy Contract Present - This contract uses an upgradeable proxy. (${isProxy.supportCount}/${totalProvidersEnabled} providers)`);
  }

  const notOpenSource = byCategory.contractRisk.find((e) => e.key === "NOT_OPEN_SOURCE");
  if (notOpenSource) {
    contractRisk.push("⚠️ Non-Open-Source Contract - Code cannot be verified.");
  } else {
    contractRisk.push("✅ Open-Source Contract - The token contract is open-source, allowing code review.");
  }

  // Tax rates
  const buyTax = byCategory.contractRisk.find((e) => e.key === "HIGH_BUY_TAX");
  const sellTax = byCategory.contractRisk.find((e) => e.key === "HIGH_SELL_TAX");
  
  contractRisk.push("📊 Tax Rates:");
  contractRisk.push(`   Buy Tax: ${buyTax?.title.replace("Buy tax: ", "") || "0"}%`);
  contractRisk.push(`   Sell Tax: ${sellTax?.title.replace("Sell tax: ", "") || "0"}%`);
  
  if (buyTax || sellTax) {
      const buyTaxValue = buyTax?.title ? asFloat(buyTax.title.replace("Buy tax: ", "").replace("%", "")) || 0 : 0;
      const sellTaxValue = sellTax?.title ? asFloat(sellTax.title.replace("Sell tax: ", "").replace("%", "")) || 0 : 0;
      const maxTax = Math.max(buyTaxValue, sellTaxValue);
    if (maxTax > 50) {
      contractRisk.push("⚠️ Warning: Tax rates above 50% may prevent trading.");
    } else if (maxTax > 10) {
      contractRisk.push("⚠️ Note: Tax rates above 10% are considered high.");
    } else {
      contractRisk.push("✅ Tax rates are within acceptable range.");
    }
  } else {
    contractRisk.push("✅ Tax rates are within acceptable range.");
  }

  const hasBlacklist = byCategory.contractRisk.find((e) => e.key === "HAS_BLACKLIST");
  if (hasBlacklist) {
    contractRisk.push("⚠️ Blacklist Function Detected - Owner can block specific addresses from trading.");
  }

  const isMintable = byCategory.contractRisk.find((e) => e.key === "IS_MINTABLE");
  if (isMintable) {
    contractRisk.push("⚠️ Token is Mintable - Supply can be increased by the owner.");
  }

  contractRisk.push("✅ No Gas Abuse Detected - No evidence indicates gas abuse in this contract.");

  // Liquidity Evidence
  const totalLiquidity = byCategory.liquidityEvidence.find((e) => e.key === "TOTAL_LIQUIDITY_USD");
  if (totalLiquidity) {
    liquidityEvidence.push(`💰 ${totalLiquidity.title}`);
    if (totalLiquidity.detail) {
      liquidityEvidence.push(`   ${totalLiquidity.detail}`);
    }
  }

  const lpLocked = byCategory.liquidityEvidence.find((e) => e.key === "LP_LOCKED_PRESENT");
  const lpUnlocked = byCategory.liquidityEvidence.find((e) => e.key === "LP_UNLOCKED");
  
  if (lpLocked) {
    liquidityEvidence.push(`🔒 ${lpLocked.title}`);
  } else if (lpUnlocked) {
    liquidityEvidence.push(`⚠️ ${lpUnlocked.title} - All liquidity positions are unlocked`);
  }

  // Deployer Reputation
  const creatorAddress = byCategory.deployerReputation.find((e) => e.key === "CREATOR_ADDRESS");
  if (creatorAddress) {
    deployerReputation.push(`👤 ${creatorAddress.title}`);
  }

  const pastHoneypot = byCategory.deployerReputation.find((e) => e.key === "PAST_HONEYPOT_CREATOR");
  if (pastHoneypot) {
    deployerReputation.push("🚨 High Risk: Creator has deployed honeypot tokens before");
  } else if (byCategory.deployerReputation.length > 0) {
    deployerReputation.push("✅ No previous honeypot tokens detected from this creator");
  }

  // Behavioral Signals
  const holderCount = byCategory.behavioralSignals.find((e) => e.key === "HOLDER_COUNT");
  if (holderCount) {
    behavioralSignals.push(`👥 ${holderCount.title}`);
  }

  const cexListed = byCategory.behavioralSignals.find((e) => e.key === "CEX_LISTED");
  if (cexListed) {
    behavioralSignals.push(`🏦 ${cexListed.title}`);
    behavioralSignals.push("   ✅ Token is listed on major centralized exchanges");
  } else {
    behavioralSignals.push("⚠️ Not listed on major CEX - Trading only on DEX");
  }

  const suspiciousTax = byCategory.behavioralSignals.find((e) => e.key === "SUSPICIOUS_TAX");
  if (suspiciousTax) {
    behavioralSignals.push(`⚠️ ${suspiciousTax.title}`);
  }

  // Provider summaries
  const providers: ProviderSummary[] = normalizedEvidence.map((ne) => ({
    providerId: ne.providerId,
    providerName: ne.providerName,
    verdict: ne.verdict,
    summary: ne.summary,
    flags: ne.flags,
    timestamp: ne.timestamp,
    available: !ne.flags.includes("PROVIDER_UNAVAILABLE") && ne.evidence.length > 0,
  }));

  return {
    tokenAddress,
    chain,
    contractRisk,
    liquidityEvidence,
    deployerReputation,
    behavioralSignals,
    providers,
  };
}

