#!/bin/bash
# ============================================================
# nicetoAIyou Bot - One-Click Start Script (Linux/Mac)
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║       nicetoAIyou Bot - One-Click Start   ║"
echo "  ║      KI-Chat-Bot fuer Twitch und Kick        ║"
echo "  ╚══════════════════════════════════════════════╝"
echo ""

# ============================================
# Step 1: Check Node.js
# ============================================
if ! command -v node &> /dev/null; then
    echo -e "${RED}[FEHLER] Node.js nicht gefunden!${NC}"
    echo ""
    echo "  Bitte installiere Node.js 20+: https://nodejs.org/"
    exit 1
fi

NODE_VER=$(node --version)
echo -e "${GREEN}[OK]${NC} Node.js $NODE_VER gefunden"
echo ""

# ============================================
# Step 2: Check .env file
# ============================================
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo -e "${YELLOW}[SETUP]${NC} Erstelle Konfigurationsdatei .env ..."
        cp .env.example .env
        echo ""
        echo -e "${RED}!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!${NC}"
        echo -e "${RED}!! WICHTIG: Bearbeite .env Datei!!       !!${NC}"
        echo -e "${RED}!! Trage deinen Twitch-Token ein!!        !!${NC}"
        echo -e "${RED}!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!${NC}"
        echo ""
        echo "  1. Gehe zu: https://twitchapps.com/tmi/"
        echo "  2. Autorisiere mit deinem Bot-Account"
        echo "  3. Kopiere den Token in die .env Datei:"
        echo "     nano .env"
        echo ""
        echo -e "${YELLOW}Oeffne ein NEUES Terminal und bearbeite .env${NC}"
        echo -e "${YELLOW}Druecke hier ENTER wenn du fertig bist ...${NC}"
        read -r
    else
        echo -e "${RED}[FEHLER] .env.example nicht gefunden!${NC}"
        exit 1
    fi
fi

# ============================================
# Step 3: Install if needed
# ============================================
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}[INSTALL]${NC} Installiere Abhaengigkeiten ..."
    echo "  Das kann beim ersten Mal 1-2 Minuten dauern ..."
    npm install
    echo -e "${GREEN}[OK]${NC} Abhaengigkeiten installiert"
    echo ""
fi

# ============================================
# Step 4: Build if needed
# ============================================
if [ ! -d "packages/bot/dist" ]; then
    echo -e "${BLUE}[BUILD]${NC} Baue das Projekt ..."
    npm run build
    echo -e "${GREEN}[OK]${NC} Build erfolgreich!"
    echo ""
fi

# ============================================
# Step 5: Create data directory
# ============================================
mkdir -p data

# ============================================
# Step 6: Start the Bot!
# ============================================
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║          STARTING NICETOAIYOU AI ...         ║"
echo "  ╚══════════════════════════════════════════════╝"
echo ""
echo "  Druecke STRG+C zum Beenden."
echo ""

node packages/bot/dist/index.js
