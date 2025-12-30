#!/bin/bash
# Vercel build simulation - clean environment test
set -e

echo "🧹 Cleaning build artifacts..."
rm -rf node_modules .next

echo "📦 Installing dependencies (Vercel-style)..."
npm ci

echo "🔍 Running CI build gate..."
npm run build:ci

echo "✅ Vercel build simulation passed!"

