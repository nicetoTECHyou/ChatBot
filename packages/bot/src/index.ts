// ============================================================
// StreamForge AI Bot - Main Entry Point
// ============================================================

import chalk from 'chalk';
import { logger } from './utils/logger';
import { config } from './config';
import { StreamForgeDB } from './utils/database';
import { ChatMemory } from './memory/ChatMemory';
import { AIEngine } from './ai/engine';
import { PersonaManager } from './persona/PersonaManager';
import { QuestSystem } from './features/QuestSystem';
import { DeathCounter } from './features/DeathCounter';
import { TwitchBot } from './chat/TwitchBot';
import { KickBot } from './chat/KickBot';
import { createAdminServer } from './admin/server';

class StreamForgeBot {
  private db: StreamForgeDB;
  private memory: ChatMemory;
  private ai: AIEngine;
  private personaManager: PersonaManager;
  private questSystem: QuestSystem;
  private deathCounter: DeathCounter;
  private twitchBot: TwitchBot;
  private kickBot: KickBot;
  private adminServer: ReturnType<typeof createAdminServer>;

  constructor() {
    // Initialize database
    this.db = new StreamForgeDB();

    // Initialize chat memory (session-based)
    this.memory = new ChatMemory(config.MAX_CHAT_HISTORY);

    // Initialize AI engine with fallback chain
    this.ai = new AIEngine(this.db);

    // Initialize persona manager
    this.personaManager = new PersonaManager(this.db, this.ai);

    // Initialize feature modules
    this.questSystem = new QuestSystem(this.db);
    this.deathCounter = new DeathCounter(this.db);

    // Initialize chat connectors
    this.twitchBot = new TwitchBot(
      this.db, this.memory, this.ai, this.personaManager,
      this.questSystem, this.deathCounter
    );

    this.kickBot = new KickBot(
      this.db, this.memory, this.ai, this.personaManager,
      this.questSystem, this.deathCounter
    );

    // Initialize admin server
    this.adminServer = createAdminServer(
      this.db, this.ai, this.personaManager,
      this.questSystem, this.deathCounter, this.memory,
      this.twitchBot, this.kickBot
    );

    // Wire events
    this.setupEventForwarding();
  }

  private setupEventForwarding(): void {
    // Forward Twitch events to Socket.IO
    this.twitchBot.on('chat:message', (msg) => {
      this.adminServer.io.emit('chat:message', msg);
    });

    this.twitchBot.on('bot:response', (response) => {
      this.adminServer.io.emit('bot:response', response);
    });

    this.twitchBot.on('persona:changed', (data) => {
      this.adminServer.io.emit('persona:changed', data);
    });

    this.twitchBot.on('bot:connected', (channel) => {
      this.adminServer.io.emit('bot:status', { connected: true, platform: 'twitch', channel });
      logger.info(chalk.green(`Twitch connected to channel: ${channel}`));
    });

    this.twitchBot.on('bot:disconnected', (channel) => {
      this.adminServer.io.emit('bot:status', { connected: false, platform: 'twitch', channel });
    });

    // Forward Kick events
    this.kickBot.on('chat:message', (msg) => {
      this.adminServer.io.emit('chat:message', msg);
    });

    this.kickBot.on('bot:response', (response) => {
      this.adminServer.io.emit('bot:response', response);
    });

    this.kickBot.on('bot:connected', (channel) => {
      this.adminServer.io.emit('bot:status', { connected: true, platform: 'kick', channel });
      logger.info(chalk.green(`Kick connected to channel: ${channel}`));
    });
  }

  async start(): Promise<void> {
    logger.info(chalk.bold.blue(`
  ╔══════════════════════════════════════╗
  ║      StreamForge AI Bot v0.1.0       ║
  ║   KI-Chat-Bot für Twitch & Kick     ║
  ╚══════════════════════════════════════╝
    `));

    // Load channels from DB
    const channels = this.db.getChannels();

    if (channels.length === 0) {
      logger.warn(chalk.yellow(`
  ⚠️  Keine Kanäle konfiguriert!
  ℹ️  Bitte konfiguriere deinen ersten Kanal über das Admin Interface:
  ℹ️  http://localhost:${config.ADMIN_PORT}
  ℹ️  Benutzer: ${config.ADMIN_USERNAME}
  ℹ️  Passwort: ${config.ADMIN_PASSWORD}
      `));
    }

    // Initialize persona manager with channels
    const channelIds = channels.map(c => c.channelId);
    this.personaManager.initialize(channelIds);
    this.questSystem.initialize(channelIds);

    // Connect to Twitch
    if (config.ENABLE_TWITCH && channels.some(c => c.platform === 'twitch' && c.enabled)) {
      try {
        await this.twitchBot.connect(channels);
      } catch (error: any) {
        logger.error(chalk.red(`Twitch connection failed: ${error.message}`));
        logger.warn(chalk.yellow('You can configure Twitch in the Admin UI after startup.'));
      }
    }

    // Connect to Kick
    if (config.ENABLE_KICK && channels.some(c => c.platform === 'kick' && c.enabled)) {
      try {
        await this.kickBot.connect(channels);
      } catch (error: any) {
        logger.error(chalk.red(`Kick connection failed: ${error.message}`));
      }
    }

    // Start admin server
    this.adminServer.server.listen(config.ADMIN_PORT, () => {
      logger.info(chalk.green(`  🌐 Admin Interface: http://localhost:${config.ADMIN_PORT}`));
      logger.info(chalk.green(`  📊 API Endpoints:    http://localhost:${config.ADMIN_PORT}/api`));
      logger.info(chalk.cyan(`  👤 Benutzer:        ${config.ADMIN_USERNAME}`));
      logger.info(chalk.cyan(`  🔑 Passwort:        ${config.ADMIN_PASSWORD}`));
    });

    // LM Studio check
    this.checkLMStudioConnection();

    logger.info(chalk.green('  ✅ StreamForge AI Bot ist bereit!\n'));
  }

  private async checkLMStudioConnection(): Promise<void> {
    const providers = this.db.getAIProviders();
    const lmStudio = providers.find(p => p.provider === 'lmstudio' && p.enabled);

    if (lmStudio) {
      const url = lmStudio.base_url || config.LM_STUDIO_URL;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`${url}/models`, { signal: controller.signal });
        clearTimeout(timeout);
        if (response.ok) {
          const data = await response.json() as { data: Array<{ id: string }> };
          const models = data.data.map(m => m.id);
          logger.info(chalk.green(`  🤖 LM Studio verbunden: ${models.join(', ') || 'Keine Modelle geladen'}`));
        } else {
          logger.warn(chalk.yellow(`  ⚠️  LM Studio erreichbar aber Fehler: ${response.status}`));
        }
      } catch {
        logger.warn(chalk.yellow(`  ⚠️  LM Studio nicht erreichbar unter ${url}`));
        logger.warn(chalk.yellow('     Starte LM Studio oder konfiguriere Cloud-KI im Admin Panel.'));
      }
    }
  }

  async stop(): Promise<void> {
    logger.info('Shutting down StreamForge AI...');
    this.twitchBot.disconnect();
    this.kickBot.disconnect();
    this.adminServer.server.close();
    this.memory.clearAll();
    this.db.close();
    logger.info('Shutdown complete.');
    process.exit(0);
  }
}

// Start the bot
const bot = new StreamForgeBot();

process.on('SIGINT', () => bot.stop());
process.on('SIGTERM', () => bot.stop());

bot.start().catch((error) => {
  logger.error(`Failed to start bot: ${error.message}`);
  process.exit(1);
});

export { StreamForgeBot };
