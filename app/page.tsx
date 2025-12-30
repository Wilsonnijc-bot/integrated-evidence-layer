"use client";

import { useState, type FormEvent } from "react";
import type {
  EvidenceBundle,
  AggregatedEvidenceItem,
  PolicyDecision,
  ScanResponse,
} from "../lib/types";

export default function Home() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [policyMode, setPolicyMode] = useState<"strict" | "degen">("strict");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<EvidenceBundle | null>(null);
  const [evidence, setEvidence] = useState<AggregatedEvidenceItem[]>([]);
  const [policy, setPolicy] = useState<PolicyDecision | null>(null);
  const [attestation, setAttestation] = useState<ScanResponse["attestation"] | null>(null);
  const [metadata, setMetadata] = useState<ScanResponse["metadata"] | null>(null);
  const [rawMeta, setRawMeta] = useState<ScanResponse["raw"]>([]);
  const [forensics, setForensics] = useState<ScanResponse["forensics"] | null>(null);
  const [activeForensicsTab, setActiveForensicsTab] = useState<"holders" | "creator" | "pools" | "lp">("holders");

  async function handleScan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBundle(null);
    setForensics(null);
    setEvidence([]);
    setPolicy(null);
    setAttestation(null);
    setMetadata(null);
    setRawMeta([]);

    if (!tokenAddress.trim()) {
      setError("Please enter a token contract address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenAddress, chain, policyMode }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch risk evidence. Please try again.");
      }

      const data = (await res.json()) as ScanResponse;
      setBundle(data.bundle);
      setEvidence(data.evidence || []);
      setPolicy(data.policy || null);
      setAttestation(data.attestation || null);
      setMetadata(data.metadata || null);
      setRawMeta(data.raw || []);
      setForensics(data.forensics || null);
      
      // Log metadata for verification
      if (data.metadata) {
        console.log("🕐 Fetched At:", data.metadata.fetchedAt);
        console.log("🔌 Providers Attempted:", data.metadata.providersAttempted);
        console.log("✅ Providers Succeeded:", data.metadata.providersSucceeded);
        if (data.evidence) {
          console.log("📋 Evidence Items:", data.evidence.length);
        }
      }
      if (data.policy) {
        console.log("🎯 Policy Decision:", data.policy.decision, "(" + data.policy.mode + " mode)");
      }
      if (data.attestation) {
        console.log("🔐 Bundle Signed:", data.attestation.bundleSha256.slice(0, 16) + "...");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unexpected error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-900 text-zinc-50">
      <header className="border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/90 ring-2 ring-emerald-300/50" />
            <span className="text-sm font-semibold tracking-tight text-zinc-100">
              Integrated Evidence Layer
            </span>
          </div>
          <nav className="hidden gap-6 text-xs font-medium text-zinc-300 sm:flex">
            <a href="#education" className="hover:text-white">
              Education
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-12 sm:py-16">
        {/* Hero */}
        <section className="text-center">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Integrated evidence layer for{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">
              rug‑pull detection
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            Aggregate risk evidence from multiple rug-pull scanners into one
            standardized API. Wallets and DApps can plug in and apply their own
            risk policies.
          </p>
          <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-400">
            <span className="rounded-full bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-200 ring-2 ring-emerald-500/30">
              Evidence, not verdicts
            </span>
            <span className="rounded-full bg-white/5 px-5 py-2.5 text-sm font-semibold text-zinc-200">
              Wallet &amp; DEX ready
            </span>
            <span className="rounded-full bg-white/5 px-5 py-2.5 text-sm font-semibold text-zinc-200">
              Multi‑provider attestations
            </span>
          </div>
        </section>

        {/* API Demo - Large and Centered */}
        <section id="demo" className="mx-auto w-full max-w-3xl">
          <div className="rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-black/60 p-8 shadow-2xl shadow-emerald-500/10">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  Try the API Prototype
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Enter a token address to see aggregated risk evidence
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                Prototype
              </span>
            </div>
            <form className="space-y-5" onSubmit={handleScan}>
              <div className="space-y-2">
                <label
                  htmlFor="token"
                  className="text-sm font-medium text-zinc-300"
                >
                  Token contract address
                </label>
                <input
                  id="token"
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-sm outline-none ring-emerald-500/50 transition focus:border-emerald-400 focus:ring-2"
                  placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="chain"
                  className="text-sm font-medium text-zinc-300"
                >
                  Chain
                </label>
                <select
                  id="chain"
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-sm outline-none ring-emerald-500/50 transition focus:border-emerald-400 focus:ring-2"
                  value={chain}
                  onChange={(e) => setChain(e.target.value)}
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="bsc">BNB Chain</option>
                  <option value="polygon">Polygon</option>
                  <option value="arbitrum">Arbitrum</option>
                  <option value="optimism">Optimism</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">
                  Policy Mode
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPolicyMode("strict")}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                      policyMode === "strict"
                        ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-200"
                        : "border-white/10 bg-black/50 text-zinc-300 hover:bg-white/5"
                    }`}
                  >
                    Strict
                  </button>
                  <button
                    type="button"
                    onClick={() => setPolicyMode("degen")}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                      policyMode === "degen"
                        ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-200"
                        : "border-white/10 bg-black/50 text-zinc-300 hover:bg-white/5"
                    }`}
                  >
                    Degen
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Fetching evidence…" : "Fetch risk evidence"}
              </button>
            </form>

            {error && (
              <p className="mt-4 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-300">
                {error}
              </p>
            )}

            {/* Layer 1: Policy Decision */}
            {policy && (
              <div className="mt-6 rounded-xl border border-white/10 bg-black/50 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-lg font-semibold text-zinc-200">
                    Policy Decision
                  </span>
                  <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                    policy.decision === "block"
                      ? "bg-red-500/20 text-red-200"
                      : policy.decision === "warn"
                        ? "bg-orange-500/20 text-orange-200"
                        : "bg-emerald-500/20 text-emerald-200"
                  }`}>
                    {policy.decision.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-zinc-400">
                  Mode: <span className="font-semibold text-zinc-300 capitalize">{policy.mode}</span>
                  {policy.reasons.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <div className="font-semibold text-zinc-300">Reasons:</div>
                      {policy.reasons.map((r, i) => (
                        <div key={i} className="pl-2 text-xs">• {r.title}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Layer 2: Consensus Evidence */}
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
                  <p className="mt-1 text-xs text-zinc-500">
                    Merged evidence across all providers
                  </p>
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
                            {item.sources.length}/{metadata?.providersAttempted?.length || 0} providers
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
                        Providers: {item.sources.map(s => s.providerId).join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Layer 3: Normalized Evidence Bundle (by category) */}
            {bundle && (
              <div className="mt-6 rounded-xl border border-white/10 bg-black/50 p-5">
                <div className="mb-4 border-b border-white/5 pb-3">
                  <span className="text-lg font-semibold text-zinc-200">
                    Normalized Evidence Bundle
                  </span>
                  <p className="mt-1 text-xs text-zinc-500">
                    Evidence organized by category
                  </p>
                </div>
                <div className="grid gap-4 text-sm text-zinc-300">
                  {bundle.contractRisk.length > 0 && (
                    <div>
                      <div className="mb-2 font-semibold text-zinc-200">
                        Contract Risk
                      </div>
                      <ul className="space-y-1 pl-4 text-sm text-zinc-300">
                        {bundle.contractRisk.map((item, i) => (
                          <li key={`risk-${i}`} className="list-disc">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {bundle.liquidityEvidence.length > 0 && (
                    <div>
                      <div className="mb-2 font-semibold text-zinc-200">
                        Liquidity Evidence
                      </div>
                      <ul className="space-y-1 pl-4 text-sm text-zinc-300">
                        {bundle.liquidityEvidence.map((item, i) => (
                          <li key={`liq-${i}`} className="list-disc">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {bundle.deployerReputation.length > 0 && (
                    <div>
                      <div className="mb-2 font-semibold text-zinc-200">
                        Deployer Reputation
                      </div>
                      <ul className="space-y-1 pl-4 text-sm text-zinc-300">
                        {bundle.deployerReputation.map((item, i) => (
                          <li key={`deployer-${i}`} className="list-disc">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {bundle.behavioralSignals.length > 0 && (
                    <div>
                      <div className="mb-2 font-semibold text-zinc-200">
                        Behavioral Signals
                      </div>
                      <ul className="space-y-1 pl-4 text-sm text-zinc-300">
                        {bundle.behavioralSignals.map((item, i) => (
                          <li key={`behavior-${i}`} className="list-disc">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Layer 4: Raw Provider Attestations (collapsible) */}
            {bundle && (
              <div className="mt-6 rounded-xl border border-white/10 bg-black/50 p-5">
                <div className="mb-4 border-b border-white/5 pb-3">
                  <span className="text-lg font-semibold text-zinc-200">
                    Raw Provider Attestations
                  </span>
                  <p className="mt-1 text-xs text-zinc-500">
                    Provider responses with auditability hashes
                  </p>
                </div>
                <div className="space-y-3">
                  {bundle.providers.map((p) => (
                    <details
                      key={p.providerId}
                      className="rounded-lg border border-white/10 bg-zinc-900/50"
                    >
                      <summary className="cursor-pointer p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-200">
                              {p.providerName}
                            </span>
                            <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                              p.available
                                ? "bg-emerald-500/20 text-emerald-200"
                                : "bg-yellow-500/20 text-yellow-200"
                            }`}>
                              {p.available ? "OK" : "UNAVAILABLE"}
                            </span>
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
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-400">
                          {p.summary}
                        </p>
                      </summary>
                      <div className="border-t border-white/5 p-3 space-y-2 text-xs text-zinc-400">
                        <div>
                          <span className="font-semibold text-zinc-300">Raw payload hash:</span>
                          <div className="mt-1 font-mono text-[10px]">
                            {rawMeta?.find(r => r.providerId === p.providerId)?.rawSha256.slice(0, 32) || "N/A"}...
                          </div>
                        </div>
                        {p.flags.length > 0 && (
                          <div>
                            <span className="font-semibold text-zinc-300">Flags:</span>
                            <ul className="mt-1 space-y-0.5 pl-3 text-[11px]">
                              {p.flags.map((flag, i) => (
                                <li key={i} className="list-disc">{flag}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {attestation && (
                          <div>
                            <span className="font-semibold text-zinc-300">Integrator receipt (MVP):</span>
                            <div className="mt-1 font-mono text-[10px] space-y-0.5">
                              <div>Hash: {attestation.bundleSha256.slice(0, 16)}...</div>
                              <div>Signed: {new Date(attestation.signedAt).toLocaleString()}</div>
                              <div>Key ID: {attestation.publicKeyId}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* On-chain Forensics (GoPlus) - Collapsible Deep Dive */}
            {bundle && forensics?.goplus && (
              <details className="mt-6 rounded-xl border border-white/10 bg-black/50">
                <summary className="cursor-pointer p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-200">
                        On-chain Forensics (GoPlus) ▾
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        Deep dive from GoPlus raw data (optional)
                      </p>
                    </div>
                  </div>
                </summary>
                <div className="border-t border-white/5 p-5">
                  <div>
                    {/* Tabs */}
                    <div className="mb-4 flex gap-2 border-b border-white/5">
                      <button
                        onClick={() => setActiveForensicsTab("holders")}
                        className={`px-4 py-2 text-sm font-medium transition ${
                          activeForensicsTab === "holders"
                            ? "border-b-2 border-violet-400 text-violet-200"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Holders
                      </button>
                      <button
                        onClick={() => setActiveForensicsTab("creator")}
                        className={`px-4 py-2 text-sm font-medium transition ${
                          activeForensicsTab === "creator"
                            ? "border-b-2 border-violet-400 text-violet-200"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Creator / Owner
                      </button>
                      <button
                        onClick={() => setActiveForensicsTab("pools")}
                        className={`px-4 py-2 text-sm font-medium transition ${
                          activeForensicsTab === "pools"
                            ? "border-b-2 border-violet-400 text-violet-200"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        DEX Pools
                      </button>
                      <button
                        onClick={() => setActiveForensicsTab("lp")}
                        className={`px-4 py-2 text-sm font-medium transition ${
                          activeForensicsTab === "lp"
                            ? "border-b-2 border-violet-400 text-violet-200"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        LP Holders & Locks
                      </button>
                    </div>

                    {/* Holders Tab */}
                    {activeForensicsTab === "holders" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-zinc-500">Holder Count</div>
                            <div className="mt-1 font-semibold text-zinc-200">
                              {forensics.goplus.token.holderCount?.toLocaleString() || "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-zinc-500">Total Supply</div>
                            <div className="mt-1 font-semibold text-zinc-200">
                              {forensics.goplus.token.totalSupply
                                ? typeof forensics.goplus.token.totalSupply === "string"
                                  ? parseFloat(forensics.goplus.token.totalSupply).toLocaleString()
                                  : forensics.goplus.token.totalSupply.toLocaleString()
                                : "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-zinc-500">Top 10%</div>
                            <div className="mt-1 font-semibold text-zinc-200">
                              {forensics.goplus.holders.top10Percent
                                ? `${forensics.goplus.holders.top10Percent.toFixed(1)}%`
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                        {forensics.goplus.holders.topHolders.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-white/10 text-left text-zinc-400">
                                  <th className="pb-2 pr-4">Address</th>
                                  <th className="pb-2 pr-4">Balance</th>
                                  <th className="pb-2">Percent</th>
                                </tr>
                              </thead>
                              <tbody>
                                {forensics.goplus.holders.topHolders.map((holder, i) => (
                                  <tr key={i} className="border-b border-white/5">
                                    <td className="py-2 pr-4 font-mono text-zinc-300">
                                      {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                                    </td>
                                    <td className="py-2 pr-4 text-zinc-400">
                                      {holder.balance
                                        ? typeof holder.balance === "string"
                                          ? parseFloat(holder.balance).toLocaleString()
                                          : holder.balance.toLocaleString()
                                        : "N/A"}
                                    </td>
                                    <td className="py-2 text-zinc-400">
                                      {holder.percent ? `${holder.percent.toFixed(2)}%` : "N/A"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-500">No holder data available</p>
                        )}
                      </div>
                    )}

                    {/* Creator / Owner Tab */}
                    {activeForensicsTab === "creator" && (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          {forensics.goplus.creatorOwner.creatorAddress ? (
                            <div>
                              <div className="text-xs text-zinc-500">Creator</div>
                              <div className="mt-1 font-mono text-sm text-zinc-200">
                                {forensics.goplus.creatorOwner.creatorAddress}
                              </div>
                              {forensics.goplus.creatorOwner.creatorPercent !== undefined && (
                                <div className="mt-1 text-xs text-zinc-400">
                                  {forensics.goplus.creatorOwner.creatorPercent.toFixed(2)}% of supply
                                </div>
                              )}
                              {forensics.goplus.creatorOwner.creatorBalance && (
                                <div className="mt-1 text-xs text-zinc-400">
                                  Balance:{" "}
                                  {typeof forensics.goplus.creatorOwner.creatorBalance === "string"
                                    ? parseFloat(forensics.goplus.creatorOwner.creatorBalance).toLocaleString()
                                    : forensics.goplus.creatorOwner.creatorBalance.toLocaleString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="text-xs text-zinc-500">Creator</div>
                              <div className="mt-1 text-sm text-zinc-400">N/A</div>
                            </div>
                          )}
                          {forensics.goplus.creatorOwner.ownerAddress ? (
                            <div>
                              <div className="text-xs text-zinc-500">Owner</div>
                              <div className="mt-1 font-mono text-sm text-zinc-200">
                                {forensics.goplus.creatorOwner.ownerAddress}
                              </div>
                              {forensics.goplus.creatorOwner.ownerPercent !== undefined && (
                                <div className="mt-1 text-xs text-zinc-400">
                                  {forensics.goplus.creatorOwner.ownerPercent.toFixed(2)}% of supply
                                </div>
                              )}
                              {forensics.goplus.creatorOwner.ownerBalance && (
                                <div className="mt-1 text-xs text-zinc-400">
                                  Balance:{" "}
                                  {typeof forensics.goplus.creatorOwner.ownerBalance === "string"
                                    ? parseFloat(forensics.goplus.creatorOwner.ownerBalance).toLocaleString()
                                    : forensics.goplus.creatorOwner.ownerBalance.toLocaleString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="text-xs text-zinc-500">Owner</div>
                              <div className="mt-1 text-sm text-zinc-400">—</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* DEX Pools Tab */}
                    {activeForensicsTab === "pools" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-zinc-500">Total Liquidity</div>
                            <div className="mt-1 font-semibold text-zinc-200">
                              {forensics.goplus.dexPools.totalLiquidityUsd
                                ? `$${forensics.goplus.dexPools.totalLiquidityUsd.toFixed(2)}M`
                                : "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-zinc-500">Pool Count</div>
                            <div className="mt-1 font-semibold text-zinc-200">
                              {forensics.goplus.dexPools.poolCount || "N/A"}
                            </div>
                          </div>
                        </div>
                        {forensics.goplus.dexPools.topPools.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-white/10 text-left text-zinc-400">
                                  <th className="pb-2 pr-4">DEX Name</th>
                                  <th className="pb-2 pr-4">Pair Address</th>
                                  <th className="pb-2">Liquidity ($)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {forensics.goplus.dexPools.topPools.map((pool, i) => (
                                  <tr key={i} className="border-b border-white/5">
                                    <td className="py-2 pr-4 text-zinc-300">
                                      {pool.dexName || "N/A"}
                                    </td>
                                    <td className="py-2 pr-4 font-mono text-zinc-400">
                                      {pool.pairAddress
                                        ? `${pool.pairAddress.slice(0, 6)}...${pool.pairAddress.slice(-4)}`
                                        : "N/A"}
                                    </td>
                                    <td className="py-2 text-zinc-400">
                                      {pool.liquidityUsd
                                        ? `$${pool.liquidityUsd.toFixed(2)}M`
                                        : "N/A"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-500">No pool data available</p>
                        )}
                      </div>
                    )}

                    {/* LP Holders & Locks Tab */}
                    {activeForensicsTab === "lp" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-zinc-500">LP Holder Count</div>
                            <div className="mt-1 font-semibold text-zinc-200">
                              {forensics.goplus.lpLocks.lpHolderCount || "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-zinc-500">Locked Ratio</div>
                            <div className="mt-1 font-semibold text-zinc-200">
                              {forensics.goplus.lpLocks.lockedRatio !== undefined
                                ? `${forensics.goplus.lpLocks.lockedRatio.toFixed(1)}%`
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                        {forensics.goplus.lpLocks.topLpHolders.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-white/10 text-left text-zinc-400">
                                  <th className="pb-2 pr-4">Address</th>
                                  <th className="pb-2 pr-4">Percent</th>
                                  <th className="pb-2 pr-4">Locked?</th>
                                  <th className="pb-2">Lock Info</th>
                                </tr>
                              </thead>
                              <tbody>
                                {forensics.goplus.lpLocks.topLpHolders.map((lp, i) => (
                                  <tr key={i} className="border-b border-white/5">
                                    <td className="py-2 pr-4 font-mono text-zinc-300">
                                      {lp.address.slice(0, 6)}...{lp.address.slice(-4)}
                                    </td>
                                    <td className="py-2 pr-4 text-zinc-400">
                                      {lp.percent ? `${lp.percent.toFixed(2)}%` : "N/A"}
                                    </td>
                                    <td className="py-2 pr-4 text-zinc-400">
                                      {lp.isLocked ? (
                                        <span className="text-emerald-300">Yes</span>
                                      ) : (
                                        <span className="text-zinc-500">No</span>
                                      )}
                                    </td>
                                    <td className="py-2 text-zinc-400">
                                      {lp.lockInfo || "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-500">No LP holder data available</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )}

        </div>
        </section>

        {/* Education Section - Moved after API demo */}
        <section
          id="education"
          className="mx-auto w-full max-w-4xl"
        >
          <div className="rounded-3xl border-2 border-violet-500/30 bg-gradient-to-br from-violet-950/30 via-purple-950/20 to-zinc-900/40 p-10 sm:p-12 shadow-2xl shadow-violet-500/10">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-semibold mb-4">
                <span className="bg-gradient-to-r from-yellow-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                  Education
                </span>
              </h2>
              <p className="text-base sm:text-lg leading-relaxed text-yellow-200/90">
                Scanners output evidence. Education helps investors interpret it and act safely.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <a
                href="https://www.binance.com/en/academy/articles/what-is-a-rug-pull-in-crypto-and-how-does-it-work"
            target="_blank"
            rel="noopener noreferrer"
                className="group relative flex flex-col gap-5 rounded-xl border-2 border-violet-500/40 bg-black/60 p-8 transition-all hover:border-violet-400/60 hover:bg-black/80 hover:shadow-lg hover:shadow-violet-500/20"
          >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="mb-3 inline-block rounded-full bg-violet-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-violet-200">
                      Recommended reading
                    </span>
                    <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-violet-200">
                      Binance Academy — What is a Rug Pull?
                    </h3>
                  </div>
                  <svg
                    className="h-6 w-6 flex-shrink-0 text-violet-400 transition group-hover:translate-x-1 group-hover:text-violet-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <p className="text-base leading-relaxed text-zinc-300">
                  Binance Academy explains rug pulls, how they work, and common types like liquidity pulls and soft rugs.
                </p>
                <div className="mt-auto flex items-center gap-2">
                  <span className="rounded-full bg-violet-500/20 px-5 py-2.5 text-sm font-semibold text-violet-200">
                    Read
                  </span>
                  <span className="text-sm text-zinc-400">
                    binance.com
                  </span>
                </div>
          </a>
          <a
                href="https://koinly.io/blog/crypto-rug-pulls-guide/"
            target="_blank"
            rel="noopener noreferrer"
                className="group relative flex flex-col gap-5 rounded-xl border-2 border-violet-500/40 bg-black/60 p-8 transition-all hover:border-violet-400/60 hover:bg-black/80 hover:shadow-lg hover:shadow-violet-500/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="mb-3 inline-block rounded-full bg-violet-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-violet-200">
                      Recommended reading
                    </span>
                    <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-violet-200">
                      Koinly — Crypto Rug Pulls Guide
                    </h3>
                  </div>
                  <svg
                    className="h-6 w-6 flex-shrink-0 text-violet-400 transition group-hover:translate-x-1 group-hover:text-violet-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <p className="text-base leading-relaxed text-zinc-300">
                  Koinly&apos;s comprehensive guide covers red flags, prevention strategies, and real-world examples of rug pull scams.
                </p>
                <div className="mt-auto flex items-center gap-2">
                  <span className="rounded-full bg-violet-500/20 px-5 py-2.5 text-sm font-semibold text-violet-200">
                    Read
                  </span>
                  <span className="text-sm text-zinc-400">
                    koinly.io
                  </span>
                </div>
          </a>
        </div>
          </div>
        </section>

        {/* Problem */}
        <section
          id="problem"
          className="grid gap-10 rounded-3xl border border-white/10 bg-black/40 p-6 md:grid-cols-2"
        >
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Problem
            </h2>
            <p className="mt-3 text-lg font-semibold text-zinc-50">
              Rug pulls are hard to catch with a single scanner.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              DeFi enables permissionless token listing without mandatory audits.
              Multiple scanners exist, but they use different formats and
              thresholds, making it hard to compare results or integrate into
              wallets and DApps.
            </p>
          </div>
          <div className="space-y-4 text-sm text-zinc-200">
            <div className="rounded-2xl bg-zinc-900/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                The gap
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                No single scanner catches everything. Users jump between sites,
                compare inconsistent results, and still miss risks.
              </p>
            </div>
          </div>
        </section>

        {/* Solution */}
        <section
          id="solution"
          className="grid gap-10 rounded-3xl border border-emerald-500/20 bg-emerald-950/30 p-6 md:grid-cols-[1.1fr_0.9fr]"
        >
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Solution
            </h2>
            <p className="mt-3 text-lg font-semibold text-emerald-50">
              Aggregate evidence from multiple scanners into one standard API.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-emerald-50/90">
              We normalize outputs from independent detection tools into a shared
              evidence schema. Wallets and DApps get structured risk data they
              can interpret with their own policies.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-emerald-50/90">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>
                  Standardized evidence for contract risk, liquidity, deployer
                  reputation, and behavioral signals.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>
                  Multi-provider attestations with verifiable signatures.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>
                  Wallet-side policies — strict or degen — built on evidence,
                  not opaque scores.
                </span>
              </li>
            </ul>
          </div>
          <div className="space-y-3 text-xs text-emerald-50/90">
            <div className="rounded-2xl border border-emerald-500/30 bg-black/40 p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
                Action‑timed delivery
              </h3>
              <p className="mt-2 leading-relaxed">
                Call the API at decision points — before Approve, Swap, or Add
                Liquidity — to surface risk when users act.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-black/40 p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
                Customizable policies
              </h3>
              <p className="mt-2 leading-relaxed">
                Wallets apply their own risk logic — require consensus, ignore
                certain providers, or show warnings only.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="grid gap-10 rounded-3xl border border-white/10 bg-black/40 p-6 md:grid-cols-3"
        >
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
              How it works
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              Query multiple scanners, normalize outputs, return structured
              evidence bundles.
            </p>
          </div>
          <div className="space-y-4 text-xs text-zinc-200">
            <div className="rounded-2xl bg-zinc-900/60 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                1 · Call
              </div>
              <p className="mt-2 leading-relaxed text-zinc-300">
                Call <code className="rounded bg-zinc-900/80 px-1.5 py-0.5 text-[10px] text-emerald-200">POST /api/scan</code> with token address and chain.
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-900/60 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                2 · Aggregate
              </div>
              <p className="mt-2 leading-relaxed text-zinc-300">
                We query multiple scanners and normalize their outputs into a
                shared evidence schema.
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-900/60 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                3 · Testify
              </div>
              <p className="mt-2 leading-relaxed text-zinc-300">
                Provider outputs are signed attestations. Wallets verify and
                apply their own risk policies.
              </p>
            </div>
          </div>
          <div className="space-y-4 text-xs text-zinc-200">
            <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 font-mono">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                Example response (simplified)
              </div>
              <pre className="overflow-x-auto text-[10px] leading-relaxed text-zinc-200">
{`{
  "tokenAddress": "0x…",
  "chain": "ethereum",
  "contractRisk": ["Mintable by owner", "Trading limits"],
  "liquidityEvidence": ["LP locked 72h"],
  "providers": [
    {
      "providerId": "goplus",
      "verdict": "medium",
      "flags": ["Owner can change fees"]
    },
    {
      "providerId": "tokensniffer",
      "verdict": "high",
      "flags": ["Similar to known rug"]
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Providers */}
        <section
          id="providers"
          className="rounded-3xl border border-white/10 bg-black/40 p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Providers
              </h2>
              <p className="mt-2 text-sm text-zinc-300">
                Designed to integrate with today&apos;s leading rug‑pull and
                scam detectors — and future ones.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 text-xs text-zinc-300 sm:grid-cols-2 md:grid-cols-3">
            {[
              "GoPlus",
              "Aegisweb3",
              "De.Fi",
              "Quick Intel",
              "Cyberscan",
              "Token Sniffer",
              "Staysafu",
              "SolidityScan",
              "ContractWolf",
              "BlockSafu",
              "DexAnalyzer",
              "Honeypot.is",
              "Hapi Labs",
              "QuillCheck",
            ].map((name) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2"
              >
                <span>{name}</span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-200">
                  Target integration
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-4 text-[11px] text-zinc-500 sm:flex-row">
          <span>
            Built for wallets, DEXs, and DeFi interfaces that want{" "}
            <span className="font-medium text-zinc-300">
              evidence‑first safety
            </span>
            .
          </span>
          <span>Prototype UI – plug in your own provider keys &amp; policies.</span>
        </div>
      </footer>
    </div>
  );
}


