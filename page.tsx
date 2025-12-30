"use client";

import { useState, type FormEvent } from "react";

type ProviderEvidence = {
  providerId: string;
  providerName: string;
  verdict: "low" | "medium" | "high";
  summary: string;
  flags: string[];
  timestamp: string;
};

type EvidenceBundle = {
  tokenAddress: string;
  chain: string;
  contractRisk: string[];
  liquidityEvidence: string[];
  deployerReputation: string[];
  behavioralSignals: string[];
  providers: ProviderEvidence[];
};

export default function Home() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<EvidenceBundle | null>(null);

  async function handleScan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBundle(null);

    if (!tokenAddress.trim()) {
      setError("Please enter a token contract address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenAddress, chain }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch risk evidence. Please try again.");
      }

      const data = (await res.json()) as { bundle: EvidenceBundle };
      setBundle(data.bundle);
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
            <a href="#demo" className="hover:text-white">
              Try API
            </a>
            <a href="#education" className="hover:text-white">
              Education
            </a>
            <a href="#problem" className="hover:text-white">
              Problem
            </a>
            <a href="#solution" className="hover:text-white">
              Solution
            </a>
            <a href="#how-it-works" className="hover:text-white">
              How it works
            </a>
            <a href="#providers" className="hover:text-white">
              Providers
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-12 sm:py-16">
        {/* Hero */}
        <section className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Rug-pull risk, explained — not hidden
          </p>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            An open evidence layer for{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">
              rug‑pull detection
            </span>
            .
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
            <span className="rounded-full bg-white/5 px-3 py-1">
              Wallet &amp; DEX ready
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1">
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

            {bundle && (
              <div className="mt-6 space-y-4 rounded-xl border border-white/10 bg-black/50 p-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-sm font-semibold text-zinc-200">
                    Evidence bundle
                  </span>
                  <span className="text-xs text-zinc-400">
                    {bundle.chain} · {bundle.tokenAddress.slice(0, 8)}…
                    {bundle.tokenAddress.slice(-6)}
                  </span>
                </div>
                <div className="grid gap-4 text-sm text-zinc-300">
                  <div>
                    <div className="mb-2 font-semibold text-zinc-200">
                      Contract risk
                    </div>
                    <ul className="space-y-1 pl-4 text-sm text-zinc-300">
                      {bundle.contractRisk.map((item, i) => (
                        <li key={`risk-${i}`} className="list-disc">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-2 font-semibold text-zinc-200">
                      Liquidity evidence
                    </div>
                    <ul className="space-y-1 pl-4 text-sm text-zinc-300">
                      {bundle.liquidityEvidence.map((item, i) => (
                        <li key={`liq-${i}`} className="list-disc">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="border-t border-white/5 pt-3 text-xs text-zinc-400">
                  <div className="mb-2 font-semibold text-zinc-300">
                    {bundle.providers.length} provider
                    {bundle.providers.length === 1 ? "" : "s"} attested:
                  </div>
                  <div className="space-y-2">
                    {bundle.providers.map((p) => (
                      <div
                        key={p.providerId}
                        className="rounded-lg border border-white/10 bg-zinc-900/50 p-3"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-semibold text-zinc-200">
                            {p.providerName}
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
                  <p className="mt-3 text-zinc-500">
                    Wallets can apply their own local policy on top.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Education Section */}
        <section
          id="education"
          className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 via-purple-950/20 to-zinc-900/40 p-8"
        >
          <div className="mx-auto max-w-3xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-200">
              Education
            </h2>
            <p className="mt-3 text-lg font-semibold text-zinc-50">
              Learn about rug pulls and how to protect yourself
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              Understanding rug pulls is the first step toward safer DeFi
              participation. These resources explain what rug pulls are, how they
              work, and how to spot warning signs.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <a
                href="https://www.binance.com/en/academy/articles/what-is-a-rug-pull-in-crypto-and-how-does-it-work"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-3 rounded-xl border border-violet-500/30 bg-black/40 p-5 transition hover:border-violet-400/50 hover:bg-black/60"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-violet-200">
                    What is a Rug Pull?
                  </h3>
                  <svg
                    className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-1 group-hover:text-violet-300"
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
                <p className="text-xs leading-relaxed text-zinc-400">
                  Binance Academy explains rug pulls, how they work, and common
                  types like liquidity pulls and soft rugs.
                </p>
                <span className="text-[10px] font-medium text-violet-300">
                  binance.com →
                </span>
              </a>
              <a
                href="https://koinly.io/blog/crypto-rug-pulls-guide/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-3 rounded-xl border border-violet-500/30 bg-black/40 p-5 transition hover:border-violet-400/50 hover:bg-black/60"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-violet-200">
                    Crypto Rug Pulls Guide
                  </h3>
                  <svg
                    className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-1 group-hover:text-violet-300"
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
                <p className="text-xs leading-relaxed text-zinc-400">
                  Koinly&apos;s comprehensive guide covers red flags, prevention
                  strategies, and real-world examples of rug pull scams.
                </p>
                <span className="text-[10px] font-medium text-violet-300">
                  koinly.io →
                </span>
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


