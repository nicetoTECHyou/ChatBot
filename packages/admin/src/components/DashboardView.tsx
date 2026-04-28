'use client';

import React from 'react';
import { MessageSquare, Bot, Skull, Swords, Gamepad2, Clock, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardStore } from '@/lib/store';
import DeathCounter from './DeathCounter';
import PersonaSwitcher from './PersonaSwitcher';

function StatCard({ icon, label, value, color, sub }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) {
  return (
    <div className="forge-card p-4 hover:border-forge-purple/30 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-forge-text-muted font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1 text-forge-text">{value}</p>
          {sub && <p className="text-xs text-forge-text-muted mt-1">{sub}</p>}
        </div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardView() {
  const { gameState, chatMessages, sentimentData } = useDashboardStore();
  const recentMessages = chatMessages.slice(-8).reverse();

  return (
    <div className="forge-panel space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<MessageSquare className="w-5 h-5 text-blue-400" />}
          label="Nachrichten"
          value={gameState.totalMessages.toLocaleString('de-DE')}
          color="bg-blue-500/15"
          sub="Gesamt in dieser Session"
        />
        <StatCard
          icon={<Bot className="w-5 h-5 text-forge-purple-light" />}
          label="KI-Antworten"
          value={gameState.aiResponses.toLocaleString('de-DE')}
          color="bg-forge-purple/15"
          sub={`${Math.round((gameState.aiResponses / Math.max(gameState.totalMessages, 1)) * 100)}% Antwortrate`}
        />
        <StatCard
          icon={<Swords className="w-5 h-5 text-orange-400" />}
          label="Aktive Quests"
          value={gameState.activeQuests}
          color="bg-orange-500/15"
          sub="Laufende Abenteuer"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-green-400" />}
          label="Zuschauer"
          value={gameState.viewerCount}
          color="bg-green-500/15"
          sub="Aktuell im Chat"
        />
      </div>

      {/* Middle Row: Death Counter + Active Persona + Game Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Death Counter */}
        <DeathCounter />

        {/* Active Persona */}
        <PersonaSwitcher />

        {/* Game State */}
        <div className="forge-card p-4">
          <h3 className="text-sm font-semibold text-forge-text-dim uppercase tracking-wider mb-3 flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-forge-purple-light" />
            Spielinfo
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-forge-text-muted">Spiel</span>
              <span className="text-sm font-medium text-forge-text">{gameState.currentGame}</span>
            </div>
            <div className="h-px bg-forge-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-forge-text-muted flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Session-Dauer
              </span>
              <span className="text-sm font-mono font-medium text-forge-text">{gameState.sessionTime}</span>
            </div>
            <div className="h-px bg-forge-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-forge-text-muted">Chat-Activity</span>
              <div className="flex gap-0.5">
                {[85, 65, 90, 45, 70, 80, 60].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-forge-purple/60"
                    style={{ height: `${h * 0.3}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Live Chat + Sentiment Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live Chat Feed */}
        <div className="forge-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-forge-text-dim uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-forge-purple-light" />
              Live-Chat
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-forge-text-muted">Echtzeit</span>
            </div>
          </div>
          <div className="flex-1 max-h-64 overflow-y-auto space-y-2">
            {recentMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-forge-text-muted text-sm py-8">
                Warte auf Chat-Nachrichten...
              </div>
            ) : (
              recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`animate-chat-in p-2 rounded-lg text-sm ${
                    msg.isBot
                      ? 'bg-forge-purple/10 border border-forge-purple/20'
                      : 'bg-forge-surface/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-xs ${
                      msg.isBot ? 'text-forge-purple-light' : 'text-blue-400'
                    }`}>
                      {msg.isBot ? '⚔️ SF-Bot' : msg.username}
                    </span>
                    <span className="text-[10px] text-forge-text-muted">
                      {msg.timestamp instanceof Date
                        ? msg.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                        : new Date(msg.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.persona && (
                      <span className="forge-badge-purple text-[10px]">{msg.persona}</span>
                    )}
                  </div>
                  <p className="text-forge-text-dim text-xs mt-0.5 leading-relaxed">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sentiment Chart */}
        <div className="forge-card p-4">
          <h3 className="text-sm font-semibold text-forge-text-dim uppercase tracking-wider mb-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
            Chat-Stimmung
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sentimentData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #2a2a3e',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#sentimentGradient)"
                  dot={{ r: 3, fill: '#a855f7', stroke: '#1a1a2e', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#c084fc' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
