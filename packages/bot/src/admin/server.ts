// ============================================================
// StreamForge AI Bot - Admin API & Socket.IO Server
// ============================================================

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { logger } from '../utils/logger';
import { config } from '../config';
import { StreamForgeDB } from '../utils/database';
import { AIEngine } from '../ai/engine';
import { PersonaManager } from '../persona/PersonaManager';
import { QuestSystem } from '../features/QuestSystem';
import { DeathCounter } from '../features/DeathCounter';
import { ChatMemory } from '../memory/ChatMemory';
import type { ServerToClientEvents, ClientToServerEvents, ChannelConfig } from '@streamforge/shared';

export function createAdminServer(
  db: StreamForgeDB,
  ai: AIEngine,
  personaManager: PersonaManager,
  questSystem: QuestSystem,
  deathCounter: DeathCounter,
  memory: ChatMemory,
  twitchBot: any,
  kickBot: any,
) {
  const app = express();
  const server = createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  app.use(cors());
  app.use(express.json());

  // Serve static admin dashboard files
  const adminStaticPath = path.resolve(process.cwd(), 'packages', 'admin', 'out');
  app.use(express.static(adminStaticPath));

  // Basic auth middleware
  const basicAuth = (req: any, res: any, next: any) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="StreamForge Admin"');
      return res.status(401).json({ error: 'Authentication required' });
    }
    const decoded = Buffer.from(auth.split(' ')[1], 'base64').toString();
    const [username, password] = decoded.split(':');
    if (username === config.ADMIN_USERNAME && password === config.ADMIN_PASSWORD) {
      next();
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  };

  app.use('/api', basicAuth);

  // Health check (no auth)
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      version: '0.2.0',
      twitch: { connected: twitchBot?.isConnected() || false },
      kick: { connected: kickBot?.isConnected() || false },
      uptime: process.uptime(),
    });
  });

  // Channels
  app.get('/api/channels', (_req, res) => {
    res.json(db.getChannels());
  });

  app.post('/api/channels', (req, res) => {
    const channel = req.body as ChannelConfig;
    if (!channel.channelId || !channel.channelName) {
      return res.status(400).json({ error: 'channelId and channelName required' });
    }
    db.upsertChannel(channel);
    res.json({ success: true });
  });

  app.put('/api/channels/:channelId/toggle', (req, res) => {
    const { channelId } = req.params;
    const { enabled } = req.body;
    db.enableChannel(channelId, enabled);
    res.json({ success: true });
  });

  // Personas
  app.get('/api/personas', (_req, res) => {
    res.json(db.getAllPersonas());
  });

  app.get('/api/personas/:id', (req, res) => {
    const persona = db.getPersona(req.params.id);
    if (!persona) return res.status(404).json({ error: 'Persona not found' });
    res.json(persona);
  });

  app.put('/api/personas/:id', (req, res) => {
    db.updatePersona({ id: req.params.id, ...req.body });
    res.json({ success: true });
  });

  // AI Providers
  app.get('/api/ai/providers', (_req, res) => {
    res.json(db.getAIProviders());
  });

  app.put('/api/ai/providers/:provider', (req, res) => {
    db.updateAIProvider(req.params.provider, req.body);
    ai.refreshClients();
    res.json({ success: true });
  });

  // Game State
  app.get('/api/game/:channelId', (req, res) => {
    res.json(db.getGameState(req.params.channelId));
  });

  app.put('/api/game/:channelId', (req, res) => {
    db.updateGameState(req.params.channelId, req.body);
    res.json({ success: true });
  });

  app.post('/api/game/:channelId/death', (req, res) => {
    const count = deathCounter.recordDeath(req.params.channelId);
    const gameState = db.getGameState(req.params.channelId);
    const activePersona = personaManager.getActivePersona(req.params.channelId);
    const msg = deathCounter.getDeathMessage(req.params.channelId, gameState, activePersona.name);
    twitchBot?.say(`#${req.params.channelId}`, msg);
    io.emit('game:state', gameState);
    res.json({ success: true, deathCount: count, message: msg });
  });

  app.post('/api/game/:channelId/death/reset', (req, res) => {
    deathCounter.resetDeathCount(req.params.channelId);
    res.json({ success: true });
  });

  // Stats
  app.get('/api/stats/:channelId', (req, res) => {
    res.json(db.getStreamStats(req.params.channelId));
  });

  // Chat History
  app.get('/api/chat/:channelId', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    res.json(memory.getHistory(req.params.channelId, limit));
  });

  // Viewers
  app.get('/api/viewers/:channelId', (req, res) => {
    res.json(db.getTopViewers(req.params.channelId, 20));
  });

  // Custom Commands
  app.get('/api/commands/:channelId', (req, res) => {
    res.json(db.getCustomCommands(req.params.channelId));
  });

  app.post('/api/commands/:channelId', (req, res) => {
    db.addCustomCommand({ ...req.body, channelId: req.params.channelId });
    res.json({ success: true });
  });

  app.delete('/api/commands/:channelId/:name', (req, res) => {
    db.deleteCustomCommand(req.params.name, req.params.channelId);
    res.json({ success: true });
  });

  // Lore
  app.get('/api/lore/:channelId', (req, res) => {
    res.json(db.getLoreEntries(req.params.channelId));
  });

  app.post('/api/lore/:channelId', (req, res) => {
    const entry = req.body;
    if (!entry.id) entry.id = `lore-${Date.now()}`;
    db.addLoreEntry({ ...entry, channelId: req.params.channelId });
    res.json({ success: true });
  });

  app.delete('/api/lore/:channelId/:id', (req, res) => {
    db.deleteLoreEntry(req.params.id, req.params.channelId);
    res.json({ success: true });
  });

  // Quests
  app.get('/api/quests/:channelId', (req, res) => {
    res.json(questSystem.getActiveQuests(req.params.channelId));
  });

  app.post('/api/quests/:channelId/start', (req, res) => {
    const quest = questSystem.startQuest(req.params.channelId, req.body.questId);
    res.json({ success: true, quest });
  });

  app.post('/api/quests/:channelId/stop', (req, res) => {
    questSystem.stopQuest(req.params.channelId, req.body.questId);
    res.json({ success: true });
  });

  // Session Reset
  app.post('/api/session/:channelId/reset', (req, res) => {
    db.resetSessionStats(req.params.channelId);
    memory.clear(req.params.channelId);
    res.json({ success: true });
  });

  // ===== Socket.IO =====
  io.on('connection', (socket) => {
    logger.info(`Admin client connected: ${socket.id}`);

    const channels = db.getChannels();
    for (const ch of channels) {
      socket.emit('bot:status', {
        connected: twitchBot?.isConnected() || false,
        platform: 'twitch' as const,
        channel: ch.channelName,
      });
    }

    socket.on('persona:switch', (personaId) => {
      if (channels.length > 0) {
        personaManager.setActivePersona(channels[0].channelId, personaId);
        const persona = db.getPersona(personaId);
        if (persona) {
          io.emit('persona:changed', { personaId, personaName: persona.name, trigger: 'admin' });
        }
      }
    });

    socket.on('quest:start', (questId) => {
      if (channels.length > 0) {
        const quest = questSystem.startQuest(channels[0].channelId, questId);
        if (quest) io.emit('quest:updated', quest as any);
      }
    });

    socket.on('quest:stop', (questId) => {
      questSystem.stopQuest(questId, channels.length > 0 ? channels[0].channelId : '');
    });

    socket.on('death:reset', () => {
      if (channels.length > 0) deathCounter.resetDeathCount(channels[0].channelId);
    });

    socket.on('game:set', (game) => {
      if (channels.length > 0) {
        const channelId = channels[0].channelId;
        db.updateGameState(channelId, { currentGame: game });
        io.emit('game:state', db.getGameState(channelId));
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Admin client disconnected: ${socket.id}`);
    });
  });

  // SPA fallback - serve index.html for all non-API GET routes
  app.get('*', (_req, res) => {
    const indexPath = path.join(adminStaticPath, 'index.html');
    if (require('fs').existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Admin UI not built. Run: npm run build --workspace=packages/admin');
    }
  });

  return { app, server, io };
}
