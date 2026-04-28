# ============================================================
# nicetoAIyou - One-Click Start Script
# ============================================================

#!/bin/bash
set -e

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   nicetoAIyou - Quick Setup      ║"
echo "  ║   KI-Chat-Bot für Twitch & Kick     ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nicht gefunden. Bitte installiere Node.js 20+: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) gefunden"

# Create .env if not exists
if [ ! -f .env ]; then
    echo ""
    echo "📝 Erstelle Konfigurationsdatei (.env)..."
    cp .env.example .env
    echo ""
    echo "⚠️  WICHTIG: Bearbeite .env und trage deine Twitch-Daten ein!"
    echo "   nano .env"
    echo ""
fi

# Check if data directory exists
mkdir -p data

# Install dependencies
echo ""
echo "📦 Installiere Abhängigkeiten..."
npm install 2>/dev/null || npm install

# Build shared package
echo ""
echo "🔨 Baue shared Package..."
cd packages/shared && npm run build && cd ../..

# Build bot
echo ""
echo "🔨 Baue Bot Engine..."
cd packages/bot && npm run build && cd ../..

# Build admin dashboard
echo ""
echo "🔨 Baue Admin Dashboard..."
cd packages/admin && npm run build && cd ../..

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║         BUILD ERFOLGREICH!          ║"
echo "  ╚══════════════════════════════════════╝"
echo ""
echo "  🚀 Starte den Bot mit:"
echo "     npm run start"
echo ""
echo "  🌐 Öffne das Admin Interface:"
echo "     http://localhost:3001"
echo ""
echo "  📝 Konfiguriere deinen Kanal im Admin Panel"
echo ""
