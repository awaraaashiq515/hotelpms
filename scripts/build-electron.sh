#!/bin/bash
echo "🏗️  GuestFlow PMS — Electron Offline Build"
echo "Step 1: Prisma generate..."
npx prisma generate
echo "Step 2: Next.js build (standalone)..."
NODE_OPTIONS='--max-old-space-size=3072' next build
echo "Step 3: Copy DB to standalone..."
cp dev.db .next/standalone/dev.db 2>/dev/null || true
echo "Step 4: Copy public assets..."
cp -r public .next/standalone/public 2>/dev/null || true
echo "Step 5: Electron build..."
electron-builder --config electron-builder.json --publish never
echo "✅ Build complete! Check dist/ folder"
