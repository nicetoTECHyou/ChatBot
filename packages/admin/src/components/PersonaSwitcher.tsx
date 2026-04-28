'use client';

import React, { useState } from 'react';
import { User, ChevronDown } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';

export default function PersonaSwitcher() {
  const { personas, activePersonaId, setActivePersona } = useDashboardStore();
  const [isOpen, setIsOpen] = useState(false);

  const activePersona = personas.find((p) => p.id === activePersonaId);

  if (!activePersona) return null;

  return (
    <div className="forge-card p-4">
      <h3 className="text-sm font-semibold text-forge-text-dim uppercase tracking-wider mb-3 flex items-center gap-2">
        <User className="w-4 h-4 text-forge-purple-light" />
        Aktive Persona
      </h3>

      {/* Current Persona Display */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-3xl">{activePersona.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-forge-text text-sm truncate">{activePersona.name}</p>
          <p className="text-xs text-forge-text-muted line-clamp-2">{activePersona.description}</p>
        </div>
      </div>

      {/* Persona Selector */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="forge-btn-secondary w-full flex items-center justify-between text-xs"
        >
          <span>Persona wechseln</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 forge-card p-1 z-50 max-h-48 overflow-y-auto animate-fade-in">
            {personas
              .filter((p) => p.enabled)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePersona(p.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                    p.id === activePersonaId
                      ? 'bg-forge-purple/20 text-forge-purple-light'
                      : 'hover:bg-forge-hover text-forge-text-dim'
                  }`}
                >
                  <span>{p.icon}</span>
                  <span className="truncate">{p.name}</span>
                  {p.id === activePersonaId && (
                    <span className="ml-auto text-[10px] text-forge-purple">AKTIV</span>
                  )}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
