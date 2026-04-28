// ============================================================
// StreamForge AI Bot - Death Counter
// ============================================================

import { logger } from '../utils/logger';
import { StreamForgeDB } from '../utils/database';
import { config } from '../config';
import type { GameState } from '@streamforge/shared';

export class DeathCounter {
  private db: StreamForgeDB;

  constructor(db: StreamForgeDB) {
    this.db = db;
  }

  recordDeath(channelId: string): number {
    if (!config.ENABLE_DEATH_COUNTER) return 0;

    const newCount = this.db.incrementDeathCount(channelId);
    this.db.incrementStat(channelId, 'death_count');
    logger.info(`Death recorded for ${channelId}: total ${newCount}`);
    return newCount;
  }

  resetDeathCount(channelId: string): void {
    this.db.updateGameState(channelId, { deathCount: 0 });
    logger.info(`Death counter reset for ${channelId}`);
  }

  getDeathCount(channelId: string): number {
    const state = this.db.getGameState(channelId);
    return state.deathCount;
  }

  getDeathMessage(channelId: string, gameState: GameState, personaName: string): string {
    const count = gameState.deathCount;

    const messages: Record<string, (count: number, game: string) => string> = {
      'Der Kritiker': (c, g) => c === 0 ? 'Noch kein Tod. Beeindruckend... für dich.' :
        c === 1 ? 'Der erste Tod. Der Anfang vom Ende.' :
        c < 5 ? `${c} Tode. Konsistent unter dem Durchschnitt.` :
        c < 10 ? `${c} Tode. Das wird peinlich.` :
        `${c} Tode. Historisch schlecht.`,
      'Der Hypeman': (c, g) => c === 0 ? 'NO DEATHS! UNBESIEGBAR!' :
        c === 1 ? 'DER ERSTE DEATH! KOMMT NOCH ZURÜCK! LUL' :
        `${c} DEATHS! JEDER EIN HIGHLIGHT! PogChamp`,
      'Das Orakel': (c, g) => c === 0 ? 'Die Sterne sind gnädig heute...' :
        c === 1 ? 'Die erste Seele ist gefallen. Es werden mehr folgen.' :
        `${c} Seelen wandern nun ins Jenseits. Die Prophezeiung erfüllt sich.`,
      'Der DJ': (c, g) => `${c} Scratches of Death in "${g}". Drop the mic!`,
      'Die Mutter': (c, g) => c === 0 ? 'Noch kein Unfall! Gut gemacht, Liebes!' :
        c < 3 ? `Nur ${c} Mal gestorben. Du machst das schon! Hier, ein Keksi.` :
        `${c} Tode?! Pass besser auf dich auf! Hast du schon gegessen?!`,
      'Der Historiker': (c, g) => c === 0 ? 'Historischer Tag: Kein einziger Tod.' :
        `${c} Tode in "${g}". Zum Vergleich: Im Stream vom letzten Monat waren es ${Math.max(c - 5, 1)} an diesem Punkt.`,
      'Der Questgeber': (c, g) => c === 0 ? 'Keine Gefallenen! Die Quest geht weiter!' :
        `${c} gefallene Abenteurer. Die Quest wird härter!`,
    };

    const fn = messages[personaName];
    return fn ? fn(count, gameState.currentGame) : `${count} Tode in dieser Session.`;
  }
}
