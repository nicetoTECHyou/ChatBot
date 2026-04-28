// ============================================================
// StreamForge AI Bot - Kick Chat Connector
// ============================================================

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { StreamForgeDB } from '../utils/database';
import { ChatMemory } from '../memory/ChatMemory';
import { AIEngine } from '../ai/engine';
import { PersonaManager } from '../persona/PersonaManager';
import { QuestSystem } from '../features/QuestSystem';
import { DeathCounter } from '../features/DeathCounter';
import type { ChatMessage, ChannelConfig } from '@streamforge/shared';

interface KickMessage {
  event?: string;
  data?: {
    id: string;
    chatroom_id: string;
    content: string;
    sender?: {
      id: string;
      username: string;
      slug?: string;
      is_moderator?: boolean;
      is_subscriber?: boolean;
      verified?: boolean;
      displayname?: string;
    };
    created_at?: string;
  };
}

export class KickBot extends EventEmitter {
  private ws: WebSocket | null = null;
  private db: StreamForgeDB;
  private memory: ChatMemory;
  private ai: AIEngine;
  private personaManager: PersonaManager;
  private questSystem: QuestSystem;
  private deathCounter: DeathCounter;
  private connected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private channels: Map<string, { chatroomId: string; channelName: string }> = new Map();

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
    const kickChannels = channels.filter(c => c.enabled && c.platform === 'kick');

    if (kickChannels.length === 0) {
      logger.info('No Kick channels configured');
      return;
    }

    for (const ch of kickChannels) {
      this.channels.set(ch.channelId, { chatroomId: ch.channelId, channelName: ch.channelName });
    }

    this.connectWebSocket();
  }

  private connectWebSocket(): void {
    const wsUrl = 'wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=8.4.0-rc2';

    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      logger.info('Kick WebSocket connected');
      this.connected = true;

      for (const [channelId, info] of this.channels.entries()) {
        this.subscribeChannel(channelId, info.channelName);
        this.emit('bot:connected', info.channelName);
      }

      this.pingTimer = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.ping();
        }
      }, 30000);
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString()) as KickMessage;
        this.handleKickMessage(msg);
      } catch {
        // Non-JSON message
      }
    });

    this.ws.on('close', () => {
      logger.warn('Kick WebSocket disconnected');
      this.connected = false;
      this.cleanup();
      this.emit('bot:disconnected', 'kick');
      this.reconnectTimer = setTimeout(() => {
        logger.info('Attempting to reconnect to Kick...');
        this.connectWebSocket();
      }, 10000);
    });

    this.ws.on('error', (error) => {
      logger.error(`Kick WebSocket error: ${error.message}`);
    });
  }

  private subscribeChannel(channelId: string, channelName: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      event: 'pusher:subscribe',
      data: { auth: '', channel: `chatroom.${channelId}` },
    }));
    logger.info(`Subscribed to Kick channel: ${channelName} (${channelId})`);
  }

  private async handleKickMessage(msg: KickMessage): Promise<void> {
    if (msg.event === 'pusher:pong' || msg.event === 'pusher:connection_established') {
      return;
    }

    if (msg.event === 'App\\Events\\ChatMessageEvent' && msg.data) {
      const data = msg.data;
      if (!data.sender) return;

      let channelId = '';
      for (const [id] of this.channels.entries()) {
        if (id === data.chatroom_id) { channelId = id; break; }
      }
      if (!channelId) return;

      const channelConfig = this.db.getChannel(channelId);
      if (!channelConfig || !channelConfig.enabled) return;

      const chatMessage: ChatMessage = {
        id: data.id || `${channelId}-${Date.now()}`,
        platform: 'kick',
        channelId,
        username: data.sender.username || 'unknown',
        userId: data.sender.id || '',
        displayName: data.sender.displayname || data.sender.username || 'Unknown',
        text: data.content || '',
        isBroadcaster: false,
        isMod: data.sender.is_moderator || false,
        isSubscriber: data.sender.is_subscriber || false,
        isVip: false,
        timestamp: data.created_at ? new Date(data.created_at) : new Date(),
      };

      this.memory.addMessage(channelId, chatMessage);
      this.db.upsertViewer({
        channelId, userId: chatMessage.userId, username: chatMessage.username,
        displayName: chatMessage.displayName, platform: 'kick',
      });
      this.db.incrementStat(channelId, 'total_messages');
      this.emit('chat:message', chatMessage);

      if (chatMessage.text.startsWith('!')) {
        await this.handleCommand(channelId, chatMessage, channelConfig);
        return;
      }

      if (chatMessage.text.length >= 3) {
        await this.generateBotResponse(channelId, chatMessage, channelConfig);
      }

      this.questSystem.checkMessageForQuest(channelId, chatMessage);
    }
  }

  private async handleCommand(channelId: string, message: ChatMessage, channelConfig: ChannelConfig): Promise<void> {
    const parts = message.text.slice(1).trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    const isAdmin = message.isMod;

    switch (command) {
      case 'persona': {
        if (!isAdmin) return;
        if (args[0]) {
          const persona = this.db.getPersona(args[0]);
          if (persona && persona.enabled) {
            this.personaManager.setActivePersona(channelId, args[0]);
            this.sayKick(channelId, `Persona gewechselt zu: ${persona.name}`);
            this.emit('persona:changed', { personaId: args[0], personaName: persona.name, trigger: 'command' });
          }
        }
        break;
      }
      case 'waspassiert': {
        const gameState = this.db.getGameState(channelId);
        const activePersona = this.personaManager.getActivePersona(channelId);
        this.sayKick(channelId, this.questSystem.generateStreamSummary(channelId, gameState, activePersona.name));
        break;
      }
      case 'xp': {
        const viewer = this.db.getViewer(channelId, message.userId);
        if (viewer) {
          this.sayKick(channelId, `${viewer.displayName} - Level ${viewer.level} | XP: ${viewer.xp}`);
        }
        break;
      }
      case 'help': {
        this.sayKick(channelId, 'Commands: !persona, !waspassiert, !xp, !rank, !top, !quest, !help');
        break;
      }
    }
  }

  private async generateBotResponse(channelId: string, message: ChatMessage, channelConfig: ChannelConfig): Promise<void> {
    const activePersona = this.personaManager.getActivePersona(channelId);
    const chatHistory = this.memory.getHistory(channelId);

    try {
      const response = await this.ai.generateResponse(
        message, chatHistory, activePersona.systemPrompt, activePersona.name,
        activePersona.id, activePersona.maxTokens, activePersona.temperature,
      );
      if (response.text && response.text !== 'no_response') {
        const isMentioned = message.text.toLowerCase().includes('bot');
        const isQuestion = message.text.includes('?');
        if (isMentioned || isQuestion || Math.random() > 0.85) {
          this.sayKick(channelId, response.text);
          this.emit('bot:response', response);
          this.db.incrementStat(channelId, 'ai_responses');
        }
      }
    } catch (error: any) {
      logger.error(`Failed to generate Kick response: ${error.message}`);
    }
  }

  say(channelId: string, message: string): void { this.sayKick(channelId, message); }

  private sayKick(channelId: string, message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      logger.info(`[KICK] > ${channelId}: ${message.substring(0, 80)}`);
    }
  }

  isConnected(): boolean { return this.connected; }

  private cleanup(): void {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
  }

  disconnect(): void {
    this.cleanup();
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.connected = false;
  }
}
