'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Trash2, Bot, User, Filter } from 'lucide-react';
import { useDashboardStore, type ChatMessage } from '@/lib/store';

export default function ChatPanel() {
  const { chatMessages, clearChat } = useDashboardStore();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'all' | 'user' | 'bot'>('all');

  const filteredMessages = chatMessages.filter((msg) => {
    if (filter === 'all') return true;
    if (filter === 'user') return !msg.isBot;
    if (filter === 'bot') return msg.isBot;
    return true;
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages.length]);

  const formatTime = (ts: Date | string) => {
    const d = ts instanceof Date ? ts : new Date(ts);
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="forge-panel space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="forge-section-title mb-0">
          <MessageSquare className="w-5 h-5 text-forge-purple-light" />
          Chat-Verlauf
          <span className="forge-badge-purple text-[10px] ml-2">{chatMessages.length} Nachrichten</span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-forge-card border border-forge-border rounded-lg p-0.5">
            {[
              { id: 'all' as const, label: 'Alle' },
              { id: 'user' as const, label: 'Chat' },
              { id: 'bot' as const, label: 'Bot' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                  filter === f.id
                    ? 'bg-forge-purple/20 text-forge-purple-light'
                    : 'text-forge-text-muted hover:text-forge-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={clearChat}
            className="p-2 rounded-lg text-forge-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Chat leeren"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 forge-card overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 max-h-[calc(100vh-280px)]">
          {filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-forge-text-muted text-sm">
              <div className="text-center">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Keine Nachrichten vorhanden</p>
                <p className="text-xs mt-1">Warte auf Chat-Events über Socket.IO...</p>
              </div>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => (
              <div
                key={msg.id}
                className={`animate-chat-in flex gap-2 p-2 rounded-lg text-sm ${
                  msg.isBot
                    ? 'bg-forge-purple/5 border border-forge-purple/10'
                    : idx % 2 === 0
                    ? 'bg-forge-surface/30'
                    : ''
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs mt-0.5">
                  {msg.isBot ? (
                    <div className="w-7 h-7 rounded-full bg-forge-purple/20 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-forge-purple-light" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-xs ${
                      msg.isBot ? 'text-forge-purple-light' : 'text-blue-400'
                    }`}>
                      {msg.isBot ? '⚔️ StreamForge' : msg.username}
                    </span>
                    <span className="text-[10px] text-forge-text-muted font-mono">
                      {formatTime(msg.timestamp)}
                    </span>
                    {msg.isBot && msg.persona && (
                      <span className="forge-badge-purple text-[9px]">{msg.persona}</span>
                    )}
                    <span className={`forge-badge text-[9px] ${
                      msg.platform === 'twitch' ? 'forge-badge-purple' : 'forge-badge-green'
                    }`}>
                      {msg.platform}
                    </span>
                  </div>
                  <p className="text-forge-text-dim text-xs mt-0.5 leading-relaxed break-words">
                    {msg.message}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
    </div>
  );
}
