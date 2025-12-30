#!/bin/bash
# Quick API test script

TOKEN="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"

echo "🧪 Testing Provider APIs..."
echo "Token: $TOKEN"
echo ""

echo "=== 1. GoPlus Labs ==="
curl -s "https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=$TOKEN" | head -3
echo -e "\n"

echo "=== 2. Honeypot.is (Pattern 1) ==="
curl -s "https://honeypot.is/api/v1/scan?address=$TOKEN&chain=ethereum" 2>&1 | head -3
echo -e "\n"

echo "=== 3. Cyberscope (POST) ==="
curl -s -X POST "https://api.cyberscope.io/v1/token/scan" \
  -H "Content-Type: application/json" \
  -d "{\"address\":\"$TOKEN\",\"chain\":\"1\"}" 2>&1 | head -3
echo -e "\n"

echo "=== 4. Token Sniffer ==="
curl -s "https://api.tokensniffer.com/v1/token/$TOKEN?chain=1" 2>&1 | head -3
echo -e "\n"

echo "✅ Test complete! Check results above."
