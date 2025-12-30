#!/usr/bin/env ts-node
/**
 * Test script to verify provider API endpoints
 * Run with: npx ts-node scripts/test-providers.ts
 */

import { providers } from "../lib/providers";

const TEST_TOKEN = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
const TEST_CHAIN = "ethereum";
const TEST_CHAIN_ID = "1";

async function testProviders() {
  console.log("🧪 Testing Provider APIs...\n");
  console.log(`Token: ${TEST_TOKEN}`);
  console.log(`Chain: ${TEST_CHAIN} (ID: ${TEST_CHAIN_ID})\n`);

  for (const provider of providers) {
    console.log(`\n📡 Testing ${provider.providerName} (${provider.providerId})...`);
    console.log("─".repeat(60));

    try {
      const record = await provider.call(TEST_TOKEN, TEST_CHAIN, TEST_CHAIN_ID);

      if (record.ok) {
        console.log(`✅ SUCCESS`);
        console.log(`   Status: ${record.httpStatus}`);
        console.log(`   Latency: ${record.latencyMs}ms`);
        console.log(`   Hash: ${record.rawPayloadHash?.slice(0, 16)}...`);
        
        if (process.env.INCLUDE_RAW_PAYLOAD === "true" && record.rawPayload) {
          console.log(`   Payload preview:`, JSON.stringify(record.rawPayload).slice(0, 200) + "...");
        }
      } else {
        console.log(`❌ FAILED`);
        console.log(`   Error: ${record.error}`);
        console.log(`   Status: ${record.httpStatus || "N/A"}`);
      }
    } catch (error) {
      console.log(`❌ EXCEPTION`);
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Testing complete!");
  console.log("\n💡 Tips:");
  console.log("   - Check .env.local for API keys");
  console.log("   - Set INCLUDE_RAW_PAYLOAD=true to see full responses");
  console.log("   - Update adapter endpoints if APIs return 404/errors");
}

testProviders().catch(console.error);

