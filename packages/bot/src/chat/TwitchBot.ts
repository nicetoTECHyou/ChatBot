// ============================================================
// StreamForge AI Bot - Twitch Chat Connector
// ============================================================

import tmi from 'tmi.js';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { StreamForgeDB } from '../utils/database';
import { ChatMemory } from '../memory/ChatMemory';
import { AIEngine } from '../ai/engine';
import { PersonaManager } from '../persona/PersonaManager';
import { QuestSystem } from '../features/QuestSystem';
import { DeathCounter } from '../features/DeathCounter';
import type { ChatMessage, ChannelConfig } from '@streamforge/shared';

export class TwitchBot extends EventEmitter {
  private client: any = null;
  private db: StreamForgeDB;
  private memory: ChatMemory;
  private ai: AIEngine;
  private personaManager: PersonaManager;
  private questSystem: QuestSystem;
  private deathCounter: DeathCounter;
  private connected = false;
  private commandCooldowns: Map<string, number> = new Map();

  constructor(db: StreamForgeDB, memory: ChatMemory, ai: AIEngine, personaManager: PersonaManager, questSystem: QuestSystem, deathCounter: DeathCounter) {
    super();
    this.db = db;
    this.memory = memory;
    this.ai = ai;
    this.personaManager = personaManager;
    this.questSystem = questSystem;
    this.deathCounter = deathCounter;
  }

  async connect(channels: ChannelConfig[]): Promise<void> {
    const enabledChannels = channels.filter(c => c.enabled && c.platform === 'twitch' && c.oauthToken);

    if (enabledChannels.length === 0) {
      logger.warn('No enabled Twitch channels with OAuth token configured - cannot connect');
      return;
    }

    // Disconnect existing connection first
    if (this.client) {
      this.client.disconnect();
      this.client = null;
      this.connected = false;
    }

    const channelNames = enabledChannels.map(c => c.channelName);

    // Use first channel's OAuth token (single token for bot account)
    const oauthToken = enabledChannels[0].oauthToken!;

    this.client = new (tmi as any).Client({
      identity: {
        username: process.env.TWITCH_USERNAME || 'streamforgebot',
        password: oauthToken,
      },
      channels: channelNames,
      connection: {
        reconnect: true,
        secure: true,
      },
    });

    this.client.on('connected', (addr: any, port: any) => {
      logger.info(`Twitch connected to ${addr}:${port}`);
      this.connected = true;
      for (const ch of enabledChannels) {
        this.emit('bot:connected', ch.channelName);
      }
    });

    this.client.on('disconnected', (reason: any) => {
      logger.warn(`Twitch disconnected: ${reason}`);
      this.connected = false;
      for (const ch of enabledChannels) {
        this.emit('bot:disconnected', ch.channelName);
      }
    });

    this.client.on('message', (channel: any, tags: any, text: string, self: boolean) => {
      if (self) return;
      void this.handleMessage(channel, tags, text);
    });

    this.client.on('join', (channel: any, username: any, self: any) => {
      if (self) {
        logger.info(`Joined Twitch channel: ${channel}`);
      }
    });

    try {
      await this.client.connect();
      logger.info(`Twitch bot connected to channels: ${channelNames.join(', ')}`);
    } catch (error: any) {
      logger.error(`Failed to connect to Twitch: ${error.message}`);
      throw error;
    }
  }

  private async handleMessage(channel: string, tags: any, text: string): Promise<void> {
    const channelId = channel.replace('#', '');
    const channelConfig = this.db.getChannel(channelId);
    if (!channelConfig || !channelConfig.enabled) return;

    const chatMessage: ChatMessage = {
      id: `${channelId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      platform: 'twitch',
      channelId,
      username: tags.username || 'unknown',
      userId: tags['user-id'] || '',
      displayName: tags['display-name'] || tags.username || 'Unknown',
      text,
      isBroadcaster: tags.badges?.broadcaster === '1',
      isMod: tags.mod || false,
      isSubscriber: tags.subscriber || false,
      isVip: tags.badges?.vip === '1',
      badges: tags.badges,
      timestamp: new Date(),
      replyTo: tags['reply-parent-msg-id'],
    };

    this.memory.addMessage(channelId, chatMessage);

    this.db.upsertViewer({
      channelId,
      userId: chatMessage.userId,
      username: chatMessage.username,
      displayName: chatMessage.displayName,
      platform: 'twitch',
    });

    this.db.incrementStat(channelId, 'total_messages');
    this.emit('chat:message', chatMessage);

    const isCommand = text.startsWith('!');
    if (isCommand) {
      await this.handleCommand(channelId, chatMessage, channelConfig);
      return;
    }

    if (text.length < 3) return;
    if (chatMessage.username.toLowerCase() === 'streamforgebot') return;

    await this.generateBotResponse(channelId, chatMessage, channelConfig);
  }

  private async handleCommand(channelId: string, message: ChatMessage, channelConfig: ChannelConfig): Promise<void> {
    const parts = message.text.slice(1).trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    const isAdmin = message.isMod || message.isBroadcaster;

    const cooldownKey = `${channelId}:${command}`;
    const lastUsed = this.commandCooldowns.get(cooldownKey);
    if (lastUsed && Date.now() - lastUsed < 5000) return;
    this.commandCooldowns.set(cooldownKey, Date.now());

    switch (command) {
      case 'persona': {
        if (!isAdmin) return;
        const personaId = args[0];
        if (personaId) {
          const persona = this.db.getPersona(personaId);
          if (persona && persona.enabled) {
            this.personaManager.setActivePersona(channelId, personaId);
            this.say(channelId, `Persona gewechselt zu: ${persona.name}`);
            this.emit('persona:changed', { personaId, personaName: persona.name, trigger: 'command' });
          } else {
            this.say(channelId, `Persona "${personaId}" nicht gefunden oder deaktiviert.`);
          }
        } else {
          const active = this.personaManager.getActivePersona(channelId);
          this.say(channelId, `Aktive Persona: ${active.name}`);
        }
        break;
      }
      case 'personas': {
        const personas = this.db.getAllPersonas().filter(p => p.enabled);
        const list = personas.map(p => `${p.name} (${p.id})`).join(', ');
        this.say(channelId, `Verfügbare Personas: ${list}`);
        break;
      }
      case 'waspassiert':
      case 'catchup': {
        const gameState = this.db.getGameState(channelId);
        const activePersona = this.personaManager.getActivePersona(channelId);
        const summary = this.questSystem.generateStreamSummary(channelId, gameState, activePersona.name);
        this.say(channelId, summary);
        break;
      }
      case 'tode':
      case 'deaths': {
        const gameState = this.db.getGameState(channelId);
        const deathMsg = this.deathCounter.getDeathMessage(channelId, gameState, this.personaManager.getActivePersona(channelId).name);
        this.say(channelId, deathMsg);
        break;
      }
      case 'xp':
      case 'level': {
        const viewer = this.db.getViewer(channelId, message.userId);
        if (viewer) {
          const nextLevel = viewer.level + 1;
          const xpNeeded = Math.pow(nextLevel, 2) * 50;
          this.say(channelId, `${viewer.displayName} - Level ${viewer.level} | XP: ${viewer.xp}/${xpNeeded} | Nächstes Level: ${xpNeeded - viewer.xp} XP`);
        } else {
          this.say(channelId, `${message.displayName}, du bist noch nicht registriert. Schreib ein paar Nachrichten!`);
        }
        break;
      }
      case 'rank': {
        const viewer = this.db.getViewer(channelId, message.userId);
        if (viewer) {
          const topViewers = this.db.getTopViewers(channelId);
          const rank = topViewers.findIndex(v => v.userId === viewer.userId) + 1;
          this.say(channelId, `${viewer.displayName} - Rang #${rank} | Level ${viewer.level} | ${viewer.xp} XP`);
        }
        break;
      }
      case 'top': {
        const topViewers = this.db.getTopViewers(channelId, 5);
        const list = topViewers.map((v, i) => `${i + 1}. ${v.displayName} (Lv.${v.level})`).join(' | ');
        this.say(channelId, `Top 5: ${list}`);
        break;
      }
      case 'quest': {
        const activeQuests = this.questSystem.getActiveQuests(channelId);
        if (activeQuests.length === 0) {
          this.say(channelId, 'Keine aktiven Quests.');
        } else {
          const questList = activeQuests.map(q => `"${q.name}" - ${q.progress}/${q.target}`).join(' | ');
          this.say(channelId, `Aktive Quests: ${questList}`);
        }
        break;
      }
      case 'lore': {
        const loreEntries = this.db.getLoreEntries(channelId);
        if (loreEntries.length === 0) {
          this.say(channelId, 'Noch keine Lore-Einträge vorhanden.');
        } else {
          const titles = loreEntries.slice(0, 5).map(l => `"${l.title}"`).join(', ');
          this.say(channelId, `Lore-Datenbank: ${titles}${loreEntries.length > 5 ? ' ...' : ''}`);
        }
        break;
      }
      case 'help': {
        this.say(channelId, 'Commands: !persona, !personas, !waspassiert, !tode, !xp, !rank, !top, !quest, !lore, !help');
        break;
      }
    }
  }

  private async generateBotResponse(channelId: string, message: ChatMessage, channelConfig: ChannelConfig): Promise<void> {
    const activePersona = this.personaManager.getActivePersona(channelId);
    const chatHistory = this.memory.getHistory(channelId);

    try {
      const response = await this.ai.generateResponse(
        message,
        chatHistory,
        activePersona.systemPrompt,
        activePersona.name,
        activePersona.id,
        activePersona.maxTokens,
        activePersona.temperature
      );

      if (response.text && response.text !== 'no_response') {
        const isMentioned = message.text.toLowerCase().includes('bot') ||
          message.text.toLowerCase().includes(activePersona.name.toLowerCase().replace('der ', '').replace('die ', '').replace('das ', ''));
        const isQuestion = message.text.includes('?');

        if (isMentioned || isQuestion || Math.random() > 0.85) {
          this.say(channelId, response.text);
          this.emit('bot:response', response);
          this.db.incrementStat(channelId, 'ai_responses');
        }
      }
    } catch (error: any) {
      logger.error(`Failed to generate response: ${error.message}`);
    }

    this.questSystem.checkMessageForQuest(channelId, message);
  }

  say(channel: string, message: string): void {
    if (this.client) {
      this.client.say(channel, message.substring(0, 500));
      logger.info(`[TWITCH] > ${channel}: ${message.substring(0, 80)}${message.length > 80 ? '...' : ''}`);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
      this.connected = false;
    }
  }
}
