import type { GoPlusForensics, RawProviderResult } from "../types";
import { asInteger, asFloat } from "../utils/parse";

/**
 * Extract GoPlus forensics data from raw provider result
 */
export function extractGoPlusForensics(
  raw: RawProviderResult,
  tokenAddress: string,
): GoPlusForensics | null {
  if (!raw.raw || raw.error || raw.providerId !== "goplus") {
    return null;
  }

  // GoPlus API response structure (partial, we only access what we need)
  interface GoPlusResponse {
    code: number;
    result?: Record<string, GoPlusTokenData>;
  }
  interface GoPlusTokenData {
    token_name?: string;
    token_symbol?: string;
    decimals?: string | number;
    total_supply?: string | number;
    holder_count?: string | number;
    holders?: Array<{ address?: string; balance?: string | number; percent?: string | number }>;
    top10_holder_percent?: string | number;
    creator_address?: string;
    creator_balance?: string | number;
    creator_percent?: string | number;
    owner_address?: string;
    owner_balance?: string | number;
    owner_percent?: string | number;
    dex?: Array<{ dex_name?: string; name?: string; pair?: string; liquidity?: string | number }>;
    lp_holders?: Array<{ address?: string; percent?: string | number; is_locked?: number | string; lock_info?: string; lock_time?: string }>;
    lp_holder_count?: string | number;
  }
  const payload = raw.raw as GoPlusResponse;
  if (payload.code !== 1 || !payload.result) {
    return null;
  }

  const tokenAddressLower = tokenAddress.toLowerCase();
  const tokenData = payload.result[tokenAddressLower] || payload.result[tokenAddress];
  if (!tokenData) {
    return null;
  }

  // Extract token info
  const token = {
    address: tokenAddress,
    name: tokenData.token_name,
    symbol: tokenData.token_symbol,
    decimals: asInteger(tokenData.decimals),
    totalSupply: tokenData.total_supply,
    holderCount: asInteger(tokenData.holder_count),
  };

  // Extract holders
  const holders: GoPlusForensics["holders"] = {
    topHolders: [],
  };

  if (tokenData.holders && Array.isArray(tokenData.holders)) {
    // Take top 10 holders
    const top10 = tokenData.holders.slice(0, 10).map((h: { address?: string; balance?: string | number; percent?: string | number }) => ({
      address: h.address || "",
      balance: h.balance,
      percent: asFloat(h.percent),
    }));
    holders.topHolders = top10;

    // Calculate top10Percent
    const top10PercentSum = top10.reduce((sum: number, h: { address: string; balance?: string | number; percent?: number }) => sum + (h.percent || 0), 0);
    if (top10PercentSum > 0) {
      holders.top10Percent = top10PercentSum;
    } else {
      const top10Percent = asFloat(tokenData.top10_holder_percent);
      if (top10Percent !== undefined) {
        holders.top10Percent = top10Percent;
      }
    }
  }

  // Extract creator/owner
  const creatorOwner: GoPlusForensics["creatorOwner"] = {};
  if (tokenData.creator_address) {
    creatorOwner.creatorAddress = tokenData.creator_address;
    if (tokenData.creator_balance) {
      creatorOwner.creatorBalance = tokenData.creator_balance;
    }
    const creatorPercent = asFloat(tokenData.creator_percent);
    if (creatorPercent !== undefined) {
      creatorOwner.creatorPercent = creatorPercent;
    }
  }
  if (tokenData.owner_address) {
    creatorOwner.ownerAddress = tokenData.owner_address;
    if (tokenData.owner_balance) {
      creatorOwner.ownerBalance = tokenData.owner_balance;
    }
    const ownerPercent = asFloat(tokenData.owner_percent);
    if (ownerPercent !== undefined) {
      creatorOwner.ownerPercent = ownerPercent;
    }
  }

  // Extract DEX pools
  const dexPools: GoPlusForensics["dexPools"] = {
    topPools: [],
  };
  if (tokenData.dex && Array.isArray(tokenData.dex)) {
    // Calculate total liquidity (in USD, GoPlus returns in wei-like units, divide by 1e6 for millions)
    const totalLiquidity = tokenData.dex.reduce((sum: number, dex: { liquidity?: string | number }) => {
      return sum + (asFloat(dex.liquidity) || 0);
    }, 0);
    if (totalLiquidity > 0) {
      dexPools.totalLiquidityUsd = totalLiquidity / 1e6; // Convert to millions
    }
    dexPools.poolCount = tokenData.dex.length;

    // Sort by liquidity and take top 5
    const sortedPools = [...tokenData.dex]
      .sort((a: { liquidity?: string | number }, b: { liquidity?: string | number }) => 
        (asFloat(b.liquidity) || 0) - (asFloat(a.liquidity) || 0))
      .slice(0, 5)
      .map((dex: { dex_name?: string; name?: string; pair?: string; liquidity?: string | number }) => ({
        dexName: dex.dex_name || dex.name,
        pairAddress: dex.pair,
        liquidityUsd: asFloat(dex.liquidity) ? (asFloat(dex.liquidity)! / 1e6) : undefined,
      }));
    dexPools.topPools = sortedPools;
  }

  // Extract LP locks
  const lpLocks: GoPlusForensics["lpLocks"] = {
    topLpHolders: [],
    lockedRatio: 0,
  };
  if (tokenData.lp_holders && Array.isArray(tokenData.lp_holders)) {
    lpLocks.lpHolderCount = tokenData.lp_holders.length;

    // Calculate locked ratio
    let totalLpPercent = 0;
    let lockedLpPercent = 0;

    const top10LpHolders = tokenData.lp_holders
      .slice(0, 10)
      .map((lp: { address?: string; percent?: string | number; is_locked?: number | string; lock_info?: string; lock_time?: string }) => {
        const percent = asFloat(lp.percent) || 0;
        totalLpPercent += percent;
        if (lp.is_locked === 1 || lp.is_locked === "1") {
          lockedLpPercent += percent;
        }
        return {
          address: lp.address || "",
          percent: percent > 0 ? percent : undefined,
          isLocked: lp.is_locked === 1 || lp.is_locked === "1",
          lockInfo: lp.lock_info || lp.lock_time || undefined,
        };
      });

    lpLocks.topLpHolders = top10LpHolders;

    // Calculate locked ratio
    if (totalLpPercent > 0) {
      lpLocks.lockedRatio = (lockedLpPercent / totalLpPercent) * 100;
    } else {
      // Fallback: count locked vs total
      const lockedCount = tokenData.lp_holders.filter(
        (lp: { is_locked?: number | string }) => lp.is_locked === 1 || lp.is_locked === "1",
      ).length;
      if (tokenData.lp_holders.length > 0) {
        lpLocks.lockedRatio = (lockedCount / tokenData.lp_holders.length) * 100;
      }
    }
  } else if (tokenData.lp_holder_count) {
    const lpHolderCount = asInteger(tokenData.lp_holder_count);
    if (lpHolderCount !== undefined) {
      lpLocks.lpHolderCount = lpHolderCount;
    }
  }

  return {
    token,
    holders,
    creatorOwner,
    dexPools,
    lpLocks,
  };
}

