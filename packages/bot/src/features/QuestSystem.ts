// ============================================================
// nicetoAIyou Bot - Quest System
// ============================================================

import { v4 as uuid } from 'uuid';
import { logger } from '../utils/logger';
import { nicetoAIyouDB } from '../utils/database';
import type { ChatMessage, GameState } from '@nicetoaiyou/shared';
import { config } from '../config';

interface QuestInstance {
  id: string;
  channelId: string;
  name: string;
  description: string;
  type: string;
  target: number;
  xpReward: number;
  progress: number;
  active: boolean;
  startedAt: Date;
  keyword?: string;
}

export class QuestSystem {
  private db: nicetoAIyouDB;
  private activeQuests: Map<string, QuestInstance[]> = new Map();

  constructor(db: nicetoAIyouDB) {
    this.db = db;
  }

  // ---- Default Quests ----
  private getDefaultQuests(): Omit<QuestInstance, 'progress' | 'active' | 'startedAt'>[] {
    return [
      {
        id: 'daily-hype',
        channelId: '',
        name: 'Daily Hype',
        description: 'Schreibt "LetsGo" in den Chat!',
        type: 'daily',
        target: 10,
        xpReward: 15,
        keyword: 'letsgo',
      },
      {
        id: 'stream-emotes',
        channelId: '',
        name: 'Emote-Session',
        description: 'Sammele 50 Emotes im Chat!',
        type: 'stream',
        target: 50,
        xpReward: 50,
        keyword: 'pogchamp',
      },
      {
        id: 'community-teamwork',
        channelId: '',
        name: 'Gemeinschaftsgeist',
        description: '3 verschiedene Zuschauer müssen "Teamwork" schreiben!',
        type: 'community',
        target: 3,
        xpReward: 30,
        keyword: 'teamwork',
      },
    ];
  }

  initialize(channels: string[]): void {
    for (const channelId of channels) {
      const quests = this.db.getActiveQuests(channelId);
      this.activeQuests.set(channelId, quests.map(q => ({
        id: q.id,
        channelId,
        name: q.name,
        description: q.description,
        type: q.type,
        target: q.target,
        xpReward: q.xp_reward,
        progress: q.progress,
        active: !!q.active,
        startedAt: new Date(q.started_at || Date.now()),
        keyword: q.requirements ? JSON.parse(q.requirements)[0] : undefined,
      })));
    }
  }

  startQuest(channelId: string, questId?: string): QuestInstance | null {
    const quests = this.getDefaultQuests();
    const questDef = questId ? quests.find(q => q.id === questId) : quests[Math.floor(Math.random() * quests.length)];

    if (!questDef) return null;

    const quest: QuestInstance = {
      ...questDef,
      channelId,
      progress: 0,
      active: true,
      startedAt: new Date(),
    };

    // Store in DB
    this.db.startQuest(channelId, quest.id);

    // Add to active
    if (!this.activeQuests.has(channelId)) {
      this.activeQuests.set(channelId, []);
    }
    const channelQuests = this.activeQuests.get(channelId)!;
    const existing = channelQuests.findIndex(q => q.id === quest.id);
    if (existing >= 0) {
      channelQuests[existing] = quest;
    } else {
      channelQuests.push(quest);
    }

    logger.info(`Quest started on ${channelId}: ${quest.name} (${quest.type})`);
    return quest;
  }

  stopQuest(channelId: string, questId: string): void {
    this.db.stopQuest(questId);
    const channelQuests = this.activeQuests.get(channelId) || [];
    const idx = channelQuests.findIndex(q => q.id === questId);
    if (idx >= 0) {
      channelQuests[idx].active = false;
    }
  }

  getActiveQuests(channelId: string): QuestInstance[] {
    return this.activeQuests.get(channelId) || [];
  }

  checkMessageForQuest(channelId: string, message: ChatMessage): void {
    if (!config.ENABLE_QUEST_SYSTEM) return;

    const channelQuests = this.activeQuests.get(channelId) || [];
    for (const quest of channelQuests) {
      if (!quest.active) continue;

      // Check keyword-based quests
      if (quest.keyword && message.text.toLowerCase().includes(quest.keyword)) {
        this.incrementQuestProgress(channelId, quest);
      }
    }
  }

  private incrementQuestProgress(channelId: string, quest: QuestInstance): void {
    quest.progress++;
    this.db.updateQuestProgress(quest.id, 1);

    if (quest.progress >= quest.target) {
      quest.active = false;
      this.db.stopQuest(quest.id);
      this.db.incrementStat(channelId, 'quest_completions');
      logger.info(`Quest completed on ${channelId}: ${quest.name}!`);
    }
  }

  generateStreamSummary(channelId: string, gameState: GameState, personaName: string): string {
    const quests = this.getActiveQuests(channelId);
    const questInfo = quests.length > 0
      ? quests.map(q => `"${q.name}" (${q.progress}/${q.target})`).join(', ')
      : 'Keine aktiven Quests';

    const summaries: Record<string, (gs: GameState, qi: string) => string> = {
      'Der Kritiker': (gs, qi) => `Spielt "${gs.currentGame}" mit ${gs.deathCount} Toden. ${gs.deathCount > 0 ? 'Wie erwartet.' : 'Noch kein Skill-Issue. Noch nicht.'} Quests: ${qi}`,
      'Der Hypeman': (gs, qi) => `WIR SPIELEN "${gs.currentGame}"! ${gs.deathCount} DEATHS - JEDER EINZIGE IST EIN HIGHLIGHT! Quests: ${qi}`,
      'Das Orakel': (gs, qi) => `Die Schicksalsräder drehen sich um "${gs.currentGame}"... ${gs.deathCount} Seelen sind gefallen. Quests: ${qi}`,
      'Der DJ': (gs, qi) => `Current Track: "${gs.currentGame}" | ${gs.deathCount} Fails | Quests: ${qi}`,
      'Die Mutter': (gs, qi) => `Ihr spielt "${gs.currentGame}". ${gs.deathCount} Mal gestorben! Habt ihr was gegessen? Quests: ${qi}`,
      'Der Historiker': (gs, qi) => `Akademische Aufzeichnung: "${gs.currentGame}", Session-Tode: ${gs.deathCount}. Quests: ${qi}`,
      'Der Questgeber': (gs, qi) => `Abenteuer: "${gs.currentGame}" | Gefallene Helden: ${gs.deathCount} | Aktive Missionen: ${qi}`,
    };

    const fn = summaries[personaName];
    return fn ? fn(gameState, questInfo) : `Spielt "${gameState.currentGame}". Tode: ${gameState.deathCount}. Quests: ${questInfo}`;
  }
}
