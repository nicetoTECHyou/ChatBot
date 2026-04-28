# StreamForge AI Bot

<p align="center">
  <strong>KI-gesteuerter Multi-Persona Chat-Bot für Twitch & Kick</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Twitch-9146FF?logo=twitch" alt="Twitch">
  <img src="https://img.shields.io/badge/LM_Studio-Local-53FC18" alt="LM Studio">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
</p>

---

## Was ist StreamForge AI?

StreamForge AI ist ein hochgradig innovativer, KI-gesteuerter Chat-Bot, der gleichzeitig auf Twitch und Kick eingesetzt werden kann. Er nutzt echtes Sprachverstehen und ein dynamisches Multi-Persona-System, um den Chat als aktiver Co-Moderator zu lenken.

### Kernfeatures

- **Multi-Persona System** - 7 einzigartige Personas mit eigenem Charakter und Verhalten
- **KI-Fallback-Kette** - LM Studio (lokal) → OpenAI → Anthropic → Canned Responses
- **Zero-Latency Moderation** - Regelbasierte Moderation ohne KI-Verzögerung
- **Quest-System** - KI-gesteuerte Missionen mit XP und Level-System
- **Death-Counter** - Persona-spezifische Reaktionen bei Spiel-Toden
- **Sentiment-Analyse** - Automatische Stimmungserkennung im Chat
- **Lore-Datenbank** - Kanal-Historie und Insider-Wissen
- **Admin Dashboard** - Echtzeit-Steuerung über Web-Interface

### Persona-Katalog

| Persona | Verhalten | Spezial-Feature |
|---------|-----------|-----------------|
| **Der Kritiker** | Sarkastisch, arrogant | Todes-Statistik-Analyse |
| **Der Hypeman** | Caps, viele Emotes | Emoji-Regen bei Subs |
| **Das Orakel** | Kryptisch, mysteriös | Schicksals-Vorhersagen |
| **Der DJ** | Cool, musikbezogen | "Keine Jukebox!" bei Wünschen |
| **Die Mutter** | Fürsorglich | "Hast du schon gegessen?" |
| **Der Historiker** | Gelehrt | Kanal-Lore-Datenbank |
| **Der Questgeber** | RPG-Stil | Quests & XP-System |

---

## Schnellstart

### Voraussetzungen

- Node.js 20+
- LM Studio (empfohlen für lokale KI)

### Installation

```bash
# 1. Repository klonen
git clone https://github.com/nicetoTECHyou/ChatBot.git
cd ChatBot

# 2. Setup-Skript ausführen
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Konfiguration bearbeiten
cp .env.example .env
nano .env  # Trage deine Twitch-Daten ein!

# 4. Bot starten
npm run start
```

### Docker (One-Click Deploy)

```bash
# Konfiguration anpassen
cp .env.example .env
nano .env

# Starten
docker compose up -d

# Logs ansehen
docker compose logs -f
```

### Admin Interface

Nach dem Start öffne: **http://localhost:3001**

- Standard-Benutzer: `admin`
- Standard-Passwort: `streamforge`
- Ändere das Passwort in der `.env` Datei!

---

## Konfiguration

### Twitch einrichten

1. Gehe zu https://twitchapps.com/tmi/
2. Autorisiere mit deinem Bot-Account
3. Kopiere den OAuth-Token in `.env` als `TWITCH_OAUTH_TOKEN`
4. Setze `TWITCH_CHANNELS=dein_channel_name`

### KI-Anbieter einrichten

#### LM Studio (Lokal - Standard)

1. Installiere [LM Studio](https://lmstudio.ai/)
2. Lade ein Modell (z.B. Qwen 2.5 7B Instruct)
3. Starte den lokalen Server (Standard: Port 1234)
4. LM Studio ist bereits voreingestellt!

#### OpenAI / Anthropic (Optional)

Trage deine API-Keys in der `.env` ein oder konfiguriere sie im Admin Dashboard.

### Umgebungsvariablen

Siehe `.env.example` für alle verfügbaren Optionen.

---

## Projektstruktur

```
StreamForge-AI/
├── packages/
│   ├── bot/           # Bot Engine (Node.js/TypeScript)
│   │   └── src/
│   │       ├── ai/        # KI-Fallback-Kette
│   │       ├── admin/     # API Server & Socket.IO
│   │       ├── chat/      # Twitch & Kick Connectors
│   │       ├── features/  # Quest, Death Counter, etc.
│   │       ├── memory/    # Chat History (Session)
│   │       ├── persona/   # Multi-Persona Manager
│   │       └── utils/     # DB, Logger, Config
│   ├── admin/         # Next.js Admin Dashboard
│   └── shared/        # Gemeinsame Types & Konstanten
├── docker/             # Dockerfiles
├── scripts/            # Setup & Deployment
├── docker-compose.yml
└── .env.example
```

---

## API Endpoints

Alle Endpunkte erfordern Basic Auth.

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/health` | Bot Status (ohne Auth) |
| GET | `/api/channels` | Alle Kanäle |
| POST | `/api/channels` | Kanal hinzufügen |
| GET | `/api/personas` | Alle Personas |
| PUT | `/api/personas/:id` | Persona bearbeiten |
| GET | `/api/ai/providers` | KI-Anbieter |
| PUT | `/api/ai/providers/:provider` | Anbieter konfigurieren |
| GET | `/api/game/:channelId` | Game State |
| POST | `/api/game/:channelId/death` | Death +1 |
| GET | `/api/chat/:channelId` | Chat History |
| GET | `/api/viewers/:channelId` | Top Zuschauer |
| GET | `/api/quests/:channelId` | Aktive Quests |
| GET | `/api/lore/:channelId` | Lore-Datenbank |

---

## Chat Commands

| Command | Beschreibung |
|---------|--------------|
| `!persona` | Aktive Persona anzeigen |
| `!persona <name>` | Persona wechseln (Mod) |
| `!personas` | Verfügbare Personas auflisten |
| `!waspassiert` | Stream-Zusammenfassung |
| `!tode` | Death-Counter anzeigen |
| `!xp` | Eigenes XP & Level |
| `!rank` | Eigener Rang |
| `!top` | Top 5 Zuschauer |
| `!quest` | Aktive Quests |
| `!lore` | Lore-Einträge |
| `!help` | Hilfe |

---

## Tech Stack

| Komponente | Technologie |
|-----------|-------------|
| Runtime | Node.js 20 / TypeScript |
| Twitch | tmi.js |
| Kick | WebSocket (Pusher) |
| KI | OpenAI SDK / Anthropic SDK / LM Studio |
| Datenbank | SQLite (better-sqlite3) |
| Admin UI | Next.js + Tailwind CSS |
| Real-time | Socket.IO |
| Deployment | Docker / Node.js |

---

## Roadmap

- [x] Phase 1: Foundation - Twitch/Kick, Multi-Persona, LM Studio Fallback, Admin UI
- [ ] Phase 2: Intelligence - Memory System, Lore-DB, Sentiment-Analysis, Quest-System
- [ ] Phase 3: Engagement - Predictive Welcoming, Inter-Persona Dialoge, Viewer-Profile
- [ ] Phase 4: Scale - Multi-Channel, Analytics Dashboard, KI-Highlights, DM-Integration

---

## Lizenz

MIT License - Siehe [LICENSE](LICENSE) für Details.

---

<p align="center">
  Erstellt mit ❤️ von <a href="https://github.com/nicetoTECHyou">nicetoTECHyou</a>
</p>
