// Shared types for the evidence layer (MVP Architecture)

export type ScanInput = {
  chain: string;
  tokenAddress: string;
};

export type RawProviderResult = {
  providerId: string;
  providerName: string;
  fetchedAt: string;
  request: { url: string; method: "GET" | "POST" };
  httpStatus: number;
  raw: unknown;
  rawSha256: string;
  error?: string;
};

export type EvidenceItem = {
  category: "contractRisk" | "liquidityEvidence" | "deployerReputation" | "behavioralSignals";
  key: string;
  severity: "info" | "low" | "medium" | "high";
  title: string;
  detail?: string;
  value?: string | number;
};

export type AggregatedEvidenceItem = EvidenceItem & {
  sources: Array<{ providerId: string; rawSha256: string; observedAt: string }>;
  supportCount: number; // Number of providers supporting this evidence
  supportRatio: number; // supportCount / totalProvidersEnabled
};

export type NormalizedProviderEvidence = {
  providerId: string;
  providerName: string;
  verdict: "low" | "medium" | "high";
  summary: string;
  flags: string[];
  timestamp: string;
  evidence: EvidenceItem[];
  rawSha256: string;
};

export type ProviderAdapter = {
  id: string;
  name: string;
  supports: (chain: string) => boolean;
  fetchRaw: (input: ScanInput) => Promise<RawProviderResult>;
  normalize: (raw: RawProviderResult, input: ScanInput) => NormalizedProviderEvidence;
};

// Aggregated bundle for UI
export type EvidenceBundle = {
  tokenAddress: string;
  chain: string;
  contractRisk: string[];
  liquidityEvidence: string[];
  deployerReputation: string[];
  behavioralSignals: string[];
  providers: ProviderSummary[];
};

export type ProviderSummary = {
  providerId: string;
  providerName: string;
  verdict: "low" | "medium" | "high";
  summary: string;
  flags: string[];
  timestamp: string;
  available: boolean; // Whether provider returned data
};

// Policy engine types
export type PolicyMode = "strict" | "degen";

export type PolicyDecision = {
  mode: PolicyMode;
  decision: "allow" | "warn" | "block";
  reasons: AggregatedEvidenceItem[];
};

// Attestation (bundle signing)
export type Attestation = {
  bundleSha256: string;
  signature: string; // base64
  publicKeyId: string;
  signedAt: string;
};

// Raw metadata for auditability
export type RawMetadata = {
  providerId: string;
  providerName: string;
  fetchedAt: string;
  httpStatus: number;
  rawSha256: string;
};

// GoPlus Forensics (deep-dive data)
export type GoPlusForensics = {
  token: {
    address: string;
    name?: string;
    symbol?: string;
    decimals?: number;
    totalSupply?: string | number;
    holderCount?: number;
  };
  holders: {
    top10Percent?: number; // e.g. 27.0
    topHolders: Array<{
      address: string;
      balance?: string | number;
      percent?: number;
    }>; // top 10 only
  };
  creatorOwner: {
    creatorAddress?: string;
    creatorBalance?: string | number;
    creatorPercent?: number;
    ownerAddress?: string;
    ownerBalance?: string | number;
    ownerPercent?: number;
  };
  dexPools: {
    totalLiquidityUsd?: number;
    poolCount?: number;
    topPools: Array<{
      dexName?: string;
      pairAddress?: string;
      liquidityUsd?: number;
    }>; // top 5 only
  };
  lpLocks: {
    lpHolderCount?: number;
    lockedRatio?: number; // 0–100
    topLpHolders: Array<{
      address: string;
      percent?: number;
      isLocked?: boolean;
      lockInfo?: string; // optional display string
    }>; // top 10 only
  };
};

// API Response
export type ScanResponse = {
  bundle: EvidenceBundle;
  evidence: AggregatedEvidenceItem[]; // Aggregated evidence items with sources
  raw: RawMetadata[]; // Minimal raw metadata
  policy: PolicyDecision;
  attestation: Attestation;
  forensics?: {
    goplus?: GoPlusForensics;
  };
  metadata: {
    schemaVersion: string;
    fetchedAt: string;
    providersAttempted: string[];
    providersSucceeded: string[];
  };
};

// Supported chains
export const SUPPORTED_CHAINS = ["ethereum", "bsc", "polygon", "arbitrum", "optimism"] as const;
export type SupportedChain = typeof SUPPORTED_CHAINS[number];
