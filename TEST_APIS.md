# Testing Provider APIs with Terminal (curl)

Simple curl commands to test each provider's API endpoint.

## Test Token
Use this token for all tests: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` (USDC on Ethereum)

---

## 1. GoPlus Labs ✅ (Known to work)

```bash
curl "https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
```

**Expected:** JSON response with `{"code":1,"message":"OK","result":{...}}`

**If you get an error:** Check the URL format or if API key is needed.

---

## 2. Honeypot.is

### Try Pattern 1 (most common):
```bash
curl "https://honeypot.is/api/v1/scan?address=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&chain=ethereum"
```

### Try Pattern 2 (alternative):
```bash
curl "https://honeypot.is/api/check?token=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&chain=1"
```

### Try Pattern 3 (direct):
```bash
curl "https://honeypot.is/api/v1/token/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
```

**What to look for:**
- ✅ **200 OK** = API exists! Check the response format
- ❌ **404 Not Found** = Wrong endpoint, try next pattern
- ❌ **401 Unauthorized** = Needs API key (check their website)
- ❌ **Connection refused** = No public API available

**Note:** Honeypot.is might not have a public API - they may only work through their website.

---

## 3. Cyberscope / Cyberscan

### Try Pattern 1 (POST):
```bash
curl -X POST "https://api.cyberscope.io/v1/token/scan" \
  -H "Content-Type: application/json" \
  -d '{"address":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48","chain":"1"}'
```

### Try Pattern 2 (GET):
```bash
curl "https://api.cyberscope.io/v1/token/scan?address=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&chainId=1"
```

### Try Pattern 3 (alternative base URL):
```bash
curl "https://cyberscope.io/api/v1/scan?address=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&chain=ethereum"
```

**What to look for:**
- ✅ **200 OK** = API works! Check response format
- ❌ **404** = Try different endpoint pattern
- ❌ **401** = Needs API key (visit cyberscope.io for API access)

---

## 4. Token Sniffer

### Try Pattern 1:
```bash
curl "https://api.tokensniffer.com/v1/token/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48?chain=1"
```

### Try Pattern 2:
```bash
curl "https://tokensniffer.com/api/v1/tokens/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48?chainId=1"
```

### Try Pattern 3:
```bash
curl "https://api.tokensniffer.com/token/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48?chain=ethereum"
```

**What to look for:**
- ✅ **200 OK** = API works!
- ❌ **404** = Try different endpoint
- ❌ **401** = Needs API key

---

## Quick Test Script

Copy and paste this into your terminal to test all at once:

```bash
echo "=== Testing GoPlus ==="
curl -s "https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" | head -5

echo -e "\n=== Testing Honeypot.is ==="
curl -s "https://honeypot.is/api/v1/scan?address=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&chain=ethereum" | head -5

echo -e "\n=== Testing Cyberscope ==="
curl -s -X POST "https://api.cyberscope.io/v1/token/scan" \
  -H "Content-Type: application/json" \
  -d '{"address":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48","chain":"1"}' | head -5

echo -e "\n=== Testing Token Sniffer ==="
curl -s "https://api.tokensniffer.com/v1/token/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48?chain=1" | head -5
```

---

## What Each Response Means

### ✅ Success (200 OK)
```json
{
  "code": 1,
  "message": "OK",
  "result": { ... }
}
```
**Action:** Copy the response structure and update the normalizer!

### ❌ Not Found (404)
```
404 Not Found
```
**Action:** Try a different endpoint pattern (see alternatives above)

### ❌ Unauthorized (401)
```
401 Unauthorized
```
**Action:** 
1. Visit the provider's website
2. Look for "API" or "Developers" section
3. Sign up for API access
4. Get API key and add to `.env.local`

### ❌ Connection Refused / Timeout
```
curl: (7) Failed to connect
```
**Action:** Provider might not have a public API - check their website

---

## After Testing

Once you find working endpoints:

1. **Update the adapter file** (e.g., `lib/providers/honeypot.ts`)
   - Change the URL to the working endpoint
   - Update request method (GET vs POST) if needed
   - Add API key header if required

2. **Update the normalizer** (e.g., `lib/normalize.ts`)
   - Look at the actual response structure
   - Update `normalizeHoneypot()` to extract real data

3. **Test again** with `npm run dev` and check browser console

---

## Pro Tips

- Use `| jq` to pretty-print JSON: `curl ... | jq`
- Use `-v` for verbose output: `curl -v ...` (shows headers)
- Use `-i` to see response headers: `curl -i ...`
- Save response to file: `curl ... > response.json`

