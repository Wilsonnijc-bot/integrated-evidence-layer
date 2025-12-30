// This file contains the reordered results section
// Order: Policy → Coverage → Consensus → Categories → Providers → Attestation

import type {
  PolicyDecision,
  EvidenceBundle,
  AggregatedEvidenceItem,
  ScanResponse,
} from "../lib/types";

export const ResultsSection = ({
  policy,
  bundle,
  evidence,
  metadata,
  attestation,
  rawMeta,
}: {
  policy: PolicyDecision | null;
  bundle: EvidenceBundle | null;
  evidence: AggregatedEvidenceItem[];
  metadata: ScanResponse["metadata"] | null;
  attestation: ScanResponse["attestation"] | null;
  rawMeta: ScanResponse["raw"];
}) => {
  if (!bundle || !metadata) return null;

  // Calculate coverage
  const availableProviders = bundle.providers.filter((p) => p.available).length;
  const totalProviders = metadata.providersAttempted?.length || 0;
  const unavailableProviders = bundle.providers.filter((p) => !p.available);

  // Group evidence by category
  const byCategory = {
    contractRisk: evidence.filter((e) => e.category === "contractRisk"),
    liquidityEvidence: evidence.filter((e) => e.category === "liquidityEvidence"),
    deployerReputation: evidence.filter((e) => e.category === "deployerReputation"),
    behavioralSignals: evidence.filter((e) => e.category === "behavioralSignals"),
  };

  return (
    <>
      {/* 1. Policy Decision */}
      {policy && (
        <div className="mt-6 rounded-xl border border-white/10 bg-black/50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-200">
              Policy Decision
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              policy.decision === "block"
                ? "bg-red-500/20 text-red-200"
                : policy.decision === "warn"
                  ? "bg-orange-500/20 text-orange-200"
                  : "bg-emerald-500/20 text-emerald-200"
            }`}>
              {policy.decision.toUpperCase()}
            </span>
          </div>
          <div className="text-xs text-zinc-400">
            Mode: <span className="font-semibold text-zinc-300">{policy.mode}</span>
            {policy.reasons.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="font-semibold text-zinc-300">Reasons:</div>
                {policy.reasons.map((r, i) => (
                  <div key={i} className="pl-2">• {r.title}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Coverage / Confidence */}
      <div className="mt-6 rounded-xl border border-white/10 bg-black/50 p-5">
        <div className="mb-3 font-semibold text-zinc-200">
          Coverage / Confidence
        </div>
        <div className="text-sm text-zinc-300">
          <div className="mb-2">
            <span className="font-semibold">{availableProviders}/{totalProviders}</span> providers responded
            {unavailableProviders.length > 0 && (
              <div className="mt-2 space-y-1 text-xs text-zinc-400">
                <div className="font-semibold text-zinc-300">Unavailable providers:</div>
                {unavailableProviders.map((p) => (
                  <div key={p.providerId} className="pl-2">
                    • {p.providerName}: {p.summary}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Consensus Evidence (Main Section) */}
      {evidence.length > 0 && (
        <div className="mt-6 rounded-xl border border-white/10 bg-black/50 p-5">
          <div className="mb-4 border-b border-white/5 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-zinc-200">
                Consensus Evidence
              </span>
              <span className="text-xs text-zinc-400">
                {evidence.length} evidence item{evidence.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {evidence.map((item, i) => (
              <div
                key={i}
                className="rounded-lg border border-white/10 bg-zinc-900/50 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-200">
                    {item.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      {item.supportCount}/{totalProviders} ({Math.round(item.supportRatio * 100)}%)
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                        item.severity === "high"
                          ? "bg-red-500/20 text-red-200"
                          : item.severity === "medium"
                            ? "bg-orange-500/20 text-orange-200"
                            : item.severity === "low"
                              ? "bg-yellow-500/20 text-yellow-200"
                              : "bg-blue-500/20 text-blue-200"
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>
                </div>
                {item.detail && (
                  <p className="mb-2 text-xs text-zinc-400">{item.detail}</p>
                )}
                <div className="text-[10px] text-zinc-500">
                  Sources: {item.sources.map(s => s.providerId).join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Evidence by Category */}
      <div className="mt-6 rounded-xl border border-white/10 bg-black/50 p-5">
        <div className="mb-4 border-b border-white/5 pb-3">
          <span className="text-lg font-semibold text-zinc-200">
            Evidence by Category
          </span>
        </div>
        <div className="grid gap-4 text-sm text-zinc-300">
          {byCategory.contractRisk.length > 0 && (
            <div>
              <div className="mb-2 font-semibold text-zinc-200">
                Contract Risk ({byCategory.contractRisk.length})
              </div>
              <ul className="space-y-1 pl-4 text-sm text-zinc-300">
                {byCategory.contractRisk.map((item, i) => (
                  <li key={i} className="list-disc">
                    {item.title} ({item.supportCount}/{totalProviders} providers)
                  </li>
                ))}
              </ul>
            </div>
          )}
          {byCategory.liquidityEvidence.length > 0 && (
            <div>
              <div className="mb-2 font-semibold text-zinc-200">
                Liquidity Evidence ({byCategory.liquidityEvidence.length})
              </div>
              <ul className="space-y-1 pl-4 text-sm text-zinc-300">
                {byCategory.liquidityEvidence.map((item, i) => (
                  <li key={i} className="list-disc">
                    {item.title} ({item.supportCount}/{totalProviders} providers)
                  </li>
                ))}
              </ul>
            </div>
          )}
          {byCategory.deployerReputation.length > 0 && (
            <div>
              <div className="mb-2 font-semibold text-zinc-200">
                Deployer Reputation ({byCategory.deployerReputation.length})
              </div>
              <ul className="space-y-1 pl-4 text-sm text-zinc-300">
                {byCategory.deployerReputation.map((item, i) => (
                  <li key={i} className="list-disc">
                    {item.title} ({item.supportCount}/{totalProviders} providers)
                  </li>
                ))}
              </ul>
            </div>
          )}
          {byCategory.behavioralSignals.length > 0 && (
            <div>
              <div className="mb-2 font-semibold text-zinc-200">
                Behavioral Signals ({byCategory.behavioralSignals.length})
              </div>
              <ul className="space-y-1 pl-4 text-sm text-zinc-300">
                {byCategory.behavioralSignals.map((item, i) => (
                  <li key={i} className="list-disc">
                    {item.title} ({item.supportCount}/{totalProviders} providers)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 5. Provider Details */}
      <div className="mt-6 rounded-xl border border-white/10 bg-black/50 p-5">
        <div className="mb-4 border-b border-white/5 pb-3">
          <span className="text-lg font-semibold text-zinc-200">
            Provider Details
          </span>
        </div>
        <div className="space-y-3">
          {bundle.providers.map((p) => (
            <div
              key={p.providerId}
              className="rounded-lg border border-white/10 bg-zinc-900/50 p-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-200">
                    {p.providerName}
                  </span>
                  {!p.available && (
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-yellow-500/20 text-yellow-200">
                      UNAVAILABLE
                    </span>
                  )}
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                    p.verdict === "high"
                      ? "bg-red-500/20 text-red-300"
                      : p.verdict === "medium"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {p.verdict.toUpperCase()}
                </span>
              </div>
              <p className="mb-2 text-[11px] text-zinc-400">
                {p.summary}
              </p>
              {p.flags.length > 0 && (
                <ul className="space-y-0.5 pl-3 text-[11px] text-zinc-400">
                  {p.flags.slice(0, 5).map((flag, i) => (
                    <li key={i} className="list-disc">
                      {flag}
                    </li>
                  ))}
                  {p.flags.length > 5 && (
                    <li className="text-zinc-500">
                      +{p.flags.length - 5} more
                    </li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 6. Attestation + Raw Hashes */}
      {attestation && (
        <div className="mt-6 rounded-xl border border-white/10 bg-black/50 p-5">
          <div className="mb-4 border-b border-white/5 pb-3">
            <span className="text-lg font-semibold text-zinc-200">
              🔐 Attestation & Raw Hashes
            </span>
          </div>
          <div className="space-y-3 text-xs text-zinc-400">
            <div>
              <div className="mb-1 font-semibold text-zinc-300">Bundle Signature</div>
              <div className="font-mono text-[10px] space-y-1">
                <div>Hash: {attestation.bundleSha256}</div>
                <div>Signed: {new Date(attestation.signedAt).toLocaleString()}</div>
                <div>Key ID: {attestation.publicKeyId}</div>
                <div>Signature: {attestation.signature.slice(0, 32)}...</div>
              </div>
            </div>
            {rawMeta.length > 0 && (
              <div>
                <div className="mb-1 font-semibold text-zinc-300">Raw Provider Hashes</div>
                <div className="space-y-1 font-mono text-[10px]">
                  {rawMeta.map((r) => (
                    <div key={r.providerId}>
                      {r.providerName}: {r.rawSha256.slice(0, 16)}... (HTTP {r.httpStatus})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

