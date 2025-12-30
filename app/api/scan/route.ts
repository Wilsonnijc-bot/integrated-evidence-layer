import { NextResponse } from "next/server";
import { activeProviders } from "../../../lib/providers";
import { aggregateEvidence, generateBundle } from "../../../lib/aggregate";
import { hashBundle, signBundle } from "../../../lib/sign";
import { evaluatePolicy } from "../../../lib/policy";
import { detectProxy } from "../../../lib/firstparty/proxy";
import { extractGoPlusForensics } from "../../../lib/forensics/goplus";
import type { ScanResponse, ScanInput, RawMetadata, Attestation, RawProviderResult, NormalizedProviderEvidence } from "../../../lib/types";
import { SUPPORTED_CHAINS } from "../../../lib/types";

// Token address validation regex
const TOKEN_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export async function POST(request: Request) {
  // Disable caching
  const headers = new Headers();
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");

  const body = await request.json();
  const tokenAddress = body.tokenAddress?.trim();
  let chain = body.chain ?? "ethereum";
  const policyMode = (body.policyMode as "strict" | "degen") || "strict";

  // Validation
  if (!tokenAddress) {
    return NextResponse.json(
      { error: "tokenAddress is required" },
      { status: 400, headers },
    );
  }

  if (!TOKEN_ADDRESS_REGEX.test(tokenAddress)) {
    return NextResponse.json(
      { error: "tokenAddress must be a valid Ethereum address (0x followed by 40 hex characters)" },
      { status: 400, headers },
    );
  }

  if (!SUPPORTED_CHAINS.includes(chain)) {
    chain = "ethereum"; // Default to ethereum if unsupported
  }

  const fetchedAt = new Date().toISOString();
  const input: ScanInput = { chain, tokenAddress };

  console.log(`[${fetchedAt}] API Request: Fetching data for ${tokenAddress} on ${chain}`);

  // Call all active providers in parallel
  const providerPromises = activeProviders
    .filter((p) => p.supports(chain))
    .map((provider) =>
      provider
        .fetchRaw(input)
        .then((raw) => ({
          raw,
          normalized: provider.normalize(raw, input),
        }))
        .catch((error) => {
          // Create error result - ensure it never crashes
          const errorRaw: RawProviderResult = {
            providerId: provider.id,
            providerName: provider.name,
            fetchedAt: new Date().toISOString(),
            request: { url: "", method: "GET" as const },
            httpStatus: 0,
            raw: null,
            rawSha256: "",
            error: error instanceof Error ? error.message : String(error),
          };
          return {
            raw: errorRaw,
            normalized: provider.normalize(errorRaw, input),
          };
        }),
    );

  const results = await Promise.allSettled(providerPromises);
  const successful: Array<{ raw: RawProviderResult; normalized: NormalizedProviderEvidence }> = [];
  const failed: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successful.push(result.value);
    } else {
      failed.push(activeProviders[index]?.id || "unknown");
    }
  });

  console.log(`[${fetchedAt}] Providers: ${successful.length} succeeded, ${failed.length} failed`);

  // Extract raw results and normalized evidence
  const rawResults = successful.map((s) => s.raw);
  const normalizedEvidence = successful.map((s) => s.normalized);

  // Add first-party evidence (proxy detection)
  const firstPartyEvidence = await detectProxy(input);
  if (firstPartyEvidence) {
    // Add first-party evidence to a synthetic provider entry
    normalizedEvidence.push({
      providerId: "firstparty",
      providerName: "First-Party Analysis",
      verdict: firstPartyEvidence.severity === "high" ? "high" : firstPartyEvidence.severity === "medium" ? "medium" : "low",
      summary: firstPartyEvidence.title,
      flags: [firstPartyEvidence.key],
      timestamp: fetchedAt,
      evidence: [firstPartyEvidence],
      rawSha256: "", // First-party doesn't have raw API response
    });
  }

  // Count total providers enabled (for support ratio calculation)
  const totalProvidersEnabled = activeProviders.filter((p) => p.supports(chain)).length;

  // Aggregate all evidence items (with sources) - filters out PROVIDER_UNAVAILABLE
  const aggregatedEvidence = aggregateEvidence(normalizedEvidence, totalProvidersEnabled);

  // Generate bundle
  const bundle = generateBundle(tokenAddress, chain, normalizedEvidence, aggregatedEvidence, totalProvidersEnabled);

  // Evaluate policy (includes coverage check)
  const policy = evaluatePolicy(aggregatedEvidence, normalizedEvidence, totalProvidersEnabled, policyMode);

  // Create raw metadata (minimal for auditability)
  const rawMeta: RawMetadata[] = rawResults.map((r) => ({
    providerId: r.providerId,
    providerName: r.providerName,
    fetchedAt: r.fetchedAt,
    httpStatus: r.httpStatus,
    rawSha256: r.rawSha256,
  }));

  // Sign bundle
  const bundleSha256 = hashBundle(bundle, rawMeta);
  const { signature, publicKeyId } = signBundle(bundleSha256);
  const attestation: Attestation = {
    bundleSha256,
    signature,
    publicKeyId,
    signedAt: fetchedAt,
  };

  // Extract GoPlus forensics (if available)
  const goplusRaw = rawResults.find((r) => r.providerId === "goplus");
  const goplusForensics = goplusRaw ? extractGoPlusForensics(goplusRaw, tokenAddress) : null;

  // Build response
  const response: ScanResponse = {
    bundle,
    evidence: aggregatedEvidence,
    raw: rawMeta,
    policy,
    attestation,
    forensics: goplusForensics ? { goplus: goplusForensics } : undefined,
    metadata: {
      schemaVersion: "0.3",
      fetchedAt,
      providersAttempted: activeProviders.map((p) => p.id),
      providersSucceeded: successful.map((s) => s.raw.providerId),
    },
  };

  console.log(`[${fetchedAt}] Response: ${successful.length} provider(s) succeeded, policy: ${policy.decision}`);

  return NextResponse.json(response, { headers });
}
