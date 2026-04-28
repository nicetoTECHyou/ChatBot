// ============================================================
// StreamForge AI Bot - Environment Configuration
// ============================================================

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  ADMIN_PORT: parseInt(process.env.ADMIN_PORT || '3001', 10),
  HOST: process.env.HOST || '0.0.0.0',

  // Twitch
  TWITCH_CHANNELS: (process.env.TWITCH_CHANNELS || '').split(',').filter(Boolean),
  TWITCH_USERNAME: process.env.TWITCH_USERNAME || 'streamforgebot',
  TWITCH_OAUTH_TOKEN: process.env.TWITCH_OAUTH_TOKEN || '',
  TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID || '',

  // Kick
  KICK_CHANNELS: (process.env.KICK_CHANNELS || '').split(',').filter(Boolean),
  KICK_USERNAME: process.env.KICK_USERNAME || '',
  KICK_OAUTH_TOKEN: process.env.KICK_OAUTH_TOKEN || '',

  // AI Providers
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  LM_STUDIO_URL: process.env.LM_STUDIO_URL || 'http://localhost:1234/v1',
  LM_STUDIO_MODEL: process.env.LM_STUDIO_MODEL || 'qwen2.5-7b-instruct',

  // AI Settings
  AI_DEFAULT_PROVIDER: (process.env.AI_DEFAULT_PROVIDER || 'lmstudio') as 'anthropic' | 'openai' | 'lmstudio',
  AI_TEMPERATURE: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  AI_MAX_TOKENS: parseInt(process.env.AI_MAX_TOKENS || '150', 10),
  AI_RESPONSE_MAX_LENGTH: parseInt(process.env.AI_RESPONSE_MAX_LENGTH || '280', 10),

  // Chat History
  MAX_CHAT_HISTORY: parseInt(process.env.MAX_CHAT_HISTORY || '40', 10),
  MAX_RESPONSE_LENGTH: parseInt(process.env.MAX_RESPONSE_LENGTH || '300', 10),

  // Rate Limiting
  AI_RATE_LIMIT_PER_MINUTE: parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || '30', 10),
  BOT_COOLDOWN_MS: parseInt(process.env.BOT_COOLDOWN_MS || '3000', 10),
  SAME_USER_COOLDOWN_MS: parseInt(process.env.SAME_USER_COOLDOWN_MS || '10000', 10),
  RESPONSE_PROBABILITY: parseFloat(process.env.RESPONSE_PROBABILITY || '0.8'),

  // Database
  DB_PATH: process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'streamforge.db'),

  // Redis (optional)
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Features
  ENABLE_TWITCH: (process.env.ENABLE_TWITCH || 'true') === 'true',
  ENABLE_KICK: (process.env.ENABLE_KICK || 'false') === 'true',
  ENABLE_QUEST_SYSTEM: (process.env.ENABLE_QUEST_SYSTEM || 'true') === 'true',
  ENABLE_DEATH_COUNTER: (process.env.ENABLE_DEATH_COUNTER || 'true') === 'true',
  ENABLE_SENTIMENT_ANALYSIS: (process.env.ENABLE_SENTIMENT_ANALYSIS || 'true') === 'true',
  ENABLE_PREDICTIVE_WELCOME: (process.env.ENABLE_PREDICTIVE_WELCOME || 'true') === 'true',

  // Persona
  DEFAULT_PERSONA_ID: process.env.DEFAULT_PERSONA_ID || 'der-kritiker',
  AUTO_PERSONA_SWITCH: (process.env.AUTO_PERSONA_SWITCH || 'true') === 'true',
  SENTIMENT_PERSONA_SWITCH: (process.env.SENTIMENT_PERSONA_SWITCH || 'true') === 'true',

  // Admin
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'streamforge',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
