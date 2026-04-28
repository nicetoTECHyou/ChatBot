// ============================================================
// nicetoAIyou Bot - Chat Memory (Session-based)
// ============================================================

import type { ChatMessage } from '@nicetoaiyou/shared';
import { config } from '../config';

export class ChatMemory {
  private histories: Map<string, ChatMessage[]> = new Map();
  private maxHistory: number;

  constructor(maxHistory?: number) {
    this.maxHistory = maxHistory || config.MAX_CHAT_HISTORY;
  }

  addMessage(channelId: string, message: ChatMessage): void {
    if (!this.histories.has(channelId)) {
      this.histories.set(channelId, []);
    }
    const history = this.histories.get(channelId)!;
    history.push(message);

    // Trim to max length
    while (history.length > this.maxHistory) {
      history.shift();
    }
  }

  getHistory(channelId: string, limit?: number): ChatMessage[] {
    const history = this.histories.get(channelId) || [];
    return limit ? history.slice(-limit) : [...history];
  }

  getRecent(channelId: string, count: number): ChatMessage[] {
    const history = this.histories.get(channelId) || [];
    return history.slice(-count);
  }

  clear(channelId: string): void {
    this.histories.delete(channelId);
  }

  clearAll(): void {
    this.histories.clear();
  }

  getSize(channelId: string): number {
    return this.histories.get(channelId)?.length || 0;
  }
}
