# Evidence Layer Upgrade Summary

## ✅ Completed Features

### 1. Reliability (Honeypot Provider)
- ✅ Honeypot provider now returns valid evidence even on failure
- ✅ Returns `PROVIDER_UNAVAILABLE` evidence item with verdict "medium"
- ✅ Never crashes - always returns structured evidence

### 2. Raw Evidence Layer
- ✅ Raw metadata in API response: `providerId`, `providerName`, `fetchedAt`, `httpStatus`, `rawSha256`
- ✅ SHA-256 hashes computed for all raw payloads
- ✅ Minimal raw metadata array in response

### 3. Bundle Signing
- ✅ Bundle SHA-256 hash computation
- ✅ Server-side signing (HMAC-based for MVP, ready for ed25519)
- ✅ Attestation object with `bundleSha256`, `signature`, `publicKeyId`, `signedAt`
- ✅ `/api/verify` endpoint for signature verification

### 4. Normalized Evidence Schema
- ✅ Evidence items with stable taxonomy keys
- ✅ Categories: `contractRisk`, `liquidityEvidence`, `deployerReputation`, `behavioralSignals`
- ✅ Severity levels: `info`, `low`, `medium`, `high`
- ✅ All required taxonomy keys implemented

### 5. Aggregated Consensus View
- ✅ Evidence items deduped by `(category, key)`
- ✅ Max severity taken when duplicates exist
- ✅ Sources array tracking: `{ providerId, rawSha256, observedAt }`
- ✅ `AggregatedEvidenceItem` type with sources

### 6. Policy Engine
- ✅ Strict mode: blocks on `HONEYPOT_DETECTED`/`CANNOT_SELL`, warns on `PROXY_UPGRADEABLE`/`LP_UNLOCKED`
- ✅ Degen mode: only blocks on critical items, warns on high severity
- ✅ Policy decision: `allow` | `warn` | `block`
- ✅ Policy reasons: array of evidence items that triggered decision

### 7. First-Party Evidence
- ✅ Proxy detection (EIP-1967 storage slot check) for Ethereum
- ✅ Holder concentration stub (ready for implementation)
- ✅ First-party evidence added as separate provider entry

### 8. API Response Structure
- ✅ `bundle`: UI-ready strings
- ✅ `evidence`: Aggregated evidence items with sources
- ✅ `raw`: Minimal raw metadata
- ✅ `policy`: Policy decision and reasons
- ✅ `attestation`: Bundle signature
- ✅ `metadata`: Schema version, timestamps, provider status

## 📝 Next Steps (UI Updates)

The backend is complete. The UI needs to be updated to show:
1. Policy toggle (strict/degen)
2. Policy decision display (allow/warn/block)
3. Consensus evidence with source counts
4. Provider availability status
5. Attestation verification info

## 🔧 Files Created/Modified

**New Files:**
- `lib/sign.ts` - Bundle signing and verification
- `lib/policy.ts` - Policy engine
- `lib/firstparty/proxy.ts` - First-party proxy detection
- `lib/firstparty/holders.ts` - Holder concentration (stub)
- `app/api/verify/route.ts` - Signature verification endpoint

**Modified Files:**
- `lib/types.ts` - Added new types (AggregatedEvidenceItem, PolicyDecision, Attestation, RawMetadata)
- `lib/providers/honeypot.ts` - Never crashes, returns valid evidence on failure
- `lib/providers/base.ts` - Always computes rawSha256
- `lib/aggregate.ts` - Added sources tracking to aggregated evidence
- `app/api/scan/route.ts` - Complete rewrite with all new features

## 🎯 Acceptance Criteria Status

- ✅ `/api/scan` returns providers[] with evidence items + rawSha256
- ✅ `/api/scan` returns raw[] metadata list
- ✅ `/api/scan` returns aggregated consensus evidence with sources
- ✅ `/api/scan` returns policy decision output
- ✅ `/api/scan` returns attestation (bundle signature)
- ⏳ UI shows "Consensus evidence" section (needs UI update)
- ⏳ UI shows provider cards with status (needs UI update)
- ⏳ UI shows policy toggle + allow/warn/block (needs UI update)
- ✅ Honeypot failures do not crash UI (backend fixed)

