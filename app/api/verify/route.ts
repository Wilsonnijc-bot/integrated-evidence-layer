import { NextResponse } from "next/server";
import { verifySignature, hashBundle } from "../../../lib/sign";
import type { EvidenceBundle, RawMetadata, Attestation } from "../../../lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bundleSha256 = searchParams.get("bundleSha256");
  const signature = searchParams.get("signature");
  const publicKeyId = searchParams.get("publicKeyId");
  const signedAt = searchParams.get("signedAt");

  if (!bundleSha256 || !signature || !publicKeyId || !signedAt) {
    return NextResponse.json(
      { error: "Missing required parameters: bundleSha256, signature, publicKeyId, signedAt" },
      { status: 400 },
    );
  }

  const isValid = verifySignature(bundleSha256, signature, publicKeyId, signedAt);

  return NextResponse.json({
    valid: isValid,
    bundleSha256,
    verifiedAt: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { bundle, raw, attestation } = body as {
    bundle: EvidenceBundle;
    raw: RawMetadata[];
    attestation: Attestation;
  };

  if (!bundle || !raw || !attestation) {
    return NextResponse.json(
      { error: "Missing required fields: bundle, raw, attestation" },
      { status: 400 },
    );
  }

  // Recompute bundle hash
  const computedHash = hashBundle(bundle, raw);

  // Verify signature
  const isValid = verifySignature(
    attestation.bundleSha256,
    attestation.signature,
    attestation.publicKeyId,
    attestation.signedAt,
  );

  // Verify hash matches
  const hashMatches = computedHash === attestation.bundleSha256;

  return NextResponse.json({
    valid: isValid && hashMatches,
    bundleSha256: computedHash,
    hashMatches,
    signatureValid: isValid,
    verifiedAt: new Date().toISOString(),
  });
}

