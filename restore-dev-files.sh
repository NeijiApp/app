#!/bin/bash
# Script to restore development files that are hidden from Railway deployment

echo "🔧 Restoring development files for local development..."

if [ -f "package.json.backup" ]; then
    mv package.json.backup package.json
    echo "✅ Restored package.json"
fi

if [ -f "pnpm-lock.yaml.backup" ]; then
    mv pnpm-lock.yaml.backup pnpm-lock.yaml
    echo "✅ Restored pnpm-lock.yaml"
fi

echo "🎯 Development files restored. You can now run 'pnpm install' and 'pnpm run dev'"
echo "⚠️  Note: Railway deployment only uses the assembly-service directory"