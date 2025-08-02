#!/bin/bash
# Script to prepare for Railway deployment by hiding root package files

echo "🚀 Preparing for Railway deployment..."

if [ -f "package.json" ]; then
    mv package.json package.json.backup
    echo "✅ Hidden package.json (Railway will use assembly-service/package.json)"
fi

if [ -f "pnpm-lock.yaml" ]; then
    mv pnpm-lock.yaml pnpm-lock.yaml.backup
    echo "✅ Hidden pnpm-lock.yaml (Railway will use assembly-service/package-lock.json)"
fi

echo "🎯 Ready for Railway deployment!"
echo "📋 Railway will now use Docker with assembly-service only"
echo "🔄 Run './restore-dev-files.sh' to restore files for local development"