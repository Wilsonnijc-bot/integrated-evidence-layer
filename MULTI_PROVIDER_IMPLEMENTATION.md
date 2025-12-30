# Multi-Provider Implementation (v0.2)

## Overview

The `/api/scan` endpoint now supports calling 4 providers in parallel with a two-layer architecture:
1. **Raw Evidence Layer** - For auditability (stores raw payloads + hashes)
2. **Normalized Evidence Layer** - For usability (converts to shared schema)

## Architecture

### File Structure

```
lib/
  ├── types.ts              # Shared types and canonical risk IDs
  ├── hash.ts               # SHA-256 hashing for raw payloads
  ├── normalize.ts          # Convert raw provider data → EvidenceItem[]
  ├── report.ts             # Convert EvidenceItem[] → UI strings
  └── providers/
      ├── base.ts           # Base adapter interface and utilities
      ├── goplus.ts         # GoPlus Labs adapter
      ├── honeypot.ts       # Honeypot.is adapter
      ├── cyberscope.ts     # Cyberscope adapter
      ├── tokensniffer.ts   # Token Sniffer adapter
      └── index.ts          # Provider registry and evidence extraction
```

## Providers

### Currently Implemented

1. **GoPlus Labs** ✅
   - Fully implemented with normalization
   - API: `https://api.gopluslabs.io/api/v1/token_security/{chainId}`
   - Optional API key: `GOPLUS_API_KEY`

2. **Honeypot.is** ⚠️
   - Adapter created, needs API endpoint verification
   - Placeholder endpoint: `https://honeypot.is/api/v1/scan`
   - Optional API key: `HONEYPOT_API_KEY`

3. **Cyberscope** ⚠️
   - Adapter created, needs API endpoint verification
   - Placeholder endpoint: `https://api.cyberscope.io/v1/token/scan`
   - API key likely required: `CYBERSCOPE_API_KEY`

4. **Token Sniffer** ⚠️
   - Adapter created, needs API endpoint verification
   - Placeholder endpoint: `https://api.tokensniffer.com/v1/token/{address}`
   - API key likely required: `TOKENSNIFFER_API_KEY`

## API Response Format

```typescript
{
  "bundle": {
    "tokenAddress": "0x...",
    "chain": "ethereum",
    "contractRisk": ["..."],
    "liquidityEvidence": ["..."],
    "deployerReputation": ["..."],
    "behavioralSignals": ["..."],
    "providers": [ /* ProviderEvidence[] */ ]
  },
  "evidenceItems": [ /* EvidenceItem[] - normalized evidence */ ],
  "raw": {
    "records": [ /* RawProviderRecord[] - raw API responses */ ]
  },
  "metadata": {
    "schemaVersion": "0.2",
    "fetchedAt": "ISO timestamp",
    "providersAttempted": ["goplus", "honeypot", "cyberscope", "tokensniffer"],
    "providersSucceeded": ["goplus"],
    "dataSource": "real-api" | "mock-fallback"
  }
}
```

## Features

### 1. Parallel Execution
- All providers called simultaneously using `Promise.allSettled`
- Per-provider timeout: 6 seconds
- Fail-soft: continues even if some providers fail

### 2. Raw Evidence Layer
- Stores raw API responses with SHA-256 hashes
- Includes timing metadata (requestedAt, respondedAt, latencyMs)
- Raw payloads only included if `INCLUDE_RAW_PAYLOAD=true` (dev mode)

### 3. Normalized Evidence Layer
- Converts provider-specific formats to shared schema
- Uses canonical risk IDs (e.g., `HONEYPOT`, `IS_PROXY`, `BUY_TAX`)
- Merges evidence from multiple providers
- Marks items as "confirmed by multiple sources" when 2+ providers agree

### 4. Report Generation
- Generates human-readable UI strings from evidence items
- Groups by category: Contract Risk, Liquidity Evidence, Deployer Reputation, Behavioral Signals
- Scales automatically as new providers are added

## Canonical Risk IDs

### Contract
- `TRUST_LISTED`, `NOT_OPEN_SOURCE`, `IS_PROXY_UPGRADEABLE`
- `IS_MINTABLE`, `HAS_BLACKLIST`, `HONEYPOT`
- `CANNOT_SELL_ALL`, `BUY_TAX`, `SELL_TAX`, `TRANSFER_TAX`

### Liquidity
- `TOTAL_LIQUIDITY_USD`, `LP_LOCKED_PRESENT`, `LP_LOCKED_ABSENT`
- `LP_HOLDER_COUNT`, `LP_TOTAL_SUPPLY`, `TOP_POOLS`

### Deployer
- `CREATOR_ADDRESS`, `CREATOR_SUPPLY_PERCENT`, `PAST_HONEYPOT_CREATOR`

### Behavior
- `HOLDER_COUNT`, `TOP_HOLDER_CONCENTRATION`, `CEX_LISTED`, `DEX_LISTED`

## Next Steps

### To Complete Implementation

1. **Verify API Endpoints**
   - Test Honeypot.is, Cyberscope, and Token Sniffer APIs
   - Update endpoints in adapter files if needed
   - Check authentication requirements

2. **Implement Normalizers**
   - Complete `normalizeHoneypot()` in `lib/normalize.ts`
   - Complete `normalizeCyberscope()` in `lib/normalize.ts`
   - Complete `normalizeTokenSniffer()` in `lib/normalize.ts`

3. **Add Provider Evidence Extraction**
   - Update `extractProviderEvidence()` in `lib/providers/index.ts`
   - Add extraction logic for each provider

4. **Testing**
   - Test with known tokens (USDC, etc.)
   - Verify all providers are called in parallel
   - Check raw records are properly stored
   - Verify evidence merging works correctly

## Environment Variables

```bash
# Optional - GoPlus works without key
GOPLUS_API_KEY=your_key_here

# Likely required for other providers
CYBERSCOPE_API_KEY=your_key_here
TOKENSNIFFER_API_KEY=your_key_here
HONEYPOT_API_KEY=your_key_here  # Currently optional

# Dev mode - include raw payloads in response
INCLUDE_RAW_PAYLOAD=true
```

## Usage

```bash
# Start server
npm run dev

# Test endpoint
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "tokenAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "chain": "ethereum"
  }'
```

## Validation

- Token address must match: `^0x[a-fA-F0-9]{40}$`
- Supported chains: `ethereum`, `bsc`, `polygon`, `arbitrum`, `optimism`
- Invalid chain defaults to `ethereum`

