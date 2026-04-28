'use client';

import React from 'react';
import { Zap, Settings, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';

export default function Header() {
  const { socketStatus, twitchConnected, kickConnected, setActivePanel } = useDashboardStore();

  return (
    <header className="h-16 bg-forge-surface/80 backdrop-blur-md border-b border-forge-border flex items-center justify-between px-4 lg:px-6 z-50">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-forge-purple/20 border border-forge-purple/30">
          <Zap className="w-5 h-5 text-forge-purple-light" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gradient leading-none">nicetoAIyou</h1>
          <p className="text-[10px] text-forge-text-muted leading-none mt-0.5">Admin Dashboard</p>
        </div>
      </div>

      {/* Center: Connection Status */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${twitchConnected ? 'bg-purple-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-forge-text-dim">
            <span className="text-purple-400 font-medium">Twitch</span>
            {twitchConnected ? ' ● Verbunden' : ' ○ Getrennt'}
          </span>
        </div>
        <div className="w-px h-4 bg-forge-border" />
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${kickConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-forge-text-dim">
            <span className="text-green-400 font-medium">Kick</span>
            {kickConnected ? ' ● Verbunden' : ' ○ Getrennt'}
          </span>
        </div>
        <div className="w-px h-4 bg-forge-border" />
        <div className="flex items-center gap-2">
          {socketStatus === 'connected' ? (
            <Wifi className="w-3.5 h-3.5 text-forge-purple" />
          ) : socketStatus === 'connecting' ? (
            <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-red-400" />
          )}
          <span className="text-xs text-forge-text-dim">
            {socketStatus === 'connected' ? 'Live' : socketStatus === 'connecting' ? 'Verbinde...' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Right: Settings */}
      <button
        onClick={() => setActivePanel('settings')}
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-forge-card border border-forge-border hover:border-forge-purple/40 transition-all duration-200 group"
      >
        <Settings className="w-4 h-4 text-forge-text-muted group-hover:text-forge-purple-light transition-colors" />
      </button>
    </header>
  );
}
