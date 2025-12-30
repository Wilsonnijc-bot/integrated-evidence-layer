import type { GoPlusForensics, RawProviderResult } from "../types";

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

  const payload = raw.raw as any;
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
    decimals: tokenData.decimals ? parseInt(tokenData.decimals) : undefined,
    totalSupply: tokenData.total_supply,
    holderCount: tokenData.holder_count ? parseInt(tokenData.holder_count) : undefined,
  };

  // Extract holders
  const holders: GoPlusForensics["holders"] = {
    topHolders: [],
  };

  if (tokenData.holders && Array.isArray(tokenData.holders)) {
    // Take top 10 holders
    const top10 = tokenData.holders.slice(0, 10).map((h: any) => ({
      address: h.address || "",
      balance: h.balance,
      percent: h.percent ? parseFloat(h.percent) : undefined,
    }));
    holders.topHolders = top10;

    // Calculate top10Percent
    const top10PercentSum = top10.reduce((sum: number, h) => sum + (h.percent || 0), 0);
    if (top10PercentSum > 0) {
      holders.top10Percent = top10PercentSum;
    } else if (tokenData.top10_holder_percent) {
      holders.top10Percent = parseFloat(tokenData.top10_holder_percent);
    }
  }

  // Extract creator/owner
  const creatorOwner: GoPlusForensics["creatorOwner"] = {};
  if (tokenData.creator_address) {
    creatorOwner.creatorAddress = tokenData.creator_address;
    if (tokenData.creator_balance) {
      creatorOwner.creatorBalance = tokenData.creator_balance;
    }
    if (tokenData.creator_percent) {
      creatorOwner.creatorPercent = parseFloat(tokenData.creator_percent);
    }
  }
  if (tokenData.owner_address) {
    creatorOwner.ownerAddress = tokenData.owner_address;
    if (tokenData.owner_balance) {
      creatorOwner.ownerBalance = tokenData.owner_balance;
    }
    if (tokenData.owner_percent) {
      creatorOwner.ownerPercent = parseFloat(tokenData.owner_percent);
    }
  }

  // Extract DEX pools
  const dexPools: GoPlusForensics["dexPools"] = {
    topPools: [],
  };
  if (tokenData.dex && Array.isArray(tokenData.dex)) {
    // Calculate total liquidity (in USD, GoPlus returns in wei-like units, divide by 1e6 for millions)
    const totalLiquidity = tokenData.dex.reduce((sum: number, dex: any) => {
      return sum + parseFloat(dex.liquidity || "0");
    }, 0);
    if (totalLiquidity > 0) {
      dexPools.totalLiquidityUsd = totalLiquidity / 1e6; // Convert to millions
    }
    dexPools.poolCount = tokenData.dex.length;

    // Sort by liquidity and take top 5
    const sortedPools = [...tokenData.dex]
      .sort((a: any, b: any) => parseFloat(b.liquidity || "0") - parseFloat(a.liquidity || "0"))
      .slice(0, 5)
      .map((dex: any) => ({
        dexName: dex.dex_name || dex.name,
        pairAddress: dex.pair,
        liquidityUsd: dex.liquidity ? parseFloat(dex.liquidity) / 1e6 : undefined,
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
      .map((lp: any) => {
        const percent = lp.percent ? parseFloat(lp.percent) : 0;
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
        (lp: any) => lp.is_locked === 1 || lp.is_locked === "1",
      ).length;
      if (tokenData.lp_holders.length > 0) {
        lpLocks.lockedRatio = (lockedCount / tokenData.lp_holders.length) * 100;
      }
    }
  } else if (tokenData.lp_holder_count) {
    lpLocks.lpHolderCount = parseInt(tokenData.lp_holder_count);
  }

  return {
    token,
    holders,
    creatorOwner,
    dexPools,
    lpLocks,
  };
}

