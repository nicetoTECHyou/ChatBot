'use client';

import React, { useState } from 'react';
import { Radio, Plus, Trash2, ToggleLeft, ToggleRight, Key, Eye, EyeOff, Save } from 'lucide-react';
import { useDashboardStore, type Channel } from '@/lib/store';

export default function ChannelsPanel() {
  const { channels, addChannel, removeChannel, updateChannel, toggleChannel } = useDashboardStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPlatform, setNewPlatform] = useState<'twitch' | 'kick'>('twitch');
  const [newToken, setNewToken] = useState('');
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  const toggleTokenVisibility = (id: string) => {
    setShowTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    addChannel({
      name: newName.trim().toLowerCase(),
      platform: newPlatform,
      oauthToken: newToken,
      enabled: true,
      connected: false,
    });
    setNewName('');
    setNewToken('');
    setShowAdd(false);
  };

  return (
    <div className="forge-panel space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="forge-section-title">
          <Radio className="w-5 h-5 text-forge-purple-light" />
          Kanal-Verwaltung
        </h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="forge-btn-primary text-xs flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Hinzufügen
        </button>
      </div>

      {/* Add Channel Form */}
      {showAdd && (
        <div className="forge-card p-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-forge-text mb-3">Neuer Kanal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-forge-text-muted mb-1">Kanalname</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="forge-input w-full text-sm"
                placeholder="z.B. mychannel"
              />
            </div>
            <div>
              <label className="block text-xs text-forge-text-muted mb-1">Plattform</label>
              <select
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value as 'twitch' | 'kick')}
                className="forge-input w-full text-sm"
              >
                <option value="twitch">Twitch</option>
                <option value="kick">Kick</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-forge-text-muted mb-1">
                <Key className="w-3 h-3 inline mr-1" />
                OAuth Token
              </label>
              <input
                type="text"
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                className="forge-input w-full text-sm font-mono"
                placeholder="oauth:xxxxxxxxxx"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 justify-end">
            <button onClick={() => setShowAdd(false)} className="forge-btn-secondary text-xs px-3 py-1">
              Abbrechen
            </button>
            <button onClick={handleAdd} className="forge-btn-primary text-xs px-3 py-1">
              Hinzufügen
            </button>
          </div>
        </div>
      )}

      {/* Channel List */}
      <div className="space-y-3">
        {channels.length === 0 ? (
          <div className="forge-card p-8 text-center text-forge-text-muted text-sm">
            Keine Kanäle konfiguriert. Füge einen Kanal hinzu, um loszulegen.
          </div>
        ) : (
          channels.map((channel) => (
            <div key={channel.id} className="forge-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      channel.platform === 'twitch'
                        ? 'bg-purple-500/15 border border-purple-500/30'
                        : 'bg-green-500/15 border border-green-500/30'
                    }`}
                  >
                    <span className="text-lg">{channel.platform === 'twitch' ? '🟣' : '🟢'}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-forge-text">#{channel.name}</span>
                      <span className={`forge-badge text-[10px] ${
                        channel.platform === 'twitch' ? 'forge-badge-purple' : 'forge-badge-green'
                      }`}>
                        {channel.platform.toUpperCase()}
                      </span>
                      {channel.connected ? (
                        <span className="forge-badge-green text-[10px]">● Verbunden</span>
                      ) : (
                        <span className="forge-badge-red text-[10px]">○ Getrennt</span>
                      )}
                    </div>
                    {channel.oauthToken && (
                      <div className="flex items-center gap-1 mt-1">
                        <Key className="w-3 h-3 text-forge-text-muted" />
                        <span className="text-[10px] font-mono text-forge-text-muted">
                          {showTokens[channel.id] ? channel.oauthToken : '••••••••••••'}
                        </span>
                        <button
                          onClick={() => toggleTokenVisibility(channel.id)}
                          className="text-forge-text-muted hover:text-forge-text"
                        >
                          {showTokens[channel.id] ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleChannel(channel.id)}
                    className="flex-shrink-0"
                  >
                    {channel.enabled ? (
                      <ToggleRight className="w-7 h-7 text-forge-purple" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-forge-text-muted" />
                    )}
                  </button>
                  <button
                    onClick={() => removeChannel(channel.id)}
                    className="p-1.5 rounded-lg text-forge-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
