// ============================================================
// nicetoAIyou Bot - AI Engine with Fallback Chain
// ============================================================

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';
import { config } from '../config';
import { nicetoAIyouDB } from '../utils/database';
import type { AIProvider, BotResponse, ChatMessage, SentimentType } from '@nicetoaiyou/shared';

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  isOpen: boolean;
  halfOpenAt?: number;
}

export class AIEngine {
  private db: nicetoAIyouDB;
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private rateLimitCounters: Map<string, { count: number; resetAt: number }> = new Map();
  private responseCache: Map<string, { response: string; timestamp: number }> = new Map();
  private cooldowns: Map<string, number> = new Map();

  constructor(db: nicetoAIyouDB) {
    this.db = db;
    this.initializeClients();
    this.startCacheCleanup();
  }

  private initializeClients(): void {
    const providers = this.db.getAIProviders();

    for (const p of providers) {
      this.circuitBreakers.set(p.provider, {
        failures: 0,
        lastFailureTime: 0,
        isOpen: false,
      });
    }

    const anthropicConfig = providers.find(p => p.provider === 'anthropic');
    if (anthropicConfig?.enabled && anthropicConfig.api_key) {
      this.anthropicClient = new Anthropic({ apiKey: anthropicConfig.api_key });
      logger.info('Anthropic client initialized');
    }

    const openaiConfig = providers.find(p => p.provider === 'openai');
    if (openaiConfig?.enabled && openaiConfig.api_key) {
      this.openaiClient = new OpenAI({ apiKey: openaiConfig.api_key });
      logger.info('OpenAI client initialized');
    }

    const lmStudioConfig = providers.find(p => p.provider === 'lmstudio');
    if (lmStudioConfig?.enabled) {
      this.openaiClient = new OpenAI({
        apiKey: 'lm-studio',
        baseURL: lmStudioConfig.base_url || config.LM_STUDIO_URL,
      });
      logger.info(`LM Studio client initialized at ${lmStudioConfig.base_url || config.LM_STUDIO_URL}`);
    }
  }

  refreshClients(): void {
    this.initializeClients();
  }

  async generateResponse(
    message: ChatMessage,
    chatHistory: ChatMessage[],
    systemPrompt: string,
    personaName: string,
    personaId: string,
    maxTokens: number = config.AI_MAX_TOKENS,
    temperature: number = config.AI_TEMPERATURE
  ): Promise<BotResponse> {
    const startTime = Date.now();

    // Check cooldown per user
    const cooldownKey = `${message.channelId}:${message.userId}`;
    const lastResponse = this.cooldowns.get(cooldownKey);
    if (lastResponse && Date.now() - lastResponse < config.SAME_USER_COOLDOWN_MS) {
      return this.createCannedResponse('no_response', personaId, 0);
    }

    // Check response probability
    if (Math.random() > config.RESPONSE_PROBABILITY) {
      return this.createCannedResponse('no_response', personaId, 0);
    }

    // Check cache
    const cacheKey = this.getCacheKey(message.text, personaId);
    const cached = this.responseCache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache hit for: ${message.text.substring(0, 30)}...`);
      this.cooldowns.set(cooldownKey, Date.now());
      return { text: cached.response, personaId, provider: 'lmstudio', latencyMs: 0, cached: true };
    }

    // Build context
    const contextBlock = this.buildContextBlock(message, chatHistory);
    const fullPrompt = this.buildFullPrompt(systemPrompt, contextBlock, message);

    // Try providers in order of priority
    const providers = this.db.getAIProviders().filter(p => p.enabled);
    providers.sort((a, b) => a.priority - b.priority);

    let lastError: Error | null = null;

    for (const provider of providers) {
      if (this.isCircuitOpen(provider.provider)) {
        logger.debug(`Circuit breaker open for ${provider.provider}, skipping`);
        continue;
      }

      if (!this.checkRateLimit(provider.provider)) {
        logger.debug(`Rate limit exceeded for ${provider.provider}, skipping`);
        continue;
      }

      try {
        let response: string | null = null;

        switch (provider.provider) {
          case 'anthropic':
            if (this.anthropicClient) {
              response = await this.callAnthropic(fullPrompt, maxTokens, temperature);
            }
            break;
          case 'openai':
            if (this.openaiClient && provider.base_url === '' || provider.base_url === null) {
              response = await this.callOpenAI(fullPrompt, maxTokens, temperature, provider.model);
            }
            break;
          case 'lmstudio':
            response = await this.callLMStudio(fullPrompt, maxTokens, temperature);
            break;
          case 'canned':
            response = this.getCannedResponse(message, personaName);
            break;
        }

        if (response) {
          const truncated = this.truncateResponse(response, config.MAX_RESPONSE_LENGTH);
          const latencyMs = Date.now() - startTime;

          // Cache the response
          this.responseCache.set(cacheKey, { response: truncated, timestamp: Date.now() });
          this.cooldowns.set(cooldownKey, Date.now());
          this.recordSuccess(provider.provider);

          return {
            text: truncated,
            personaId,
            provider: provider.provider,
            latencyMs,
          };
        }
      } catch (error: any) {
        lastError = error;
        logger.warn(`AI provider ${provider.provider} failed: ${error.message}`);
        this.recordFailure(provider.provider);
      }
    }

    // All providers failed - return fallback
    logger.error('All AI providers failed, using emergency fallback');
    const fallback = this.getEmergencyResponse(message, personaName);
    return this.createCannedResponse(fallback, personaId, Date.now() - startTime);
  }

  private buildFullPrompt(systemPrompt: string, contextBlock: string, message: ChatMessage): string {
    return `${systemPrompt}\n\n--- Aktuelle Situation ---\n${contextBlock}\n\n--- Zuschauer Nachricht ---\n${message.displayName}: ${message.text}\n\nAntworte als ${systemPrompt.split('Du bist ')[1]?.split('"')[0] || 'Bot'}:`;
  }

  private buildContextBlock(message: ChatMessage, chatHistory: ChatMessage[]): string {
    const gameState = this.db.getGameState(message.channelId);
    const recentChat = chatHistory.slice(-10).map(m => `${m.displayName}: ${m.text}`).join('\n');

    return `Spiel: ${gameState.currentGame}
Tode in dieser Session: ${gameState.deathCount}
Zuschauer: ${gameState.viewerCount}
Letzte Chat-Nachrichten:\n${recentChat}`;
  }

  private async callAnthropic(prompt: string, maxTokens: number, temperature: number): Promise<string> {
    if (!this.anthropicClient) throw new Error('Anthropic client not initialized');

    const response = await this.anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content.find(b => b.type === 'text');
    if (!block || block.type !== 'text') throw new Error('No text in response');
    return block.text;
  }

  private async callOpenAI(prompt: string, maxTokens: number, temperature: number, model: string): Promise<string> {
    if (!this.openaiClient) throw new Error('OpenAI client not initialized');

    const response = await this.openaiClient.chat.completions.create({
      model: model || 'gpt-4o',
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0]?.message?.content?.trim() || '';
  }

  private async callLMStudio(prompt: string, maxTokens: number, temperature: number): Promise<string> {
    // LM Studio uses OpenAI-compatible API
    if (!this.openaiClient) throw new Error('LM Studio client not initialized');

    const provider = this.db.getAIProviders().find(p => p.provider === 'lmstudio');
    const model = provider?.model || config.LM_STUDIO_MODEL;

    try {
      const response = await this.openaiClient.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error: any) {
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed')) {
        logger.warn('LM Studio connection refused - is LM Studio running?');
      }
      throw error;
    }
  }

  // ---- Sentiment Analysis ----
  analyzeSentiment(message: string): { score: number; type: SentimentType } {
    // Simple keyword-based sentiment analysis (fast, no API call)
    const positiveWords = ['lol', 'lmao', 'gg', 'pog', 'hype', 'love', 'awesome', 'nice', 'cool', 'great', 'w', 'win', 'goat', 'legend', 'kek', 'omg', 'wow', 'feier', 'super', 'top', 'geil', 'krass'];
    const negativeWords = ['suck', 'bad', 'worse', 'worst', 'hate', 'trash', 'garbage', 'boring', 'cringe', 'inting', 'throw', 'diff', 'bot', 'dumb', 'stupid', 'rage', 'toxic', 'cancer', 'kys', 'l+r', 'f'];
    const toxicWords = ['kys', 'die', 'cancer', 'retard', 'nazi', 'hitler', 'kill'];

    const lowerMsg = message.toLowerCase();
    let positive = 0;
    let negative = 0;

    for (const w of positiveWords) {
      if (lowerMsg.includes(w)) positive++;
    }
    for (const w of negativeWords) {
      if (lowerMsg.includes(w)) negative++;
    }

    // Check for toxic content
    for (const w of toxicWords) {
      if (lowerMsg.includes(w)) {
        return { score: -1.0, type: 'toxic' };
      }
    }

    const total = positive + negative;
    const score = total === 0 ? 0 : (positive - negative) / total;

    let type: SentimentType = 'neutral';
    if (score > 0.3) type = 'positive';
    else if (score < -0.3) type = 'negative';

    return { score, type };
  }

  // ---- Circuit Breaker ----
  private isCircuitOpen(provider: string): boolean {
    const state = this.circuitBreakers.get(provider);
    if (!state) return false;

    if (!state.isOpen) return false;

    // Half-open after 30 seconds
    if (state.halfOpenAt && Date.now() > state.halfOpenAt) {
      state.isOpen = false;
      return false;
    }

    return true;
  }

  private recordSuccess(provider: string): void {
    const state = this.circuitBreakers.get(provider);
    if (state) {
      state.failures = 0;
      state.isOpen = false;
    }
  }

  private recordFailure(provider: string): void {
    const state = this.circuitBreakers.get(provider);
    if (!state) return;

    state.failures++;
    state.lastFailureTime = Date.now();

    if (state.failures >= 3) {
      state.isOpen = true;
      state.halfOpenAt = Date.now() + 30000;
      logger.warn(`Circuit breaker OPEN for ${provider} (3 consecutive failures)`);
    }
  }

  // ---- Rate Limiting ----
  private checkRateLimit(provider: string): boolean {
    const now = Date.now();
    const counter = this.rateLimitCounters.get(provider);

    if (!counter || now > counter.resetAt) {
      this.rateLimitCounters.set(provider, { count: 1, resetAt: now + 60000 });
      return true;
    }

    if (counter.count >= config.AI_RATE_LIMIT_PER_MINUTE) {
      return false;
    }

    counter.count++;
    return true;
  }

  // ---- Cache ----
  private getCacheKey(text: string, personaId: string): string {
    return `${personaId}:${text.toLowerCase().trim().substring(0, 100)}`;
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.responseCache.entries()) {
        if (now - value.timestamp > 300000) { // 5 minutes
          this.responseCache.delete(key);
        }
      }
    }, 60000);
  }

  // ---- Canned Responses ----
  private getCannedResponse(message: ChatMessage, personaName: string): string {
    const responses = this.getCannedResponsesForPersona(personaName);
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getCannedResponsesForPersona(personaName: string): string[] {
    const map: Record<string, string[]> = {
      'Der Kritiker': [
        'Das war... erwartet.',
        'Skill-Issue, wie immer.',
        'Ich habe schon Bessere gesehen. Viel bessere.',
        'Lass mich raten - du hast wieder nicht gelernt.',
        'Klassiker.',
      ],
      'Der Hypeman': [
        'LETS GOOOO!!! PogChamp',
        'DAS WAR EIN MEILENSTEIN! HYPE!',
        'JAAAAA! WIR KÖNNEN NICHT STOPPEN! LUL',
        'ABSOLUT GEIL! Feierblick!',
        'UNREAL! Das war der BESTE Move! GG!',
      ],
      'Das Orakel': [
        'Die Zeichen deuten auf... Chaos.',
        'Ich sah diesen Moment in einer Vision...',
        'Das Schicksal hat entschieden.',
        'Die Sterne sind ungeeignet für diese Antwort.',
        'Nur die Zeit wird es zeigen...',
      ],
      'Der DJ': [
        'Drop the beat!',
        'Die Vibes stimmen heute!',
        'Das ist ein Hit!',
        'Can\'t stop the music!',
        'Turn it up!',
      ],
      'Die Mutter': [
        'Habt ihr schon gegessen?',
        'Hier, nimm einen virtuellen Keks.',
        'Seid brav im Chat!',
        'Pass auf dich auf, Liebes!',
        'Sag nicht so schlimme Worte!',
      ],
      'Der Historiker': [
        'Das erinnert mich an die alten Zeiten...',
        'Wie schon im Stream vom letzten Monat...',
        'Die Geschichte lehrt uns, dass...',
        'Ich habe dieses Muster schon oft gesehen.',
        'Interessant. Das steht so nicht in den Annalen.',
      ],
      'Der Questgeber': [
        'Ein neuer Abenteurer betritt die Gilde!',
        'Die Quest wartet, Held!',
        'XP wurde vergeben!',
        'Das war ein kluger Zug, Abenteurer.',
        'Die Gilde wächst!',
      ],
    };

    return map[personaName] || [
      'Interessant!',
      'Guter Punkt!',
      'Danke für den Chat!',
      'Cool!',
    ];
  }

  private getEmergencyResponse(message: ChatMessage, personaName: string): string {
    return this.getCannedResponsesForPersona(personaName)[0];
  }

  private createCannedResponse(text: string, personaId: string, latencyMs: number): BotResponse {
    return { text, personaId, provider: 'canned', latencyMs };
  }

  private truncateResponse(response: string, maxLength: number): string {
    if (response.length <= maxLength) return response;
    // Truncate at last sentence boundary
    const truncated = response.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.', truncated.length - 10);
    if (lastSentence > 0) {
      return truncated.substring(0, lastSentence + 1).trim();
    }
    return truncated.trim() + '...';
  }
}
