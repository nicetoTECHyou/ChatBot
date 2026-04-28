// ============================================================
// nicetoAIyou Bot - Persona Manager
// ============================================================

import { logger } from '../utils/logger';
import { nicetoAIyouDB } from '../utils/database';
import { AIEngine } from '../ai/engine';
import type { PersonaConfig } from '@nicetoaiyou/shared';
import { config } from '../config';

export class PersonaManager {
  private db: nicetoAIyouDB;
  private ai: AIEngine;
  private activePersonas: Map<string, string> = new Map(); // channelId -> personaId
  private sentimentHistory: Map<string, { score: number; timestamp: number }[]> = new Map();

  constructor(db: nicetoAIyouDB, ai: AIEngine) {
    this.db = db;
    this.ai = ai;
  }

  initialize(channels: string[]): void {
    for (const channelId of channels) {
      const channel = this.db.getChannel(channelId);
      if (channel) {
        this.activePersonas.set(channelId, channel.activePersonaId || config.DEFAULT_PERSONA_ID);
      } else {
        this.activePersonas.set(channelId, config.DEFAULT_PERSONA_ID);
      }
    }
  }

  getActivePersona(channelId: string): PersonaConfig {
    const personaId = this.activePersonas.get(channelId) || config.DEFAULT_PERSONA_ID;
    const dbPersona = this.db.getPersona(personaId);

    if (dbPersona && dbPersona.enabled) {
      return this.mapDbToPersona(dbPersona);
    }

    // Fallback to first enabled persona
    const personas = this.db.getAllPersonas().filter(p => p.enabled);
    if (personas.length > 0) {
      this.activePersonas.set(channelId, personas[0].id);
      return this.mapDbToPersona(personas[0]);
    }

    // Emergency fallback
    return {
      id: 'default',
      name: 'Bot',
      description: 'Standard Bot Persona',
      systemPrompt: 'Du bist ein freundlicher Chat-Bot. Antworte kurz und freundlich (max 2 Sätze). Deutsch.',
      temperature: 0.7,
      maxTokens: 100,
      enabled: true,
      responseStyle: 'short',
      emoteStyle: [],
    };
  }

  setActivePersona(channelId: string, personaId: string): void {
    const persona = this.db.getPersona(personaId);
    if (persona && persona.enabled) {
      this.activePersonas.set(channelId, personaId);
      this.db.setActivePersona(channelId, personaId);
      logger.info(`Persona for ${channelId} changed to: ${persona.name} (${personaId})`);
    } else {
      logger.warn(`Cannot set persona ${personaId}: not found or disabled`);
    }
  }

  getActivePersonaId(channelId: string): string {
    return this.activePersonas.get(channelId) || config.DEFAULT_PERSONA_ID;
  }

  getAllPersonas(): PersonaConfig[] {
    return this.db.getAllPersonas().filter(p => p.enabled).map(p => this.mapDbToPersona(p));
  }

  // ---- Dynamic Persona Switching ----
  checkGameBasedSwitch(channelId: string, currentGame: string): PersonaConfig | null {
    if (!config.AUTO_PERSONA_SWITCH) return null;

    const personas = this.db.getAllPersonas().filter(p => p.enabled);
    const gameCategories = JSON.parse(personas[0]?.game_categories || '[]') as string[];

    // Game-to-persona mapping
    const gamePersonaMap: Record<string, string[]> = {
      'horror': ['das-orakel'],
      'strategy': ['der-kritiker'],
      'fps': ['der-hypeman'],
      'shooter': ['der-hypeman'],
      'rpg': ['der-questgeber'],
      'music': ['der-dj'],
      'just chatting': ['die-mutter'],
    };

    for (const [keyword, personaIds] of Object.entries(gamePersonaMap)) {
      if (currentGame.toLowerCase().includes(keyword)) {
        for (const pid of personaIds) {
          if (this.activePersonas.get(channelId) !== pid) {
            const persona = this.db.getPersona(pid);
            if (persona?.enabled) {
              this.setActivePersona(channelId, pid);
              logger.info(`Auto-switched persona for ${channelId}: game "${currentGame}" -> ${persona.name}`);
              return this.mapDbToPersona(persona);
            }
          }
        }
      }
    }

    return null;
  }

  checkSentimentBasedSwitch(channelId: string, sentimentScore: number): PersonaConfig | null {
    if (!config.SENTIMENT_PERSONA_SWITCH) return null;

    const currentId = this.activePersonas.get(channelId);

    // If chat is very negative, switch to de-escalating persona
    if (sentimentScore < -0.5 && currentId !== 'die-mutter') {
      const persona = this.db.getPersona('die-mutter');
      if (persona?.enabled) {
        this.setActivePersona(channelId, 'die-mutter');
        logger.info(`Sentiment switch for ${channelId}: negative mood -> Die Mutter`);
        return this.mapDbToPersona(persona);
      }
    }

    return null;
  }

  updateSentiment(channelId: string, score: number): void {
    if (!this.sentimentHistory.has(channelId)) {
      this.sentimentHistory.set(channelId, []);
    }

    const history = this.sentimentHistory.get(channelId)!;
    history.push({ score, timestamp: Date.now() });

    // Keep last 50 sentiment readings
    while (history.length > 50) {
      history.shift();
    }
  }

  getAverageSentiment(channelId: string): number {
    const history = this.sentimentHistory.get(channelId) || [];
    if (history.length === 0) return 0;
    return history.reduce((sum, h) => sum + h.score, 0) / history.length;
  }

  private mapDbToPersona(dbPersona: any): PersonaConfig {
    return {
      id: dbPersona.id,
      name: dbPersona.name,
      description: dbPersona.description,
      systemPrompt: dbPersona.system_prompt,
      temperature: dbPersona.temperature,
      maxTokens: dbPersona.max_tokens,
      enabled: !!dbPersona.enabled,
      responseStyle: dbPersona.response_style,
      emoteStyle: JSON.parse(dbPersona.emote_style || '[]'),
      specialFeatures: JSON.parse(dbPersona.special_features || '{}'),
      triggers: JSON.parse(dbPersona.triggers || '[]'),
      gameCategories: JSON.parse(dbPersona.game_categories || '[]'),
    };
  }
}
