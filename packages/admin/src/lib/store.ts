import { create } from 'zustand';

// Types
export type PanelType = 'dashboard' | 'personas' | 'channels' | 'providers' | 'chat' | 'quests' | 'lore' | 'settings';

export interface ChatMessage {
  id: string;
  timestamp: Date;
  username: string;
  message: string;
  platform: 'twitch' | 'kick';
  isBot: boolean;
  persona?: string;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  enabled: boolean;
  icon: string;
}

export interface Channel {
  id: string;
  name: string;
  platform: 'twitch' | 'kick';
  oauthToken: string;
  enabled: boolean;
  connected: boolean;
}

export interface AIProvider {
  id: string;
  name: string;
  type: 'anthropic' | 'openai' | 'lmstudio' | 'canned';
  enabled: boolean;
  priority: number;
  apiKey?: string;
  model?: string;
  url?: string;
  config: Record<string, string>;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  status: 'active' | 'completed' | 'paused';
  startedAt?: Date;
  rewards: string[];
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

export interface GameState {
  currentGame: string;
  sessionTime: string;
  viewerCount: number;
  deaths: number;
  totalMessages: number;
  aiResponses: number;
  activeQuests: number;
}

export interface DashboardSettings {
  adminPassword: string;
  defaultPersona: string;
  featureToggles: {
    chatResponses: boolean;
    questSystem: boolean;
    deathCounter: boolean;
    loreSystem: boolean;
    sentiment: boolean;
  };
  rateLimiting: {
    messagesPerMinute: number;
    aiResponsesPerMinute: number;
    cooldownSeconds: number;
  };
}

// Default data
const defaultPersonas: Persona[] = [
  {
    id: 'kritiker',
    name: 'Der Kritiker',
    description: 'Analytisch, sarkastisch, liefert scharfe Beobachtungen über das Spielgeschehen.',
    systemPrompt: 'Du bist Der Kritiker — ein sarkastischer, aber witziger Kommentator. Analysiere alles kritisch, aber unterhaltsam. Nutze deutsche Sprache.',
    temperature: 0.8,
    enabled: true,
    icon: '🧐',
  },
  {
    id: 'hypeman',
    name: 'Der Hypeman',
    description: 'Energetisch, enthusiastisch, feuert den Chat bei jedem Erfolg an.',
    systemPrompt: 'Du bist Der Hypeman — absolut enthusiastisch und voller Energie! Feuere den Chat an, nutze Ausrufezeichen, caps und Emojis!',
    temperature: 1.0,
    enabled: true,
    icon: '🔥',
  },
  {
    id: 'orakel',
    name: 'Das Orakel',
    description: 'Weise, geheimnisvoll, teilt prophezeiungen und rätselhaftes Wissen.',
    systemPrompt: 'Du bist Das Orakel — weise und geheimnisvoll. Sprich in Rätseln und Prophezeiungen.sei philosophisch.',
    temperature: 0.7,
    enabled: true,
    icon: '🔮',
  },
  {
    id: 'dj',
    name: 'Der DJ',
    description: 'Musikbegeistert, empfiehlt Tracks, nutzt Musik-Emoji und BPM-Referenzen.',
    systemPrompt: 'Du bist Der DJ — Musik ist dein Leben! Erwähne immer Beats, Tracks und Vibes. Nutze Musik-Emoji.',
    temperature: 0.9,
    enabled: false,
    icon: '🎵',
  },
  {
    id: 'mutter',
    name: 'Die Mutter',
    description: 'Fürsorglich, ermahnt zu Pausen, sorgt sich um Gesundheit und Wohlbefinden.',
    systemPrompt: 'Du bist Die Mutter — fürsorglich und besorgt. Erinnere den Streamer an Pausen, Wasser und Schlaf. Sei warm aber bestimmend.',
    temperature: 0.6,
    enabled: true,
    icon: '🤱',
  },
  {
    id: 'historiker',
    name: 'Der Historiker',
    description: 'Wissbegierig, erzählt Gaming-Geschichte und nostalgische Anekdoten.',
    systemPrompt: 'Du bist Der Historiker — ein Gaming-Historiker. Erzähle von alten Spielen, Retro-Klassikern und der Evolution des Gamings.',
    temperature: 0.7,
    enabled: false,
    icon: '📚',
  },
  {
    id: 'questgeber',
    name: 'Der Questgeber',
    description: 'Gibt Quests heraus, vergibt Challenges, trackt Abenteuer-Fortschritt.',
    systemPrompt: 'Du bist Der Questgeber — vergibst Epic Quests und Challenges an den Chat! Sei dramatisch und episch.',
    temperature: 0.8,
    enabled: true,
    icon: '⚔️',
  },
];

const defaultChannels: Channel[] = [
  { id: '1', name: 'streamforge', platform: 'twitch', oauthToken: '', enabled: true, connected: true },
];

const defaultProviders: AIProvider[] = [
  { id: 'anthropic', name: 'Anthropic Claude', type: 'anthropic', enabled: true, priority: 1, apiKey: '', config: { model: 'claude-3-5-sonnet-20241022' } },
  { id: 'openai', name: 'OpenAI GPT-4', type: 'openai', enabled: true, priority: 2, apiKey: '', config: { model: 'gpt-4o' } },
  { id: 'lmstudio', name: 'LM Studio (Lokal)', type: 'lmstudio', enabled: false, priority: 3, url: 'http://localhost:1234', config: { model: 'local-model' } },
  { id: 'canned', name: 'Canned Responses', type: 'canned', enabled: true, priority: 4, config: {} },
];

const defaultQuests: Quest[] = [
  { id: '1', title: '🏆 Erste Siegesserie', description: 'Gewinne 5 Runden ohne Tod', progress: 3, maxProgress: 5, status: 'active', rewards: ['Kritiker lobt dich', 'Neuer Chat-Command'], startedAt: new Date() },
  { id: '2', title: '💀 Death Run', description: 'Sterbe 10 Mal in einer Session', progress: 7, maxProgress: 10, status: 'active', rewards: ['Mutter gibt Ratschlag', 'Questgeber trauert'], startedAt: new Date() },
];

const defaultLore: LoreEntry[] = [
  { id: '1', title: 'Die Geburt des StreamForge', content: 'Es war an einem dunklen Novemberabend, als die Idee geboren wurde — ein KI-Bot, der den Chat zum Leben erweckt...', tags: ['Hintergrund', 'Origins'], priority: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', title: 'Die 7 Personas', content: 'Jede Persona hat eine einzigartige Persönlichkeit, geformt aus unzähligen Chat-Interaktionen und Stream-Momenten...', tags: ['Personas', 'Lore'], priority: 2, createdAt: new Date(), updatedAt: new Date() },
];

// Store interface
interface DashboardStore {
  // Auth
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;

  // Navigation
  activePanel: PanelType;
  setActivePanel: (panel: PanelType) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Connection status
  twitchConnected: boolean;
  kickConnected: boolean;
  socketStatus: 'connected' | 'disconnected' | 'connecting';
  setTwitchConnected: (v: boolean) => void;
  setKickConnected: (v: boolean) => void;
  setSocketStatus: (v: 'connected' | 'disconnected' | 'connecting') => void;

  // Game State
  gameState: GameState;
  setGameState: (gs: Partial<GameState>) => void;
  incrementDeaths: () => void;
  resetDeaths: () => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  clearChat: () => void;

  // Personas
  personas: Persona[];
  activePersonaId: string;
  setActivePersona: (id: string) => void;
  updatePersona: (id: string, updates: Partial<Persona>) => void;
  togglePersona: (id: string) => void;

  // Channels
  channels: Channel[];
  addChannel: (ch: Omit<Channel, 'id'>) => void;
  removeChannel: (id: string) => void;
  updateChannel: (id: string, updates: Partial<Channel>) => void;
  toggleChannel: (id: string) => void;

  // AI Providers
  providers: AIProvider[];
  updateProvider: (id: string, updates: Partial<AIProvider>) => void;
  toggleProvider: (id: string) => void;
  reorderProvider: (id: string, newPriority: number) => void;

  // Quests
  quests: Quest[];
  addQuest: (q: Omit<Quest, 'id'>) => void;
  updateQuest: (id: string, updates: Partial<Quest>) => void;
  deleteQuest: (id: string) => void;

  // Lore
  loreEntries: LoreEntry[];
  addLore: (entry: Omit<LoreEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLore: (id: string, updates: Partial<LoreEntry>) => void;
  deleteLore: (id: string) => void;

  // Settings
  settings: DashboardSettings;
  updateSettings: (updates: Partial<DashboardSettings>) => void;

  // Sentiment data for chart
  sentimentData: { time: string; value: number; label: string }[];
  addSentimentPoint: (value: number, label: string) => void;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  // Auth - always start false to avoid hydration mismatch (static export)
  isAuthenticated: false,
  setIsAuthenticated: (v) => set({ isAuthenticated: v }),

  // Navigation
  activePanel: 'dashboard',
  setActivePanel: (panel) => set({ activePanel: panel }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // Connection
  twitchConnected: true,
  kickConnected: false,
  socketStatus: 'disconnected',
  setTwitchConnected: (v) => set({ twitchConnected: v }),
  setKickConnected: (v) => set({ kickConnected: v }),
  setSocketStatus: (v) => set({ socketStatus: v }),

  // Game State
  gameState: {
    currentGame: 'Elden Ring',
    sessionTime: '02:34:12',
    viewerCount: 127,
    deaths: 42,
    totalMessages: 1543,
    aiResponses: 892,
    activeQuests: 2,
  },
  setGameState: (gs) => set((s) => ({ gameState: { ...s.gameState, ...gs } })),
  incrementDeaths: () => set((s) => ({ gameState: { ...s.gameState, deaths: s.gameState.deaths + 1 } })),
  resetDeaths: () => set((s) => ({ gameState: { ...s.gameState, deaths: 0 } })),

  // Chat
  chatMessages: [],
  addChatMessage: (msg) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set((s) => ({
      chatMessages: [...s.chatMessages.slice(-200), { ...msg, id }],
    }));
  },
  clearChat: () => set({ chatMessages: [] }),

  // Personas
  personas: defaultPersonas,
  activePersonaId: 'hypeman',
  setActivePersona: (id) => set({ activePersonaId: id }),
  updatePersona: (id, updates) =>
    set((s) => ({
      personas: s.personas.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  togglePersona: (id) =>
    set((s) => ({
      personas: s.personas.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)),
    })),

  // Channels
  channels: defaultChannels,
  addChannel: (ch) => {
    const id = `ch-${Date.now()}`;
    set((s) => ({ channels: [...s.channels, { ...ch, id }] }));
  },
  removeChannel: (id) =>
    set((s) => ({ channels: s.channels.filter((c) => c.id !== id) })),
  updateChannel: (id, updates) =>
    set((s) => ({
      channels: s.channels.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  toggleChannel: (id) =>
    set((s) => ({
      channels: s.channels.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)),
    })),

  // AI Providers
  providers: defaultProviders,
  updateProvider: (id, updates) =>
    set((s) => ({
      providers: s.providers.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  toggleProvider: (id) =>
    set((s) => ({
      providers: s.providers.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)),
    })),
  reorderProvider: (id, newPriority) =>
    set((s) => ({
      providers: s.providers.map((p) => (p.id === id ? { ...p, priority: newPriority } : p)),
    })),

  // Quests
  quests: defaultQuests,
  addQuest: (q) => {
    const id = `q-${Date.now()}`;
    set((s) => ({ quests: [...s.quests, { ...q, id }] }));
  },
  updateQuest: (id, updates) =>
    set((s) => ({
      quests: s.quests.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    })),
  deleteQuest: (id) =>
    set((s) => ({ quests: s.quests.filter((q) => q.id !== id) })),

  // Lore
  loreEntries: defaultLore,
  addLore: (entry) => {
    const id = `lore-${Date.now()}`;
    const now = new Date();
    set((s) => ({ loreEntries: [...s.loreEntries, { ...entry, id, createdAt: now, updatedAt: now }] }));
  },
  updateLore: (id, updates) =>
    set((s) => ({
      loreEntries: s.loreEntries.map((l) =>
        l.id === id ? { ...l, ...updates, updatedAt: new Date() } : l
      ),
    })),
  deleteLore: (id) =>
    set((s) => ({ loreEntries: s.loreEntries.filter((l) => l.id !== id) })),

  // Settings
  settings: {
    adminPassword: '',
    defaultPersona: 'hypeman',
    featureToggles: {
      chatResponses: true,
      questSystem: true,
      deathCounter: true,
      loreSystem: true,
      sentiment: true,
    },
    rateLimiting: {
      messagesPerMinute: 30,
      aiResponsesPerMinute: 10,
      cooldownSeconds: 5,
    },
  },
  updateSettings: (updates) =>
    set((s) => ({ settings: { ...s.settings, ...updates } })),

  // Sentiment
  sentimentData: [
    { time: '14:00', value: 75, label: 'Positiv' },
    { time: '14:10', value: 60, label: 'Neutral' },
    { time: '14:20', value: 85, label: 'Positiv' },
    { time: '14:30', value: 40, label: 'Negativ' },
    { time: '14:40', value: 70, label: 'Positiv' },
    { time: '14:50', value: 90, label: 'Positiv' },
    { time: '15:00', value: 55, label: 'Neutral' },
    { time: '15:10', value: 80, label: 'Positiv' },
  ],
  addSentimentPoint: (value, label) =>
    set((s) => {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const newPoint = { time, value, label };
      const data = [...s.sentimentData.slice(-19), newPoint];
      return { sentimentData: data };
    }),
}));
