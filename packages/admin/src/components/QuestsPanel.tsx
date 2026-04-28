'use client';

import React from 'react';
import { Swords, Play, Pause, Trash2, Trophy, Plus } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';

export default function QuestsPanel() {
  const { quests, updateQuest, deleteQuest } = useDashboardStore();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="forge-badge-green text-[10px]">● Aktiv</span>;
      case 'completed':
        return <span className="forge-badge-purple text-[10px]">✓ Abgeschlossen</span>;
      case 'paused':
        return <span className="forge-badge-yellow text-[10px]">⏸ Pausiert</span>;
      default:
        return null;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-forge-purple';
      case 'completed':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-forge-border';
    }
  };

  return (
    <div className="forge-panel space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="forge-section-title">
          <Swords className="w-5 h-5 text-forge-purple-light" />
          Quest-System
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-forge-text-muted">
            {quests.filter((q) => q.status === 'active').length} aktiv
          </span>
        </div>
      </div>

      {/* Active Quests */}
      {quests.filter((q) => q.status === 'active').length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-forge-text-muted uppercase tracking-wider mb-2">
            Aktive Quests
          </h3>
          <div className="space-y-3">
            {quests
              .filter((q) => q.status === 'active')
              .map((quest) => (
                <div key={quest.id} className="forge-card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-forge-text">{quest.title}</h4>
                        {getStatusBadge(quest.status)}
                      </div>
                      <p className="text-xs text-forge-text-muted mt-1">{quest.description}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-forge-text-dim">Fortschritt</span>
                      <span className="font-mono text-forge-text">
                        {quest.progress}/{quest.maxProgress}
                        <span className="text-forge-text-muted ml-1">
                          ({Math.round((quest.progress / quest.maxProgress) * 100)}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-forge-surface rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(quest.status)}`}
                        style={{ width: `${(quest.progress / quest.maxProgress) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Rewards */}
                  {quest.rewards.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      {quest.rewards.map((reward, idx) => (
                        <span key={idx} className="forge-badge-yellow text-[10px]">
                          {reward}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => updateQuest(quest.id, {
                        progress: Math.min(quest.progress + 1, quest.maxProgress),
                        status: quest.progress + 1 >= quest.maxProgress ? 'completed' : 'active',
                      })}
                      className="forge-btn-success text-xs px-2 py-1 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      +1
                    </button>
                    <button
                      onClick={() =>
                        updateQuest(quest.id, {
                          status: quest.status === 'active' ? 'paused' : 'active',
                        })
                      }
                      className="forge-btn-secondary text-xs px-2 py-1 flex items-center gap-1"
                    >
                      {quest.status === 'active' ? (
                        <>
                          <Pause className="w-3 h-3" /> Pausieren
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" /> Fortsetzen
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteQuest(quest.id)}
                      className="p-1.5 rounded-lg text-forge-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Completed Quests */}
      {quests.filter((q) => q.status === 'completed').length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-forge-text-muted uppercase tracking-wider mb-2">
            Abgeschlossen
          </h3>
          <div className="space-y-2">
            {quests
              .filter((q) => q.status === 'completed')
              .map((quest) => (
                <div key={quest.id} className="forge-card p-3 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🏆</span>
                      <span className="font-medium text-sm text-forge-text line-through">
                        {quest.title}
                      </span>
                    </div>
                    {getStatusBadge(quest.status)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Paused Quests */}
      {quests.filter((q) => q.status === 'paused').length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-forge-text-muted uppercase tracking-wider mb-2">
            Pausiert
          </h3>
          <div className="space-y-2">
            {quests
              .filter((q) => q.status === 'paused')
              .map((quest) => (
                <div key={quest.id} className="forge-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">⏸️</span>
                      <span className="font-medium text-sm text-forge-text">{quest.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(quest.status)}
                      <button
                        onClick={() => updateQuest(quest.id, { status: 'active' })}
                        className="forge-btn-success text-[10px] px-2 py-0.5 flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" /> Fortsetzen
                      </button>
                      <button
                        onClick={() => deleteQuest(quest.id)}
                        className="p-1 rounded text-forge-text-muted hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {quests.length === 0 && (
        <div className="forge-card p-8 text-center text-forge-text-muted text-sm">
          <Swords className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Keine Quests vorhanden</p>
          <p className="text-xs mt-1">Quests werden automatisch durch den Bot erstellt.</p>
        </div>
      )}
    </div>
  );
}
