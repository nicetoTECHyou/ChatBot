'use client';

import React, { useState } from 'react';
import { Cpu, Key, Globe, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, Save } from 'lucide-react';
import { useDashboardStore, type AIProvider } from '@/lib/store';

function ProviderCard({ provider }: { provider: AIProvider }) {
  const { updateProvider, toggleProvider, reorderProvider, providers } = useDashboardStore();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const canMoveUp = provider.priority > 1;
  const canMoveDown = provider.priority < providers.length;

  const typeIcons: Record<string, string> = {
    anthropic: '🧠',
    openai: '🤖',
    lmstudio: '🖥️',
    canned: '📦',
  };

  const typeColors: Record<string, string> = {
    anthropic: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
    openai: 'bg-green-500/15 border-green-500/30 text-green-400',
    lmstudio: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
    canned: 'bg-slate-500/15 border-slate-500/30 text-slate-400',
  };

  return (
    <div className="forge-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${typeColors[provider.type]}`}>
            <span className="text-lg">{typeIcons[provider.type]}</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-forge-text">{provider.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`forge-badge text-[10px] ${typeColors[provider.type]}`}>
                Priorität: {provider.priority}
              </span>
              {!provider.enabled && (
                <span className="forge-badge-red text-[10px]">Deaktiviert</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => canMoveUp && reorderProvider(provider.id, provider.priority - 1)}
            disabled={!canMoveUp}
            className={`p-1 rounded transition-colors ${
              canMoveUp ? 'hover:bg-forge-hover text-forge-text-muted hover:text-forge-text' : 'text-forge-border cursor-not-allowed'
            }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => canMoveDown && reorderProvider(provider.id, provider.priority + 1)}
            disabled={!canMoveDown}
            className={`p-1 rounded transition-colors ${
              canMoveDown ? 'hover:bg-forge-hover text-forge-text-muted hover:text-forge-text' : 'text-forge-border cursor-not-allowed'
            }`}
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button onClick={() => toggleProvider(provider.id)} className="flex-shrink-0">
            {provider.enabled ? (
              <ToggleRight className="w-7 h-7 text-forge-purple" />
            ) : (
              <ToggleLeft className="w-7 h-7 text-forge-text-muted" />
            )}
          </button>
        </div>
      </div>

      {/* Config fields */}
      <div className="mt-3 space-y-2">
        {/* API Key */}
        {(provider.type === 'anthropic' || provider.type === 'openai') && (
          <div>
            <label className="block text-xs text-forge-text-muted mb-1">
              <Key className="w-3 h-3 inline mr-1" />API-Key
            </label>
            <div className="relative">
              <input
                type={showKeys[provider.id] ? 'text' : 'password'}
                value={provider.apiKey || ''}
                onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                className="forge-input w-full text-xs font-mono pr-10"
                placeholder="sk-xxxxxxxxxxxxx"
              />
              <button
                onClick={() => setShowKeys((p) => ({ ...p, [provider.id]: !p[provider.id] }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-forge-text-muted hover:text-forge-text"
              >
                {showKeys[provider.id] ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        )}

        {/* Model selection */}
        {(provider.type === 'anthropic' || provider.type === 'openai' || provider.type === 'lmstudio') && (
          <div>
            <label className="block text-xs text-forge-text-muted mb-1">Modell</label>
            <select
              value={provider.config.model || ''}
              onChange={(e) =>
                updateProvider(provider.id, { config: { ...provider.config, model: e.target.value } })
              }
              className="forge-input w-full text-xs"
            >
              {provider.type === 'anthropic' && (
                <>
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                  <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                  <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                </>
              )}
              {provider.type === 'openai' && (
                <>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </>
              )}
              {provider.type === 'lmstudio' && (
                <>
                  <option value="local-model">Lokales Modell</option>
                  <option value="mistral-7b">Mistral 7B</option>
                  <option value="llama-3-8b">Llama 3 8B</option>
                  <option value="custom">Benutzerdefiniert</option>
                </>
              )}
            </select>
          </div>
        )}

        {/* LM Studio URL */}
        {provider.type === 'lmstudio' && (
          <div>
            <label className="block text-xs text-forge-text-muted mb-1">
              <Globe className="w-3 h-3 inline mr-1" />Server-URL
            </label>
            <input
              type="text"
              value={provider.url || ''}
              onChange={(e) => updateProvider(provider.id, { url: e.target.value })}
              className="forge-input w-full text-xs font-mono"
              placeholder="http://localhost:1234"
            />
          </div>
        )}

        {/* Canned responses note */}
        {provider.type === 'canned' && (
          <p className="text-xs text-forge-text-muted italic">
            Vorgefertigte Antworten werden automatisch verwendet, wenn keine KI-Anbieter verfügbar sind.
            Responses werden in der Bot-Konfiguration verwaltet.
          </p>
        )}
      </div>
    </div>
  );
}

export default function AIProvidersPanel() {
  const { providers } = useDashboardStore();
  const sortedProviders = [...providers].sort((a, b) => a.priority - b.priority);

  return (
    <div className="forge-panel space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="forge-section-title">
          <Cpu className="w-5 h-5 text-forge-purple-light" />
          KI-Anbieter
        </h2>
        <span className="text-xs text-forge-text-muted">
          Fallback-Reihenfolge: {sortedProviders.map((p) => p.name).join(' → ')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sortedProviders.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>

      <div className="forge-card p-4 bg-forge-purple/5 border-forge-purple/20">
        <h4 className="text-sm font-semibold text-forge-purple-light mb-1">💡 Reihenfolge-Tipp</h4>
        <p className="text-xs text-forge-text-dim leading-relaxed">
          Die Anbieter werden in der angegebenen Prioritätsreihenfolge abgefragt. Wenn ein Anbieter fehlschlägt,
          wird automatisch der nächste versucht. Canned Responses dienen als letzter Fallback.
        </p>
      </div>
    </div>
  );
}
