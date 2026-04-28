'use client';

import React, { useState } from 'react';
import { Users, ToggleLeft, ToggleRight, Thermometer, Save } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';

export default function PersonasPanel() {
  const { personas, activePersonaId, setActivePersona, updatePersona, togglePersona } = useDashboardStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');

  const startEdit = (id: string, prompt: string) => {
    setEditingId(id);
    setEditPrompt(prompt);
  };

  const saveEdit = (id: string) => {
    updatePersona(id, { systemPrompt: editPrompt });
    setEditingId(null);
    setEditPrompt('');
  };

  return (
    <div className="forge-panel space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="forge-section-title">
          <Users className="w-5 h-5 text-forge-purple-light" />
          Persona-Verwaltung
        </h2>
        <span className="text-xs text-forge-text-muted">
          {personas.filter((p) => p.enabled).length}/{personas.length} aktiv
        </span>
      </div>

      <div className="space-y-3">
        {personas.map((persona) => {
          const isActive = persona.id === activePersonaId;

          return (
            <div
              key={persona.id}
              className={`forge-card transition-all duration-200 overflow-hidden ${
                isActive ? 'border-forge-purple/50 glow-border' : ''
              }`}
            >
              {/* Header */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{persona.icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-forge-text">{persona.name}</h3>
                        {isActive && (
                          <span className="forge-badge-purple text-[10px]">AKTIV</span>
                        )}
                      </div>
                      <p className="text-xs text-forge-text-muted mt-0.5">{persona.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePersona(persona.id)}
                    className="flex-shrink-0"
                    title={persona.enabled ? 'Deaktivieren' : 'Aktivieren'}
                  >
                    {persona.enabled ? (
                      <ToggleRight className="w-8 h-8 text-forge-purple" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-forge-text-muted" />
                    )}
                  </button>
                </div>

                {/* Temperature Slider */}
                <div className="mt-3 flex items-center gap-3">
                  <Thermometer className="w-3.5 h-3.5 text-forge-text-muted flex-shrink-0" />
                  <span className="text-xs text-forge-text-muted w-20 flex-shrink-0">Temperatur</span>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.1"
                    value={persona.temperature}
                    onChange={(e) => updatePersona(persona.id, { temperature: parseFloat(e.target.value) })}
                    className="flex-1 h-1.5 bg-forge-border rounded-full appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                               [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
                               [&::-webkit-slider-thumb]:bg-forge-purple [&::-webkit-slider-thumb]:cursor-pointer
                               [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-forge-purple-light"
                  />
                  <span className="text-xs font-mono text-forge-text-dim w-8 text-right">
                    {persona.temperature.toFixed(1)}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2">
                  {!isActive && persona.enabled && (
                    <button
                      onClick={() => setActivePersona(persona.id)}
                      className="forge-btn-primary text-xs px-3 py-1"
                    >
                      Aktivieren
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(persona.id, persona.systemPrompt)}
                    className="forge-btn-secondary text-xs px-3 py-1"
                  >
                    Prompt bearbeiten
                  </button>
                </div>
              </div>

              {/* System Prompt Editor (collapsible) */}
              {editingId === persona.id && (
                <div className="border-t border-forge-border p-4 bg-forge-surface/50 animate-fade-in">
                  <label className="block text-xs font-medium text-forge-text-dim mb-2">
                    System-Prompt für {persona.name}
                  </label>
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    rows={4}
                    className="forge-input w-full text-xs resize-none font-mono leading-relaxed"
                    placeholder="System-Prompt eingeben..."
                  />
                  <div className="flex items-center gap-2 mt-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="forge-btn-secondary text-xs px-3 py-1"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => saveEdit(persona.id)}
                      className="forge-btn-primary text-xs px-3 py-1 flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      Speichern
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
