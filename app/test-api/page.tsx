"use client";

import { useState } from "react";

export default function TestAPIPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function testGoPlus() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Test GoPlus API with Ethereum mainnet
      const tokenAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
      const chainId = "1"; // Ethereum
      const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${tokenAddress}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to call API. Check console for details.",
      );
      console.error("API test error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-900 p-8 text-zinc-50">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold">API Test Page</h1>
        <p className="mb-6 text-sm text-zinc-400">
          Click the button below to test if the GoPlus API works without
          authentication. This helps you check if the API is free to use.
        </p>

        <button
          onClick={testGoPlus}
          disabled={loading}
          className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Testing..." : "Test GoPlus API"}
        </button>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-950/20 p-4">
            <h3 className="mb-2 font-semibold text-red-300">Error</h3>
            <p className="text-sm text-red-200">{error}</p>
            <p className="mt-2 text-xs text-red-300/80">
              This might mean the API requires authentication (API key). Check
              the API documentation or sign up for an account.
            </p>
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-lg border border-emerald-500/30 bg-black/40 p-4">
            <h3 className="mb-2 font-semibold text-emerald-300">
              ✅ API Response (Success!)
            </h3>
            <p className="mb-2 text-xs text-emerald-200">
              The API works! You can integrate it into your app. Here&apos;s what
              it returned:
            </p>
            <pre className="max-h-96 overflow-auto rounded bg-zinc-900 p-4 text-xs text-zinc-200">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-8 rounded-lg border border-white/10 bg-zinc-900/40 p-4">
          <h3 className="mb-2 text-sm font-semibold text-zinc-200">
            How to use this
          </h3>
          <ul className="space-y-2 text-xs text-zinc-400">
            <li>
              • Click &quot;Test GoPlus API&quot; to see if it works without an
              API key
            </li>
            <li>
              • If you see JSON data: The API is free to use (with rate limits)
            </li>
            <li>
              • If you see an error: The API requires authentication - sign up
              for an API key
            </li>
            <li>
              • Once you confirm it works, you can uncomment the integration code
              in <code className="text-emerald-300">app/api/scan/route.ts</code>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

