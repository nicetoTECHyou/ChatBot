'use client';

import React, { useEffect, useCallback } from 'react';
import { useDashboardStore, type PanelType, type ChatMessage } from '@/lib/store';
import { connectSocket, onSocket, offSocket, emitSocket, disconnectSocket } from '@/lib/socket';
import { clearCredentials, hasCredentials } from '@/lib/api';

import LoginScreen from '@/components/LoginScreen';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import DashboardView from '@/components/DashboardView';
import PersonasPanel from '@/components/PersonasPanel';
import ChannelsPanel from '@/components/ChannelsPanel';
import AIProvidersPanel from '@/components/AIProvidersPanel';
import ChatPanel from '@/components/ChatPanel';
import QuestsPanel from '@/components/QuestsPanel';
import LorePanel from '@/components/LorePanel';
import SettingsPanel from '@/components/SettingsPanel';

const panels: Record<PanelType, React.ReactNode> = {
  dashboard: <DashboardView />,
  personas: <PersonasPanel />,
  channels: <ChannelsPanel />,
  providers: <AIProvidersPanel />,
  chat: <ChatPanel />,
  quests: <QuestsPanel />,
  lore: <LorePanel />,
  settings: <SettingsPanel />,
};

export default function AdminDashboard() {
  const {
    isAuthenticated,
    activePanel,
    setSocketStatus,
    setTwitchConnected,
    setKickConnected,
    addChatMessage,
    setGameState,
    incrementDeaths,
    addSentimentPoint,
  } = useDashboardStore();

  // Handle socket events
  const handleChatMessage = useCallback((data: unknown) => {
    const msg = data as ChatMessage;
    addChatMessage({
      ...msg,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp as string),
    });
  }, [addChatMessage]);

  const handleDeath = useCallback(() => {
    incrementDeaths();
  }, [incrementDeaths]);

  const handleGameState = useCallback((data: unknown) => {
    setGameState(data as Partial<typeof setGameState>);
  }, [setGameState]);

  const handleConnectionStatus = useCallback((data: unknown) => {
    const status = data as { twitch?: boolean; kick?: boolean };
    if (status.twitch !== undefined) setTwitchConnected(status.twitch);
    if (status.kick !== undefined) setKickConnected(status.kick);
  }, [setTwitchConnected, setKickConnected]);

  const handleSentiment = useCallback((data: unknown) => {
    const s = data as { value: number; label: string };
    addSentimentPoint(s.value, s.label);
  }, [addSentimentPoint]);

  // Setup socket connection
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = connectSocket();
    setSocketStatus('connecting');

    onSocket('connected', () => setSocketStatus('connected'));
    onSocket('disconnected', () => setSocketStatus('disconnected'));
    onSocket('__connected', () => setSocketStatus('connected'));
    onSocket('__disconnected', () => setSocketStatus('disconnected'));

    onSocket('chat:message', handleChatMessage);
    onSocket('game:death', handleDeath);
    onSocket('game:state', handleGameState);
    onSocket('connection:status', handleConnectionStatus);
    onSocket('chat:sentiment', handleSentiment);

    // Simulate some demo messages for testing
    const demoTimer = setTimeout(() => {
      const demoMessages = [
        { username: 'PixelKrieger', message: 'Hey StreamForge, was geht?! 🔥', platform: 'twitch' as const },
        { username: 'LootQueen', message: 'Das war ein krasser Move!', platform: 'twitch' as const },
        { username: 'NoobSlayer42', message: 'Der Kritiker soll mal bewerten 😂', platform: 'twitch' as const },
      ];
      demoMessages.forEach((m, i) => {
        setTimeout(() => {
          addChatMessage({
            username: m.username,
            message: m.message,
            platform: m.platform,
            isBot: false,
            timestamp: new Date(),
          });
          // Bot response after a delay
          setTimeout(() => {
            const responses = [
              '🔥 JAAA! Das war EPISCH! Weiter so, LEGEND! 🔥🔥🔥',
              'Kritische Analyse: Das war technisch gesehen akzeptabel... für einen Anfänger. 🧐',
              '✨ Die Energien sind HEUTE unglaublich! Spürt ihr das?! ✨',
            ];
            addChatMessage({
              username: 'StreamForge',
              message: responses[i % responses.length],
              platform: m.platform,
              isBot: true,
              timestamp: new Date(),
              persona: ['Der Hypeman', 'Der Kritiker', 'Das Orakel'][i % 3],
            });
          }, 1500);
        }, i * 3000);
      });
    }, 2000);

    return () => {
      clearTimeout(demoTimer);
      offSocket('chat:message', handleChatMessage);
      offSocket('game:death', handleDeath);
      offSocket('game:state', handleGameState);
      offSocket('connection:status', handleConnectionStatus);
      offSocket('chat:sentiment', handleSentiment);
      disconnectSocket();
    };
  }, [isAuthenticated, handleChatMessage, handleDeath, handleGameState, handleConnectionStatus, handleSentiment, setSocketStatus, addChatMessage, addSentimentPoint]);

  // Session time ticker
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const now = new Date();
      const sessionSeconds = 9252 + Math.floor((Date.now() % 100000) / 1000); // Demo offset
      const hours = Math.floor(sessionSeconds / 3600);
      const minutes = Math.floor((sessionSeconds % 3600) / 60);
      const seconds = sessionSeconds % 60;
      setGameState({
        sessionTime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, setGameState]);

  // Not authenticated → show login
  if (!isAuthenticated || !hasCredentials()) {
    return <LoginScreen />;
  }

  // Authenticated → show dashboard
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden bg-forge-bg">
          <div className="h-full animate-fade-in" key={activePanel}>
            {panels[activePanel]}
          </div>
        </main>
      </div>
    </div>
  );
}
