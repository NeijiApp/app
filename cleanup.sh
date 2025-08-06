#!/bin/bash

echo "🧹 Starting Neiji Cleanup..."

# Create organized structure
mkdir -p docs
mkdir -p archive/debug-scripts
mkdir -p archive/test-files

# Move documentation (keep but organize)
echo "📚 Organizing documentation..."
mv *.md docs/ 2>/dev/null || true

# Archive debug scripts
echo "📦 Archiving debug scripts..."
mv debug-scripts/* archive/debug-scripts/ 2>/dev/null || true
rmdir debug-scripts

# Remove test audio files
echo "🗑️  Removing test audio files..."
rm -f debug-*.mp3
rm -f test-*.mp3
rm -f elevenlabs-meditation-*.mp3
rm -f meditation-*.mp3
rm -f full-meditation-*.mp3
rm -f individual-segment.mp3
rm -f direct-elevenlabs-test.mp3
rm -f openai-tts-test-*.mp3
rm -f meditation-elevenlabs-fixed.mp3
rm -f test-fixed-elevenlabs.mp3
rm -f test-meditation-fixed.mp3
rm -f test-auth-fixed.mp3
rm -f audio-cache-test-*.mp3

# Remove huge test JSON files
echo "🗑️  Removing test JSON files..."
rm -f final-test.json
rm -f meditation-test.json
rm -f pooler-test.json
rm -f table-test.json

# Remove legacy scripts
echo "🗑️  Removing legacy scripts..."
rm -f migrate-to-robust-cache.js
rm -f test-cache-system.js
rm -f test-router.js
rm -f fix-supabase-pooler.sh

# Clean racing-thoughts-test directory if empty
rmdir racing-thoughts-test 2>/dev/null || true

echo "✅ Cleanup complete! Removed ~20MB of test files"
echo "📊 Next: Review remaining structure"
