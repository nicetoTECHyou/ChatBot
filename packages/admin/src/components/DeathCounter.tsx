'use client';

import React, { useEffect, useRef } from 'react';
import { Skull, RotateCcw, Plus } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';

export default function DeathCounter() {
  const { gameState, incrementDeaths, resetDeaths } = useDashboardStore();
  const [animate, setAnimate] = React.useState(false);
  const prevDeaths = useRef(gameState.deaths);

  useEffect(() => {
    if (gameState.deaths !== prevDeaths.current) {
      setAnimate(true);
      const t = setTimeout(() => setAnimate(false), 300);
      prevDeaths.current = gameState.deaths;
      return () => clearTimeout(t);
    }
  }, [gameState.deaths]);

  return (
    <div className="forge-card p-4 flex flex-col items-center justify-center glow-border">
      <h3 className="text-sm font-semibold text-forge-text-dim uppercase tracking-wider mb-4 flex items-center gap-2">
        <Skull className="w-4 h-4 text-red-400" />
        Todeszähler
      </h3>

      <div
        className={`text-6xl font-bold text-red-400 tabular-nums my-4 ${
          animate ? 'animate-count-up' : ''
        }`}
      >
        {gameState.deaths}
      </div>

      <p className="text-xs text-forge-text-muted mb-4">
        {gameState.deaths === 0
          ? 'Noch kein Tod — sauber spielen! 🎯'
          : gameState.deaths < 10
          ? 'Das kann noch besser werden...'
          : gameState.deaths < 50
          ? 'Tryhard-Modus aktiviert 💪'
          : 'Git Gud? Ne, einfach weiter sterben 💀'}
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={incrementDeaths}
          className="forge-btn-danger flex items-center gap-1.5 px-3 py-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">+1</span>
        </button>
        <button
          onClick={resetDeaths}
          className="forge-btn-secondary flex items-center gap-1.5 px-3 py-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-xs">Zurücksetzen</span>
        </button>
      </div>
    </div>
  );
}
