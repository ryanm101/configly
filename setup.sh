#!/bin/bash

# Schema Config Builder - Setup Script
# This script sets up the project for development or use

set -e

echo "🚀 Schema Config Builder - Setup"
echo "================================="
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18+ is required. You have $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Check npm version
NPM_VERSION=$(npm -v | cut -d'.' -f1)
if [ "$NPM_VERSION" -lt 9 ]; then
    echo "❌ Error: npm 9+ is required. You have $(npm -v)"
    exit 1
fi
echo "✅ npm version: $(npm -v)"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install
echo ""

# Install core package dependencies
echo "📦 Installing @configly/core dependencies..."
cd packages/core
npm install
cd ../..
echo ""

# Install UI package dependencies
echo "📦 Installing @configly/ui dependencies..."
cd packages/ui
npm install
cd ../..
echo ""

# Build core package first (UI depends on it)
echo "🔨 Building @configly/core..."
cd packages/core
npm run build
cd ../..
echo ""

# Build UI package
echo "🔨 Building @configly/ui..."
cd packages/ui
npm run build
cd ../..
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start dev server:  npm run dev"
echo "  2. Or open:          packages/ui/dist/index.html"
echo ""
echo "📚 Read BUILD_AND_TEST.md for detailed instructions"
