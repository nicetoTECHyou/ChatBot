// ============================================================
// nicetoAIyou Bot - SQLite Database
// ============================================================

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';
import { config } from '../config';
import type { ChannelConfig, CustomCommand, LoreEntry, ViewerProfile, GameState, StreamStats } from '@nicetoaiyou/shared';

export class nicetoAIyouDB {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath || config.DB_PATH;
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(resolvedPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initialize();
    logger.info(`Database initialized at ${resolvedPath}`);
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS channels (
        channel_id TEXT PRIMARY KEY,
        platform TEXT NOT NULL DEFAULT 'twitch',
        channel_name TEXT NOT NULL,
        oauth_token TEXT DEFAULT '',
        client_id TEXT DEFAULT '',
        enabled INTEGER DEFAULT 0,
        active_persona_id TEXT DEFAULT 'der-kritiker',
        max_chat_history INTEGER DEFAULT 40,
        game_awareness INTEGER DEFAULT 1,
        death_counter INTEGER DEFAULT 1,
        quest_system INTEGER DEFAULT 1,
        predictive_welcome INTEGER DEFAULT 1,
        sentiment_analysis INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS personas (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        system_prompt TEXT NOT NULL,
        temperature REAL DEFAULT 0.7,
        max_tokens INTEGER DEFAULT 100,
        enabled INTEGER DEFAULT 1,
        response_style TEXT DEFAULT 'short',
        triggers TEXT DEFAULT '[]',
        game_categories TEXT DEFAULT '[]',
        emote_style TEXT DEFAULT '[]',
        special_features TEXT DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS ai_providers (
        provider TEXT PRIMARY KEY,
        api_key TEXT DEFAULT '',
        base_url TEXT DEFAULT '',
        model TEXT NOT NULL,
        priority INTEGER DEFAULT 5,
        enabled INTEGER DEFAULT 0,
        max_tokens_per_minute INTEGER DEFAULT 40000,
        max_tokens_per_day INTEGER DEFAULT 1000000
      );

      CREATE TABLE IF NOT EXISTS viewers (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        display_name TEXT NOT NULL,
        platform TEXT DEFAULT 'twitch',
        channel_id TEXT NOT NULL,
        first_seen TEXT DEFAULT (datetime('now')),
        last_seen TEXT DEFAULT (datetime('now')),
        message_count INTEGER DEFAULT 0,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        notes TEXT DEFAULT '',
        FOREIGN KEY (channel_id) REFERENCES channels(channel_id)
      );

      CREATE TABLE IF NOT EXISTS custom_commands (
        name TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        response TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        cooldown INTEGER DEFAULT 5,
        min_level INTEGER DEFAULT 0,
        persona_override TEXT DEFAULT NULL,
        FOREIGN KEY (channel_id) REFERENCES channels(channel_id)
      );

      CREATE TABLE IF NOT EXISTS lore_entries (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT DEFAULT '[]',
        priority INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (channel_id) REFERENCES channels(channel_id)
      );

      CREATE TABLE IF NOT EXISTS game_state (
        channel_id TEXT PRIMARY KEY,
        current_game TEXT DEFAULT 'Just Chatting',
        current_scene TEXT DEFAULT '',
        death_count INTEGER DEFAULT 0,
        achievement_count INTEGER DEFAULT 0,
        session_start TEXT DEFAULT (datetime('now')),
        viewer_count INTEGER DEFAULT 0,
        is_live INTEGER DEFAULT 0,
        FOREIGN KEY (channel_id) REFERENCES channels(channel_id)
      );

      CREATE TABLE IF NOT EXISTS stream_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT NOT NULL,
        session_start TEXT DEFAULT (datetime('now')),
        total_messages INTEGER DEFAULT 0,
        unique_viewers INTEGER DEFAULT 0,
        ai_responses INTEGER DEFAULT 0,
        quest_completions INTEGER DEFAULT 0,
        death_count INTEGER DEFAULT 0,
        ai_cost_tokens INTEGER DEFAULT 0,
        FOREIGN KEY (channel_id) REFERENCES channels(channel_id)
      );

      CREATE TABLE IF NOT EXISTS quests (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        type TEXT DEFAULT 'daily',
        persona_id TEXT DEFAULT NULL,
        target INTEGER DEFAULT 1,
        xp_reward INTEGER DEFAULT 10,
        duration INTEGER DEFAULT NULL,
        active INTEGER DEFAULT 0,
        progress INTEGER DEFAULT 0,
        started_at TEXT DEFAULT NULL,
        requirements TEXT DEFAULT '[]',
        FOREIGN KEY (channel_id) REFERENCES channels(channel_id)
      );

      CREATE TABLE IF NOT EXISTS quest_participants (
        quest_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        PRIMARY KEY (quest_id, user_id),
        FOREIGN KEY (quest_id) REFERENCES quests(id),
        FOREIGN KEY (user_id) REFERENCES viewers(user_id),
        FOREIGN KEY (channel_id) REFERENCES channels(channel_id)
      );

      CREATE INDEX IF NOT EXISTS idx_viewers_channel ON viewers(channel_id);
      CREATE INDEX IF NOT EXISTS idx_viewers_xp ON viewers(xp DESC);
      CREATE INDEX IF NOT EXISTS idx_quests_channel ON quests(channel_id);
      CREATE INDEX IF NOT EXISTS idx_quests_active ON quests(active);
    `);

    this.seedDefaults();
  }

  private seedDefaults(): void {
    const personaCount = this.db.prepare('SELECT COUNT(*) as c FROM personas').get() as { c: number };
    if (personaCount.c === 0) {
      // Seed from shared defaults
      this.seedDefaultPersonas();
      this.seedDefaultProviders();
    }

    // Always sync Twitch channel from .env (update OAuth token if changed)
    this.syncChannelsFromEnv();
  }

  private syncChannelsFromEnv(): void {
    const twitchChannels = config.TWITCH_CHANNELS;
    const oauthToken = config.TWITCH_OAUTH_TOKEN;
    const isPlaceholder = !oauthToken || oauthToken === 'oauth:your_twitch_token_here';

    if (twitchChannels.length > 0 && !isPlaceholder) {
      const channelId = twitchChannels[0].toLowerCase().trim();
      const channelName = twitchChannels[0].toLowerCase().trim();

      // upsertChannel uses ON CONFLICT DO UPDATE, so this updates existing channels too
      this.upsertChannel({
        channelId,
        channelName,
        platform: 'twitch',
        oauthToken,
        clientId: config.TWITCH_CLIENT_ID,
        enabled: true,
        activePersonaId: 'der-kritiker',
      });

      logger.info(`Twitch channel synced from .env: ${channelName} (token: ${oauthToken.substring(0, 10)}...)`);

      // Also sync additional channels if multiple are configured
      for (let i = 1; i < twitchChannels.length; i++) {
        const ch = twitchChannels[i].toLowerCase().trim();
        if (ch) {
          this.upsertChannel({
            channelId: ch,
            channelName: ch,
            platform: 'twitch',
            oauthToken,
            clientId: config.TWITCH_CLIENT_ID,
            enabled: true,
            activePersonaId: 'der-kritiker',
          });
          logger.info(`Additional Twitch channel synced from .env: ${ch}`);
        }
      }
    } else {
      if (twitchChannels.length === 0) {
        logger.warn('='.repeat(50));
        logger.warn('  TWITCH_CHANNELS not set in .env!');
        logger.warn('  Add: TWITCH_CHANNELS=your_channel_name');
        logger.warn('='.repeat(50));
      } else if (isPlaceholder) {
        logger.warn('='.repeat(50));
        logger.warn('  TWITCH_OAUTH_TOKEN not configured in .env!');
        logger.warn('  Get your token at: https://twitchapps.com/tmi/');
        logger.warn('  Add: TWITCH_OAUTH_TOKEN=oauth:xxxxxxxxxx');
        logger.warn('='.repeat(50));
      }
    }

    // Sync Kick channel from .env if configured
    const kickChannels = config.KICK_CHANNELS;
    const kickToken = config.KICK_OAUTH_TOKEN;
    if (kickChannels.length > 0 && kickToken && kickToken !== 'your_kick_token_here') {
      const channelId = kickChannels[0].toLowerCase().trim();
      this.upsertChannel({
        channelId,
        channelName: kickChannels[0].toLowerCase().trim(),
        platform: 'kick',
        oauthToken: kickToken,
        enabled: true,
        activePersonaId: 'der-kritiker',
      });
      logger.info(`Kick channel synced from .env: ${kickChannels[0]}`);
    }
  }

  private seedDefaultPersonas(): void {
    // Default personas are loaded from shared config on first run
    const defaultPersonas = [
      { id: 'der-kritiker', name: 'Der Kritiker', systemPrompt: 'Du bist "Der Kritiker", ein sarkastischer Gaming-Experte. Du analysierst die Spielweise des Streamers, gibst "konstruktive" Kritik ab und bist leicht arrogant. Antworte kurz (max 2 Sätze), knackig und twitch-typisch. Nutze gelegentlich sarcasm. Deutsch.', description: 'Hinterfragt die Spielweise, ist leicht arrogant und sarkastisch.', temperature: 0.8, maxTokens: 100 },
      { id: 'der-hypeman', name: 'Der Hypeman', systemPrompt: 'Du bist "Der Hypeman"! DU FEIERST ALLES! Jede Aktion ist der GRÖSSTE SUCCESS EVER! Antworte extrem enthusiastisch (max 2 Sätze), nutze VIELE CAPS und Emotes. Deutsch.', description: 'Schreibt fast nur in Caps, nutzt extrem viele Emotes.', temperature: 1.0, maxTokens: 80 },
      { id: 'das-orakel', name: 'Das Orakel', systemPrompt: 'Du bist "Das Orakel". Du sprichst in Rätseln und dunklen Metaphern, gibst kryptische Tipps und prophezeit das Schicksal. Antworte mysteriös (max 2 Sätze), wie ein Weissager. Deutsch.', description: 'Gibt kryptische Tipps und "prophezeit" das Ende des Runs.', temperature: 0.9, maxTokens: 100 },
      { id: 'der-dj', name: 'Der DJ', systemPrompt: 'Du bist "Der DJ"! Du behandelst den Chat wie eine Tanzfläche. Zitiere gelegentlich Songtexte, mach musikbezogene Wortspiele. Antworte cool (max 2 Sätze). Bei Musikwünschen sag "Ich bin ein DJ, keine Jukebox!". Deutsch.', description: 'Behandelt den Chat wie eine Tanzfläche, zitiert Songtexte.', temperature: 0.85, maxTokens: 100 },
      { id: 'die-mutter', name: 'Die Mutter', systemPrompt: 'Du bist "Die Mutter". Du sorgst dich um alle, ertappst Zuschauer beim Fluchen, verteilst virtuelle Kekse und erinnerst ans Essen. Antworte liebevoll und fürsorglich (max 2 Sätze). Deutsch.', description: 'Ertappt Zuschauer beim Fluchen, verteilt virtuelle Kekse.', temperature: 0.7, maxTokens: 100 },
      { id: 'der-historiker', name: 'Der Historiker', systemPrompt: 'Du bist "Der Historiker". Du weißt alles über den Kanal, alte Insider und die Streamer-Historie. Zitiere vergangene Streams und Events. Antworte gelehrt (max 2 Sätze). Deutsch.', description: 'Weiss alles über den Kanal, zitiert vergangene Streams.', temperature: 0.6, maxTokens: 100 },
      { id: 'der-questgeber', name: 'Der Questgeber', systemPrompt: 'Du bist "Der Questgeber". Du startest Missionen im Chat, vergibst XP und Belohnungen. Führe ein Rangsystem für aktive Zuschauer. Antworte wie ein RPG-NPC (max 2 Sätze). Deutsch.', description: 'Startet Missionen im Chat, vergibt XP und Belohnungen.', temperature: 0.75, maxTokens: 120 },
    ];

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO personas (id, name, description, system_prompt, temperature, max_tokens, enabled)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    const insertMany = this.db.transaction((personas: typeof defaultPersonas) => {
      for (const p of personas) {
        stmt.run(p.id, p.name, p.description, p.systemPrompt, p.temperature, p.maxTokens);
      }
    });
    insertMany(defaultPersonas);
    logger.info('Default personas seeded');
  }

  private seedDefaultProviders(): void {
    const providers = [
      { provider: 'anthropic', model: 'claude-sonnet-4-20250514', priority: 1, enabled: 0 },
      { provider: 'openai', model: 'gpt-4o', priority: 2, enabled: 0 },
      { provider: 'lmstudio', base_url: 'http://localhost:1234/v1', model: 'qwen2.5-7b-instruct', priority: 4, enabled: 1 },
      { provider: 'canned', model: 'builtin', priority: 5, enabled: 1 },
    ];

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO ai_providers (provider, base_url, model, priority, enabled)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((items: typeof providers) => {
      for (const p of items) {
        stmt.run(p.provider, p.base_url || '', p.model, p.priority, p.enabled);
      }
    });
    insertMany(providers);
    logger.info('Default AI providers seeded');
  }

  // ---- Channel Operations ----
  getChannel(channelId: string): ChannelConfig | null {
    const row = this.db.prepare('SELECT * FROM channels WHERE channel_id = ?').get(channelId) as any;
    if (!row) return null;

    return {
      channelId: row.channel_id,
      platform: row.platform,
      channelName: row.channel_name,
      oauthToken: row.oauth_token || '',
      clientId: row.client_id || '',
      enabled: !!row.enabled,
      sessions: [],
      activePersonaId: row.active_persona_id,
      gameAwareness: !!row.game_awareness,
      deathCounter: !!row.death_counter,
      questSystem: !!row.quest_system,
      predictiveWelcome: !!row.predictive_welcome,
      sentimentAnalysis: !!row.sentiment_analysis,
      maxChatHistory: row.max_chat_history,
      blockedUsers: [],
      blockedWords: [],
      customCommands: this.getCustomCommands(channelId),
      loreEntries: this.getLoreEntries(channelId),
    };
  }

  getChannels(): ChannelConfig[] {
    const rows = this.db.prepare('SELECT * FROM channels').all() as any[];
    return rows.map(row => this.getChannel(row.channel_id)!).filter(Boolean);
  }

  upsertChannel(ch: Partial<ChannelConfig> & { channelId: string; channelName: string }): void {
    this.db.prepare(`
      INSERT INTO channels (channel_id, platform, channel_name, oauth_token, client_id, enabled, active_persona_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(channel_id) DO UPDATE SET
        platform = excluded.platform,
        channel_name = excluded.channel_name,
        oauth_token = COALESCE(excluded.oauth_token, oauth_token),
        client_id = COALESCE(excluded.client_id, client_id),
        enabled = COALESCE(excluded.enabled, enabled),
        active_persona_id = COALESCE(excluded.active_persona_id, active_persona_id)
    `).run(
      ch.channelId, ch.platform || 'twitch', ch.channelName,
      ch.oauthToken || '', ch.clientId || '',
      ch.enabled ? 1 : 0, ch.activePersonaId || 'der-kritiker'
    );

    // Ensure game state exists
    this.db.prepare(`
      INSERT OR IGNORE INTO game_state (channel_id, session_start) VALUES (?, datetime('now'))
    `).run(ch.channelId);

    // Ensure stream stats exist
    this.db.prepare(`
      INSERT OR IGNORE INTO stream_stats (channel_id) VALUES (?)
    `).run(ch.channelId);
  }

  setActivePersona(channelId: string, personaId: string): void {
    this.db.prepare('UPDATE channels SET active_persona_id = ? WHERE channel_id = ?').run(personaId, channelId);
  }

  enableChannel(channelId: string, enabled: boolean): void {
    this.db.prepare('UPDATE channels SET enabled = ? WHERE channel_id = ?').run(enabled ? 1 : 0, channelId);
  }

  // ---- Persona Operations ----
  getAllPersonas() {
    return this.db.prepare('SELECT * FROM personas ORDER BY id').all() as any[];
  }

  getPersona(id: string) {
    return this.db.prepare('SELECT * FROM personas WHERE id = ?').get(id) as any;
  }

  updatePersona(persona: { id: string; systemPrompt?: string; temperature?: number; maxTokens?: number; enabled?: boolean; name?: string; description?: string }): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (persona.systemPrompt !== undefined) { fields.push('system_prompt = ?'); values.push(persona.systemPrompt); }
    if (persona.temperature !== undefined) { fields.push('temperature = ?'); values.push(persona.temperature); }
    if (persona.maxTokens !== undefined) { fields.push('max_tokens = ?'); values.push(persona.maxTokens); }
    if (persona.enabled !== undefined) { fields.push('enabled = ?'); values.push(persona.enabled ? 1 : 0); }
    if (persona.name !== undefined) { fields.push('name = ?'); values.push(persona.name); }
    if (persona.description !== undefined) { fields.push('description = ?'); values.push(persona.description); }

    if (fields.length > 0) {
      values.push(persona.id);
      this.db.prepare(`UPDATE personas SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
  }

  // ---- AI Provider Operations ----
  getAIProviders() {
    return this.db.prepare('SELECT * FROM ai_providers ORDER BY priority').all() as any[];
  }

  updateAIProvider(provider: string, updates: { apiKey?: string; baseUrl?: string; model?: string; enabled?: boolean; priority?: number }): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.apiKey !== undefined) { fields.push('api_key = ?'); values.push(updates.apiKey); }
    if (updates.baseUrl !== undefined) { fields.push('base_url = ?'); values.push(updates.baseUrl); }
    if (updates.model !== undefined) { fields.push('model = ?'); values.push(updates.model); }
    if (updates.enabled !== undefined) { fields.push('enabled = ?'); values.push(updates.enabled ? 1 : 0); }
    if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority); }

    if (fields.length > 0) {
      values.push(provider);
      this.db.prepare(`UPDATE ai_providers SET ${fields.join(', ')} WHERE provider = ?`).run(...values);
    }
  }

  // ---- Viewer Operations ----
  getViewer(channelId: string, userId: string): ViewerProfile | null {
    const row = this.db.prepare('SELECT * FROM viewers WHERE channel_id = ? AND user_id = ?').get(channelId, userId) as any;
    if (!row) return null;
    return {
      userId: row.user_id,
      username: row.username,
      displayName: row.display_name,
      platform: row.platform,
      firstSeen: new Date(row.first_seen),
      lastSeen: new Date(row.last_seen),
      messageCount: row.message_count,
      xp: row.xp,
      level: row.level,
      notes: row.notes || undefined,
    };
  }

  upsertViewer(viewer: { channelId: string; userId: string; username: string; displayName: string; platform: string }): void {
    this.db.prepare(`
      INSERT INTO viewers (channel_id, user_id, username, display_name, platform)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        username = excluded.username,
        display_name = excluded.display_name,
        last_seen = datetime('now'),
        message_count = message_count + 1,
        xp = xp + 1
    `).run(viewer.channelId, viewer.userId, viewer.username, viewer.displayName, viewer.platform);

    // Level up check
    this.db.prepare(`
      UPDATE viewers SET level = FLOOR(SQRT(xp / 50)) + 1 WHERE user_id = ?
    `).run(viewer.userId);
  }

  isKnownViewer(channelId: string, userId: string): boolean {
    const row = this.db.prepare('SELECT 1 FROM viewers WHERE channel_id = ? AND user_id = ?').get(channelId, userId);
    return !!row;
  }

  getTopViewers(channelId: string, limit: number = 10): ViewerProfile[] {
    const rows = this.db.prepare('SELECT * FROM viewers WHERE channel_id = ? ORDER BY xp DESC LIMIT ?').all(channelId, limit) as any[];
    return rows.map(r => ({
      userId: r.user_id, username: r.username, displayName: r.display_name,
      platform: r.platform, firstSeen: new Date(r.first_seen), lastSeen: new Date(r.last_seen),
      messageCount: r.message_count, xp: r.xp, level: r.level,
    }));
  }

  // ---- Game State ----
  getGameState(channelId: string): GameState {
    const row = this.db.prepare('SELECT * FROM game_state WHERE channel_id = ?').get(channelId) as any;
    return {
      currentGame: row?.current_game || 'Just Chatting',
      currentScene: row?.current_scene || undefined,
      deathCount: row?.death_count || 0,
      achievementCount: row?.achievement_count || 0,
      sessionStartTime: new Date(row?.session_start || Date.now()),
      viewerCount: row?.viewer_count || 0,
      isLive: !!row?.is_live,
    };
  }

  updateGameState(channelId: string, updates: Partial<GameState>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.currentGame !== undefined) { fields.push('current_game = ?'); values.push(updates.currentGame); }
    if (updates.currentScene !== undefined) { fields.push('current_scene = ?'); values.push(updates.currentScene); }
    if (updates.deathCount !== undefined) { fields.push('death_count = ?'); values.push(updates.deathCount); }
    if (updates.achievementCount !== undefined) { fields.push('achievement_count = ?'); values.push(updates.achievementCount); }
    if (updates.viewerCount !== undefined) { fields.push('viewer_count = ?'); values.push(updates.viewerCount); }
    if (updates.isLive !== undefined) { fields.push('is_live = ?'); values.push(updates.isLive ? 1 : 0); }

    if (fields.length > 0) {
      values.push(channelId);
      this.db.prepare(`UPDATE game_state SET ${fields.join(', ')} WHERE channel_id = ?`).run(...values);
    }
  }

  incrementDeathCount(channelId: string): number {
    this.db.prepare('UPDATE game_state SET death_count = death_count + 1 WHERE channel_id = ?').run(channelId);
    const row = this.db.prepare('SELECT death_count FROM game_state WHERE channel_id = ?').get(channelId) as { death_count: number };
    return row?.death_count || 0;
  }

  // ---- Custom Commands ----
  getCustomCommands(channelId: string): CustomCommand[] {
    const rows = this.db.prepare('SELECT * FROM custom_commands WHERE channel_id = ?').all(channelId) as any[];
    return rows.map(r => ({
      name: r.name, response: r.response, enabled: !!r.enabled,
      cooldown: r.cooldown, minLevel: r.min_level, personaOverride: r.persona_override || undefined,
    }));
  }

  addCustomCommand(cmd: CustomCommand & { channelId: string }): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO custom_commands (name, channel_id, response, enabled, cooldown, min_level, persona_override)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(cmd.name, cmd.channelId, cmd.response, cmd.enabled ? 1 : 0, cmd.cooldown, cmd.minLevel || 0, cmd.personaOverride || null);
  }

  deleteCustomCommand(name: string, channelId: string): void {
    this.db.prepare('DELETE FROM custom_commands WHERE name = ? AND channel_id = ?').run(name, channelId);
  }

  // ---- Lore ----
  getLoreEntries(channelId: string): LoreEntry[] {
    const rows = this.db.prepare('SELECT * FROM lore_entries WHERE channel_id = ? ORDER BY priority DESC').all(channelId) as any[];
    return rows.map(r => ({
      id: r.id, title: r.title, content: r.content,
      tags: JSON.parse(r.tags || '[]'), priority: r.priority,
      createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at),
    }));
  }

  addLoreEntry(entry: LoreEntry & { channelId: string }): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO lore_entries (id, channel_id, title, content, tags, priority, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(entry.id, entry.channelId, entry.title, entry.content, JSON.stringify(entry.tags), entry.priority);
  }

  deleteLoreEntry(id: string, channelId: string): void {
    this.db.prepare('DELETE FROM lore_entries WHERE id = ? AND channel_id = ?').run(id, channelId);
  }

  // ---- Quests ----
  getActiveQuests(channelId: string) {
    return this.db.prepare('SELECT * FROM quests WHERE channel_id = ? AND active = 1').all(channelId) as any[];
  }

  startQuest(channelId: string, questId: string): void {
    this.db.prepare('UPDATE quests SET active = 1, started_at = datetime("now"), progress = 0 WHERE id = ? AND channel_id = ?').run(questId, channelId);
  }

  stopQuest(questId: string): void {
    this.db.prepare('UPDATE quests SET active = 0 WHERE id = ?').run(questId);
  }

  updateQuestProgress(questId: string, increment: number = 1): void {
    const quest = this.db.prepare('SELECT * FROM quests WHERE id = ?').get(questId) as any;
    if (!quest) return;
    const newProgress = quest.progress + increment;
    const completed = newProgress >= quest.target;
    this.db.prepare('UPDATE quests SET progress = ?, active = ? WHERE id = ?').run(newProgress, completed ? 0 : 1, questId);
  }

  // ---- Stats ----
  incrementStat(channelId: string, field: 'total_messages' | 'ai_responses' | 'quest_completions' | 'death_count', amount: number = 1): void {
    this.db.prepare(`UPDATE stream_stats SET ${field} = ${field} + ? WHERE channel_id = ?`).run(amount, channelId);
  }

  getStreamStats(channelId: string): StreamStats {
    const row = this.db.prepare('SELECT * FROM stream_stats WHERE channel_id = ? ORDER BY id DESC LIMIT 1').get(channelId) as any;
    const topChatters = this.db.prepare('SELECT username, display_name, message_count FROM viewers WHERE channel_id = ? ORDER BY message_count DESC LIMIT 5').all(channelId) as any[];
    return {
      totalMessages: row?.total_messages || 0,
      uniqueViewers: row?.unique_viewers || 0,
      aiResponses: row?.ai_responses || 0,
      questCompletions: row?.quest_completions || 0,
      deathCount: row?.death_count || 0,
      topChatters: topChatters.map(r => ({ username: r.username, count: r.message_count })),
      sentimentHistory: [],
      aiCosts: [],
    };
  }

  resetSessionStats(channelId: string): void {
    this.db.prepare('UPDATE stream_stats SET total_messages = 0, ai_responses = 0, quest_completions = 0, death_count = 0, session_start = datetime("now") WHERE channel_id = ?').run(channelId);
    this.db.prepare('UPDATE game_state SET death_count = 0, achievement_count = 0, session_start = datetime("now") WHERE channel_id = ?').run(channelId);
  }

  // ---- Utility ----
  close(): void {
    this.db.close();
  }
}
