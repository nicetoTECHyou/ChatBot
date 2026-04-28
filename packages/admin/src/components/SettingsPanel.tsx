'use client';

import React, { useState } from 'react';
import { Settings, Lock, User, ToggleLeft, ToggleRight, Save, Shield, Zap, Clock, RotateCcw } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';
import { clearCredentials } from '@/lib/api';

export default function SettingsPanel() {
  const { settings, updateSettings, personas, setIsAuthenticated } = useDashboardStore();
  const [passwordData, setPasswordData] = useState({
    current: '',
    newPassword: '',
    confirm: '',
  });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  const handleChangePassword = () => {
    if (!passwordData.newPassword || !passwordData.confirm) {
      setPasswordMsg('Bitte alle Felder ausfüllen');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirm) {
      setPasswordMsg('Passwörter stimmen nicht überein');
      return;
    }
    setPasswordMsg('✓ Passwort erfolgreich geändert');
    setPasswordData({ current: '', newPassword: '', confirm: '' });
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  const handleSave = () => {
    setSaveMsg('✓ Einstellungen gespeichert');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handleLogout = () => {
    clearCredentials();
    setIsAuthenticated(false);
  };

  const toggleFeature = (key: keyof typeof settings.featureToggles) => {
    updateSettings({
      featureToggles: {
        ...settings.featureToggles,
        [key]: !settings.featureToggles[key],
      },
    });
  };

  return (
    <div className="forge-panel space-y-6">
      <h2 className="forge-section-title">
        <Settings className="w-5 h-5 text-forge-purple-light" />
        Einstellungen
      </h2>

      {/* Admin Password */}
      <div className="forge-card p-5">
        <h3 className="text-sm font-semibold text-forge-text flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-forge-purple-light" />
          Admin-Passwort ändern
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-forge-text-muted mb-1">Aktuelles Passwort</label>
            <input
              type="password"
              value={passwordData.current}
              onChange={(e) => setPasswordData((d) => ({ ...d, current: e.target.value }))}
              className="forge-input w-full text-sm"
              placeholder="••••••"
            />
          </div>
          <div>
            <label className="block text-xs text-forge-text-muted mb-1">Neues Passwort</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData((d) => ({ ...d, newPassword: e.target.value }))}
              className="forge-input w-full text-sm"
              placeholder="••••••"
            />
          </div>
          <div>
            <label className="block text-xs text-forge-text-muted mb-1">Bestätigung</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData((d) => ({ ...d, confirm: e.target.value }))}
                className="forge-input flex-1 text-sm"
                placeholder="••••••"
              />
              <button onClick={handleChangePassword} className="forge-btn-primary text-xs px-3">
                Speichern
              </button>
            </div>
          </div>
        </div>
        {passwordMsg && (
          <p className={`text-xs mt-2 ${passwordMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
            {passwordMsg}
          </p>
        )}
      </div>

      {/* Default Persona */}
      <div className="forge-card p-5">
        <h3 className="text-sm font-semibold text-forge-text flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-forge-purple-light" />
          Standard-Persona
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => updateSettings({ defaultPersona: p.id })}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all duration-200 ${
                settings.defaultPersona === p.id
                  ? 'bg-forge-purple/15 border-forge-purple/40'
                  : 'bg-forge-surface border-forge-border hover:border-forge-purple/20'
              }`}
            >
              <span className="text-xl">{p.icon}</span>
              <span className={`text-[10px] font-medium ${
                settings.defaultPersona === p.id ? 'text-forge-purple-light' : 'text-forge-text-muted'
              }`}>
                {p.name.replace('Der ', '').replace('Das ', '').replace('Die ', '')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="forge-card p-5">
        <h3 className="text-sm font-semibold text-forge-text flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-forge-purple-light" />
          Feature-Toggles
        </h3>
        <div className="space-y-3">
          {[
            { key: 'chatResponses' as const, label: 'Chat-Antworten', desc: 'KI reagiert auf Chat-Nachrichten' },
            { key: 'questSystem' as const, label: 'Quest-System', desc: 'Automatische Quests im Chat' },
            { key: 'deathCounter' as const, label: 'Todeszähler', desc: 'Zählt und reagiert auf Tode im Spiel' },
            { key: 'loreSystem' as const, label: 'Lore-System', desc: 'KI nutzt Lore-Datenbank für Kontext' },
            { key: 'sentiment' as const, label: 'Stimmungsanalyse', desc: 'Analysiert Chat-Stimmung in Echtzeit' },
          ].map((feature) => (
            <div
              key={feature.key}
              className="flex items-center justify-between py-2 border-b border-forge-border/50 last:border-0"
            >
              <div>
                <p className="text-sm text-forge-text">{feature.label}</p>
                <p className="text-xs text-forge-text-muted">{feature.desc}</p>
              </div>
              <button onClick={() => toggleFeature(feature.key)}>
                {settings.featureToggles[feature.key] ? (
                  <ToggleRight className="w-8 h-8 text-forge-purple" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-forge-text-muted" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Rate Limiting */}
      <div className="forge-card p-5">
        <h3 className="text-sm font-semibold text-forge-text flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-forge-purple-light" />
          Rate-Limiting
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-forge-text-muted mb-1">Nachrichten / Minute</label>
            <input
              type="number"
              min={1}
              max={100}
              value={settings.rateLimiting.messagesPerMinute}
              onChange={(e) =>
                updateSettings({
                  rateLimiting: {
                    ...settings.rateLimiting,
                    messagesPerMinute: parseInt(e.target.value) || 30,
                  },
                })
              }
              className="forge-input w-full text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-forge-text-muted mb-1">KI-Antworten / Minute</label>
            <input
              type="number"
              min={1}
              max={50}
              value={settings.rateLimiting.aiResponsesPerMinute}
              onChange={(e) =>
                updateSettings({
                  rateLimiting: {
                    ...settings.rateLimiting,
                    aiResponsesPerMinute: parseInt(e.target.value) || 10,
                  },
                })
              }
              className="forge-input w-full text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-forge-text-muted mb-1">Cooldown (Sek.)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={settings.rateLimiting.cooldownSeconds}
              onChange={(e) =>
                updateSettings({
                  rateLimiting: {
                    ...settings.rateLimiting,
                    cooldownSeconds: parseInt(e.target.value) || 5,
                  },
                })
              }
              className="forge-input w-full text-sm font-mono"
            />
          </div>
        </div>
      </div>

      {/* Save & Logout */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleLogout}
          className="forge-btn-danger flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Abmelden
        </button>
        <button onClick={handleSave} className="forge-btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          Einstellungen speichern
        </button>
      </div>

      {saveMsg && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2 text-sm text-green-400 animate-fade-in">
          {saveMsg}
        </div>
      )}
    </div>
  );
}
