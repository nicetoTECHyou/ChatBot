// ============================================================
// StreamForge AI - Shared Types & Constants
// ============================================================

export type Platform = 'twitch' | 'kick';

export type AIProvider = 'anthropic' | 'openai' | 'lmstudio' | 'canned';

export type SentimentType = 'positive' | 'neutral' | 'negative' | 'toxic';

export interface ChatMessage {
  id: string;
  platform: Platform;
  channelId: string;
  username: string;
  userId: string;
  displayName: string;
  text: string;
  emotes?: Array<{ id: string; name: string; positions: Array<[number, number]> }>;
  isBroadcaster: boolean;
  isMod: boolean;
  isSubscriber: boolean;
  isVip: boolean;
  badges?: Record<string, string>;
  timestamp: Date;
  replyTo?: string;
}

export interface BotResponse {
  text: string;
  personaId: string;
  provider: AIProvider;
  latencyMs: number;
  tokensUsed?: number;
  cached?: boolean;
}

export interface PersonaConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  triggers?: string[];
  gameCategories?: string[];
  enabled: boolean;
  specialFeatures?: Record<string, unknown>;
  responseStyle: 'short' | 'medium' | 'detailed';
  emoteStyle: string[];
}

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  priority: number;
  enabled: boolean;
  maxTokensPerMinute?: number;
  maxTokensPerDay?: number;
}

export interface SessionConfig {
  channelId: string;
  platform: Platform;
  channelName: string;
  oauthToken: string;
  clientId?: string;
  enabled: boolean;
  activePersonaId: string;
}

export interface GameState {
  currentGame: string;
  currentScene?: string;
  deathCount: number;
  achievementCount: number;
  sessionStartTime: Date;
  viewerCount: number;
  isLive: boolean;
}

export interface ViewerProfile {
  userId: string;
  username: string;
  displayName: string;
  platform: Platform;
  firstSeen: Date;
  lastSeen: Date;
  messageCount: number;
  xp: number;
  level: number;
  questProgress?: Record<string, QuestProgress>;
  notes?: string;
}

export interface QuestProgress {
  questId: string;
  progress: number;
  target: number;
  completed: boolean;
  startedAt: Date;
}

export interface QuestConfig {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'stream' | 'chain' | 'community' | 'secret' | 'persona';
  personaId?: string;
  target: number;
  xpReward: number;
  duration?: number; // seconds
  active: boolean;
  requirements?: string[];
}

export interface ChannelConfig {
  channelId: string;
  platform: Platform;
  channelName: string;
  oauthToken?: string;
  clientId?: string;
  enabled: boolean;
  sessions: SessionConfig[];
  activePersonaId: string;
  gameAwareness: boolean;
  deathCounter: boolean;
  questSystem: boolean;
  predictiveWelcome: boolean;
  sentimentAnalysis: boolean;
  maxChatHistory: number;
  blockedUsers: string[];
  blockedWords: string[];
  customCommands: CustomCommand[];
  loreEntries: LoreEntry[];
}

export interface CustomCommand {
  name: string;
  response: string;
  enabled: boolean;
  cooldown: number;
  minLevel?: number;
  personaOverride?: string;
}

export interface LoreEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamStats {
  totalMessages: number;
  uniqueViewers: number;
  aiResponses: number;
  questCompletions: number;
  deathCount: number;
  topChatters: Array<{ username: string; count: number }>;
  sentimentHistory: Array<{ timestamp: Date; score: number }>;
  aiCosts: {
    provider: AIProvider;
    tokens: number;
    cost: number;
  }[];
}

// Socket.IO Events
export interface ServerToClientEvents {
  'bot:status': (data: { connected: boolean; platform: Platform; channel: string }) => void;
  'chat:message': (message: ChatMessage) => void;
  'bot:response': (response: BotResponse) => void;
  'persona:changed': (data: { personaId: string; personaName: string; trigger: string }) => void;
  'quest:updated': (data: QuestConfig & { progress: number }) => void;
  'quest:completed': (data: { questId: string; questName: string; participants: string[] }) => void;
  'game:state': (state: GameState) => void;
  'stats:update': (stats: StreamStats) => void;
  'ai:usage': (data: { provider: AIProvider; tokensUsed: number; latencyMs: number }) => void;
  'sentiment:update': (data: { score: number; type: SentimentType; messageCount: number }) => void;
  'error': (data: { message: string; code: string }) => void;
}

export interface ClientToServerEvents {
  'persona:switch': (personaId: string) => void;
  'persona:toggle': (personaId: string, enabled: boolean) => void;
  'quest:start': (questId: string) => void;
  'quest:stop': (questId: string) => void;
  'death:reset': () => void;
  'game:set': (game: string) => void;
  'bot:restart': () => void;
  'config:update': (config: Partial<ChannelConfig>) => void;
}

// Defaults
export const DEFAULT_PERSONAS: PersonaConfig[] = [
  {
    id: 'der-kritiker',
    name: 'Der Kritiker',
    description: 'Hinterfragt die Spielweise, ist leicht arrogant und sarkastisch.',
    systemPrompt: 'Du bist "Der Kritiker", ein sarkastischer Gaming-Experte. Du analysierst die Spielweise des Streamers, gibst "konstruktive" Kritik ab und bist leicht arrogant. Antworte kurz (max 2 Sätze), knackig und twitch-typisch. Nutze gelegentlich sarcasm. Deutsch.',
    temperature: 0.8,
    maxTokens: 100,
    enabled: true,
    responseStyle: 'short',
    emoteStyle: ['Sadge', 'BruhMoment'],
    specialFeatures: { deathCommentary: true, performanceScoring: true }
  },
  {
    id: 'der-hypeman',
    name: 'Der Hypeman',
    description: 'Schreibt fast nur in Caps, nutzt extrem viele Emotes.',
    systemPrompt: 'Du bist "Der Hypeman"! DU FEIERST ALLES! Jede Aktion ist der GRÖSSTE SUCCESS EVER! Antworte extrem enthusiastisch (max 2 Sätze), nutze VIELE CAPS und Emotes. Deutsch.',
    temperature: 1.0,
    maxTokens: 80,
    enabled: true,
    responseStyle: 'short',
    emoteStyle: ['PogChamp', 'HYPE', 'LetsGo', 'LUL'],
    specialFeatures: { subCelebration: true, hypeCounter: true }
  },
  {
    id: 'das-orakel',
    name: 'Das Orakel',
    description: 'Gibt kryptische Tipps und "prophezeit" das Ende des Runs.',
    systemPrompt: 'Du bist "Das Orakel". Du sprichst in Rätseln und dunklen Metaphern, gibst kryptische Tipps und prophezeit das Schicksal. Antworte mysteriös (max 2 Sätze), wie ein Weissager. Deutsch.',
    temperature: 0.9,
    maxTokens: 100,
    enabled: true,
    responseStyle: 'short',
    emoteStyle: ['monkaS', 'OMEGALUL', 'Pepega'],
    specialFeatures: { fatePredictions: true, mysteryQuests: true }
  },
  {
    id: 'der-dj',
    name: 'Der DJ',
    description: 'Behandelt den Chat wie eine Tanzfläche, zitiert Songtexte.',
    systemPrompt: 'Du bist "Der DJ"! Du behandelst den Chat wie eine Tanzfläche. Zitiere gelegentlich Songtexte, mach musikbezogene Wortspiele. Antworte cool (max 2 Sätze). Bei Musikwünschen sag "Ich bin ein DJ, keine Jukebox!". Deutsch.',
    temperature: 0.85,
    maxTokens: 100,
    enabled: true,
    responseStyle: 'short',
    emoteStyle: ['DJ', 'Headbang', 'Groovy'],
    specialFeatures: { beatDropReactions: true }
  },
  {
    id: 'die-mutter',
    name: 'Die Mutter',
    description: 'Ertappt Zuschauer beim Fluchen, verteilt virtuelle Kekse.',
    systemPrompt: 'Du bist "Die Mutter". Du sorgst dich um alle, ertappst Zuschauer beim Fluchen, verteilst virtuelle Kekse und erinnerst ans Essen. Antworte liebevoll und fürsorglich (max 2 Sätze). Deutsch.',
    temperature: 0.7,
    maxTokens: 100,
    enabled: true,
    responseStyle: 'short',
    emoteStyle: ['Cookie', 'KindPog', 'Heart'],
    specialFeatures: { eatReminder: true, profanityWarning: true }
  },
  {
    id: 'der-historiker',
    name: 'Der Historiker',
    description: 'Weiss alles über den Kanal, zitiert vergangene Streams.',
    systemPrompt: 'Du bist "Der Historiker". Du weißt alles über den Kanal, alte Insider und die Streamer-Historie. Zitiere vergangene Streams und Events. Antworte gelehrt (max 2 Sätze). Deutsch.',
    temperature: 0.6,
    maxTokens: 100,
    enabled: true,
    responseStyle: 'short',
    emoteStyle: ['Thinking', 'ZULUL', 'Knowledge'],
    specialFeatures: { loreDatabase: true, historyFeature: true }
  },
  {
    id: 'der-questgeber',
    name: 'Der Questgeber',
    description: 'Startet Missionen im Chat, vergibt XP und Belohnungen.',
    systemPrompt: 'Du bist "Der Questgeber". Du startest Missionen im Chat, vergibst XP und Belohnungen. Führe ein Rangsystem für aktive Zuschauer. Antworte wie ein RPG-NPC (max 2 Sätze). Deutsch.',
    temperature: 0.75,
    maxTokens: 120,
    enabled: true,
    responseStyle: 'medium',
    emoteStyle: ['Sword', 'Shield', 'LevelUp'],
    specialFeatures: { questSystem: true, xpSystem: true }
  }
];

export const DEFAULT_AI_PROVIDERS: AIProviderConfig[] = [
  {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    priority: 1,
    enabled: false,
    maxTokensPerMinute: 40000,
    maxTokensPerDay: 1000000
  },
  {
    provider: 'openai',
    model: 'gpt-4o',
    priority: 2,
    enabled: false,
    maxTokensPerMinute: 40000,
    maxTokensPerDay: 1000000
  },
  {
    provider: 'lmstudio',
    baseUrl: 'http://localhost:1234/v1',
    model: 'qwen2.5-7b-instruct',
    priority: 4,
    enabled: true,
    maxTokensPerMinute: 60000,
    maxTokensPerDay: Infinity
  },
  {
    provider: 'canned',
    model: 'builtin',
    priority: 5,
    enabled: true
  }
];
