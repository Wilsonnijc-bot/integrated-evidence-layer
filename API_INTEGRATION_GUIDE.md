# API Integration Guide

This guide explains how to integrate real rug-pull detection APIs into the Integrated Evidence Layer.

## Current Status: Mock Implementation

The current implementation uses mock data to demonstrate the UX. To integrate real APIs, follow the steps below.

## API Provider Information

### 1. GoPlus Labs
- **Website**: https://gopluslabs.io/
- **Token Security**: https://gopluslabs.io/token-security
- **API Docs**: https://docs.gopluslabs.io/
- **Status**: ✅ Likely has free tier
- **How to check**:
  1. Visit https://docs.gopluslabs.io/
  2. Look for API endpoints (e.g., `/api/v1/token_security/{chain_id}`)
  3. Check if API key is required (may work without one for limited use)
  4. Review rate limits and pricing

**Example endpoint structure** (verify in docs):
```
GET https://api.gopluslabs.io/api/v1/token_security/{chain_id}?contract_addresses={address}
```

### 2. De.Fi Scanner
- **Website**: https://de.fi/
- **Scanner**: https://de.fi/scanner
- **Status**: ⚠️ API access unclear - may require contact
- **How to check**:
  1. Visit https://de.fi/scanner
  2. Check if they have a public API or developer portal
  3. Look for "API" or "Developers" section
  4. May need to contact them for API access

### 3. Other Providers
- **Token Sniffer**: https://tokensniffer.com/ - Check for API access
- **Aegisweb3**: https://www.aegisweb3.com/ - Check for API access
- **Quick Intel**: https://app.quickintel.io/scanner - Check for API access

## How to Integrate Real APIs

### Step 1: Get API Keys (if required)

1. Sign up for accounts with providers that offer APIs
2. Generate API keys from their developer portals
3. Add keys to `.env.local` file:

```bash
# .env.local
GOPLUS_API_KEY=your_goplus_key_here
DEFI_API_KEY=your_defi_key_here
```

### Step 2: Uncomment API Integration Code

In `app/api/scan/route.ts`, uncomment the example code blocks for:
- GoPlus API call
- De.Fi API call (if available)
- Other providers as you add them

### Step 3: Normalize API Responses

Each provider returns data in different formats. You need to:
1. Extract relevant risk indicators
2. Map them to the `EvidenceBundle` schema:
   - `contractRisk`: Contract-level risks (mintable, blacklist, etc.)
   - `liquidityEvidence`: LP lock status, unlock schedule
   - `deployerReputation`: Deployer history, past rugs
   - `behavioralSignals`: Trading patterns, holder distribution

### Step 4: Handle Errors Gracefully

- If one API fails, continue with others
- Log errors for debugging
- Return partial results if some providers fail

## Cost Considerations

### Free Tiers
Many APIs offer free tiers with:
- Limited requests per day/month
- Rate limits (e.g., 10 requests/minute)
- Basic features only

### Paid Plans
If you need more:
- Check pricing pages
- Consider starting with free tier
- Scale up as usage grows

### Cost-Effective Strategy
1. Start with providers that offer free tiers
2. Use multiple free tiers to increase coverage
3. Only pay for premium APIs if needed for production

## Example: Testing GoPlus API

### What is `curl`?
`curl` is a command-line tool that lets you make HTTP requests from your terminal. It's built into macOS and Linux.

### Method 1: Using curl (Terminal)
Open Terminal and run:

```bash
# Test with Ethereum mainnet (chain_id=1)
curl "https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

If you see JSON data returned, the API works! If you get an error about authentication, you'll need an API key.

### Method 2: Using Your Browser (Easier!)
Just paste the URL directly into your browser:

```
https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

The browser will show you the JSON response (or an error if authentication is needed).

### Method 3: Create a Test Page in Your App
I can create a simple test page in your Next.js app that lets you test APIs with a button click - no terminal needed!

## Next Steps

1. **Research**: Visit each provider's website and documentation
2. **Test**: Try calling their APIs directly (curl or Postman)
3. **Integrate**: Uncomment and adapt the code in `route.ts`
4. **Test**: Verify the integration works with real token addresses
5. **Deploy**: Once working, deploy to production

## Questions to Ask Providers

- Do you offer a free tier?
- What are the rate limits?
- What's the pricing for production use?
- Do you require API keys?
- What's the API endpoint structure?
- What data format do you return?

